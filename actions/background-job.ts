"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all background jobs with pagination and filters
 */
export async function getBackgroundJobs(params: {
  status?: string;
  jobType?: string;
  page?: number;
  pageSize?: number;
}) {
  const admin = await requireAdmin();

  const pageNum = params.page || 1;
  const pageSize = params.pageSize || 20;
  const skip = (pageNum - 1) * pageSize;

  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.jobType) {
    where.jobType = params.jobType;
  }

  const [jobs, total] = await Promise.all([
    prisma.backgroundJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.backgroundJob.count({ where }),
  ]);

  // Fetch company names separately
  const companyIds = [...new Set(jobs.map(j => j.companyId))];
  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, name: true },
  });
  const companyMap = new Map(companies.map(c => [c.id, c.name]));

  const jobsWithCompany = jobs.map(job => ({
    ...job,
    company: { id: job.companyId, name: companyMap.get(job.companyId) || "Unknown" },
  }));

  return {
    jobs: jobsWithCompany,
    pagination: {
      page: pageNum,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Retry a failed job - reset to PENDING and clear error
 */
export async function retryJobAction(jobId: string) {
  const admin = await requireAdmin();

  const job = await prisma.backgroundJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return { error: "Job không tồn tại" };
  }

  if (job.status === "RUNNING") {
    return { error: "Không thể retry job đang chạy" };
  }

  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: "PENDING",
      errorMsg: null,
      attempts: 0,
      startedAt: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset expiry
    },
  });

  // Re-execute the job
  if (job.jobType === "GENERATE_REVIEWS") {
    const { executeReviewGeneration } = await import("@/actions/review");
    executeReviewGeneration(jobId).catch(console.error);
  }

  revalidatePath("/admin/background-jobs");
  return { success: true };
}

/**
 * Cancel a pending/running job
 */
export async function cancelJobAction(jobId: string) {
  const admin = await requireAdmin();

  const job = await prisma.backgroundJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return { error: "Job không tồn tại" };
  }

  if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
    return { error: "Không thể hủy job đã hoàn thành hoặc thất bại" };
  }

  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/background-jobs");
  return { success: true };
}

/**
 * Get job statistics
 */
export async function getJobStats() {
  const admin = await requireAdmin();

  const stats = await Promise.all([
    prisma.backgroundJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.backgroundJob.groupBy({
      by: ["jobType"],
      _count: { id: true },
    }),
  ]);

  return {
    byStatus: stats[0].reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>),
    byType: stats[1].reduce((acc, curr) => {
      acc[curr.jobType] = curr._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
}
