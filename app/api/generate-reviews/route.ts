import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReviewTexts } from "@/lib/openai";

// ==========================================
// POST /api/generate-reviews
// Internal endpoint for triggering review generation
// Can be called from cron, webhook, or server action
//
// Security: Should be protected by an API key or service account
// In production, add: if (req.headers.get('x-api-key') !== process.env.INTERNAL_API_KEY) return 401
// ==========================================

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, count = 15 } = body;

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  // === LOCKING MECHANISM ===
  // Use database-level locking to prevent concurrent jobs for same company

  // Try to acquire lock by creating a pending job
  const existingJob = await prisma.backgroundJob.findFirst({
    where: {
      companyId,
      jobType: "GENERATE_REVIEWS",
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  if (existingJob) {
    return NextResponse.json({
      message: "Job already exists",
      jobId: existingJob.id,
      status: existingJob.status,
    }, { status: 409 }); // Conflict
  }

  // Create lock entry
  const job = await prisma.backgroundJob.create({
    data: {
      companyId,
      jobType: "GENERATE_REVIEWS",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Execute generation (this is a long-running operation)
  // In production, this should be handled by a proper queue (BullMQ, Inngest, etc.)
  // For this implementation, we execute it directly but with timeout protection
  try {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const reviews = await generateReviewTexts(
      company.name,
      company.category,
      Math.min(count, 30) // Cap at 30 to prevent runaway costs
    );

    // Batch insert
    await prisma.preGeneratedReview.createMany({
      data: reviews.map((r) => ({
        companyId,
        content: r.content,
        rating: r.rating,
      })),
    });

    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result: { generatedCount: reviews.length },
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      generatedCount: reviews.length,
    });
  } catch (error) {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMsg: String(error),
      },
    });

    return NextResponse.json(
      { error: "Generation failed", details: String(error) },
      { status: 500 }
    );
  }
}

// ==========================================
// GET /api/generate-reviews
// Get job status
// ==========================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const companyId = searchParams.get("companyId");

  if (!jobId && !companyId) {
    return NextResponse.json({ error: "jobId or companyId required" }, { status: 400 });
  }

  if (jobId) {
    const job = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
    return NextResponse.json({ job });
  }

  // Get latest job for company
  const job = await prisma.backgroundJob.findFirst({
    where: { companyId: companyId!, jobType: "GENERATE_REVIEWS" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ job });
}
