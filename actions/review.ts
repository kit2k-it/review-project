"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { reviewSubmitSchema } from "@/lib/validators";

// ==========================================
// SUBMIT REVIEW (from scan page - no auth required)
// ==========================================
export async function submitReviewAction(formData: FormData) {
  const raw = {
    reviewId: formData.get("reviewId") as string,
    content: formData.get("content") as string,
    rating: Number(formData.get("rating")),
  };

  if (!raw.reviewId || !raw.content || !raw.rating) {
    return { error: "Dữ liệu không hợp lệ" };
  }

  const review = await prisma.review.findUnique({
    where: { id: raw.reviewId },
  });

  if (!review) {
    return { error: "Đánh giá không tồn tại" };
  }

  if (review.status === "SUBMITTED") {
    return { error: "Đánh giá này đã được gửi trước đó" };
  }

  await prisma.review.update({
    where: { id: raw.reviewId },
    data: {
      content: raw.content,
      rating: raw.rating,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return { success: true };
}

// ==========================================
// MARK REVIEW AS DONE (copy URL opened)
// Called when user clicks "Copy và Gửi" - marks review as submitted
// ==========================================
export async function markReviewAsDoneAction(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return { error: "Đánh giá không tồn tại" };
  }

  if (review.status === "SUBMITTED") {
    return { success: true }; // Already done
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return { success: true };
}

// ==========================================
// GET REVIEWS (dashboard)
// ==========================================
export async function getReviewsAction(params: {
  companyId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await requireAuth();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const where = {
    company: { userId: user.id },
    ...(params.companyId && { companyId: params.companyId }),
    ...(params.status && { status: params.status as "PENDING" | "SUBMITTED" | "EXPIRED" }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        company: { select: { name: true } },
        qrCode: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ==========================================
// BACKGROUND REVIEW GENERATION
// Triggered when pre-generated pool is low
// ==========================================
export async function generateReviewsForCompany(companyId: string) {
  // Check if there's already a pending/running job
  const existingJob = await prisma.backgroundJob.findFirst({
    where: {
      companyId,
      jobType: "GENERATE_REVIEWS",
      status: { in: ["PENDING", "RUNNING"] },
      expiresAt: { gt: new Date() },
    },
  });

  if (existingJob) {
    console.log(`[BackgroundJob] Job already exists for company ${companyId}: ${existingJob.id}`);
    return;
  }

  // Create a pending job
  const job = await prisma.backgroundJob.create({
    data: {
      companyId,
      jobType: "GENERATE_REVIEWS",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    },
  });

  // Execute asynchronously (don't await)
  executeReviewGeneration(job.id).catch((err) => {
    console.error(`[BackgroundJob] Job ${job.id} failed:`, err);
  });
}

async function executeReviewGeneration(jobId: string) {
  const THRESHOLD = Number(process.env.REVIEW_THRESHOLD || "10");
  const BATCH_SIZE = Number(process.env.REVIEW_BATCH_SIZE || "15");

  // Mark job as running
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });

  const job = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const company = await prisma.company.findUnique({ where: { id: job.companyId } });
  if (!company) {
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMsg: "Company not found" },
    });
    return;
  }

  // Check current pool size
  const availableCount = await prisma.preGeneratedReview.count({
    where: { companyId: company.id, isUsed: false },
  });

  if (availableCount >= THRESHOLD) {
    // No need to generate, cancel job
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED" },
    });
    console.log(`[BackgroundJob] ${jobId} cancelled — enough reviews (${availableCount})`);
    return;
  }

  try {
    // Dynamic import to avoid bundling OpenAI in main thread
    const { generateReviewTexts } = await import("@/lib/openai");

    const reviewTexts = await generateReviewTexts(
      company.name,
      company.category,
      BATCH_SIZE
    );

    // Batch insert reviews
    await prisma.preGeneratedReview.createMany({
      data: reviewTexts.map((r) => ({
        companyId: company.id,
        content: r.content,
        rating: r.rating,
      })),
    });

    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result: { generatedCount: reviewTexts.length },
      },
    });

    console.log(`[BackgroundJob] ${jobId} completed — generated ${reviewTexts.length} reviews`);
  } catch (error) {
    const attempts = job.attempts + 1;
    if (attempts >= job.maxAttempts) {
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMsg: String(error),
          attempts,
        },
      });
    } else {
      // Reschedule with delay
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "PENDING",
          errorMsg: String(error),
          attempts,
        },
      });
    }
    throw error;
  }
}

// ==========================================
// CHECK & TRIGGER GENERATION (called from scan API)
// If pool is low, reset oldest used reviews so they can be reused
// ==========================================
export async function checkAndTriggerGeneration(companyId: string) {
  const THRESHOLD = Number(process.env.REVIEW_THRESHOLD || "10");

  const [availableCount, pendingJob] = await Promise.all([
    prisma.preGeneratedReview.count({
      where: { companyId, isUsed: false },
    }),
    prisma.backgroundJob.findFirst({
      where: {
        companyId,
        jobType: "GENERATE_REVIEWS",
        status: { in: ["PENDING", "RUNNING"] },
      },
    }),
  ]);

  if (availableCount < THRESHOLD && !pendingJob) {
    // Reset oldest used reviews so they can be reused
    await prisma.preGeneratedReview.updateMany({
      where: { companyId, isUsed: true },
      data: { isUsed: false, usedAt: null },
    });
    return { triggered: true, availableCount };
  }

  return { triggered: false, availableCount };
}

// ==========================================
// GET PRE-GENERATED REVIEWS (dashboard)
// ==========================================
export async function getPreGeneratedReviewsAction(params: {
  companyId?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await requireAuth();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  // If companyId provided, verify ownership
  if (params.companyId) {
    const company = await prisma.company.findUnique({ where: { id: params.companyId } });
    if (!company || company.userId !== user.id) return { error: "Không có quyền" };
  }

  const where = {
    ...(params.companyId ? { companyId: params.companyId } : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.preGeneratedReview.findMany({
      where,
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.preGeneratedReview.count({ where }),
  ]);

  return {
    reviews,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ==========================================
// GET COMPANY REVIEW POOL STATUS
// ==========================================
export async function getCompanyReviewPoolAction(companyId: string) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.userId !== user.id) return { error: "Không có quyền" };

  const [available, used, pendingJob] = await Promise.all([
    prisma.preGeneratedReview.count({ where: { companyId, isUsed: false } }),
    prisma.preGeneratedReview.count({ where: { companyId, isUsed: true } }),
    prisma.backgroundJob.findFirst({
      where: {
        companyId,
        jobType: "GENERATE_REVIEWS",
        status: { in: ["PENDING", "RUNNING"] },
      },
    }),
  ]);

  return { companyId, available, used, pendingJob: !!pendingJob };
}

// ==========================================
// CREATE PRE-GENERATED REVIEW MANUALLY
// ==========================================
export async function createPreGeneratedReviewAction(data: {
  companyId: string;
  content: string;
  rating: number;
}) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company || company.userId !== user.id) {
    return { error: "Không có quyền truy cập công ty này" };
  }

  if (!data.content || data.content.trim().length < 10) {
    return { error: "Nội dung đánh giá phải có ít nhất 10 ký tự" };
  }

  if (data.rating < 1 || data.rating > 5) {
    return { error: "Số sao phải từ 1 đến 5" };
  }

  const review = await prisma.preGeneratedReview.create({
    data: {
      companyId: data.companyId,
      content: data.content.trim(),
      rating: data.rating,
      isManuallyCreated: true,
      isActive: true,
    },
  });

  revalidatePath(`/companies/${data.companyId}/reviews`);

  return { success: true, review };
}

// ==========================================
// UPDATE PRE-GENERATED REVIEW
// ==========================================
export async function updatePreGeneratedReviewAction(data: {
  reviewId: string;
  content: string;
  rating: number;
}) {
  const user = await requireAuth();

  const review = await prisma.preGeneratedReview.findUnique({
    where: { id: data.reviewId },
    include: { company: { select: { userId: true } } },
  });

  if (!review) {
    return { error: "Không tìm thấy đánh giá" };
  }

  if (review.company.userId !== user.id) {
    return { error: "Không có quyền chỉnh sửa đánh giá này" };
  }

  if (!data.content || data.content.trim().length < 10) {
    return { error: "Nội dung đánh giá phải có ít nhất 10 ký tự" };
  }

  if (data.rating < 1 || data.rating > 5) {
    return { error: "Số sao phải từ 1 đến 5" };
  }

  const updated = await prisma.preGeneratedReview.update({
    where: { id: data.reviewId },
    data: {
      content: data.content.trim(),
      rating: data.rating,
    },
  });

  return { success: true, review: updated };
}

// ==========================================
// DEACTIVATE / ACTIVATE PRE-GENERATED REVIEW
// ==========================================
export async function togglePreGeneratedReviewActiveAction(reviewId: string) {
  const user = await requireAuth();

  const review = await prisma.preGeneratedReview.findUnique({
    where: { id: reviewId },
    include: { company: { select: { userId: true } } },
  });

  if (!review) {
    return { error: "Không tìm thấy đánh giá" };
  }

  if (review.company.userId !== user.id) {
    return { error: "Không có quyền thao tác với đánh giá này" };
  }

  const updated = await prisma.preGeneratedReview.update({
    where: { id: reviewId },
    data: { isActive: !review.isActive },
  });

  return { success: true, review: updated };
}
