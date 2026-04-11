import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndTriggerGeneration } from "@/actions/review";
import { generateSingleReview } from "@/lib/openai";

/**
 * GET /api/scan/[code]
 * Public endpoint — when user scans a QR code
 *
 * Flow:
 * 1. Find QR code by code
 * 2. Verify it's active
 * 3. Try to get an unused pre-generated review
 * 4. If none → generate via AI
 * 5. Create Review record with PENDING status
 * 6. Return review data + company info
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: "Mã QR không hợp lệ" }, { status: 400 });
  }

  // Find QR code with company info
  const qrCode = await prisma.qrCode.findUnique({
    where: { code },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          address: true,
          category: true,
          googleReviewUrl: true,
          logoUrl: true,
          hashtags: true,
          complaintEmail: true,
        },
      },
    },
  });

  if (!qrCode) {
    return NextResponse.json({ error: "Mã QR không tồn tại" }, { status: 404 });
  }

  if (!qrCode.isActive) {
    return NextResponse.json(
      { error: "Mã QR đã bị vô hiệu hóa" },
      { status: 410 }
    );
  }

  const company = qrCode.company;

  // Strategy 1: Try to get a pre-generated review
  const preGenReview = await prisma.preGeneratedReview.findFirst({
    where: {
      companyId: company.id,
      isUsed: false,
    },
    orderBy: { createdAt: "asc" },
  });

  let reviewContent: string;
  let rating: number;
  let isAiGenerated = false;

  if (preGenReview) {
    reviewContent = preGenReview.content;
    rating = preGenReview.rating;
    isAiGenerated = false;

    // Mark as used
    await prisma.preGeneratedReview.update({
      where: { id: preGenReview.id },
      data: { isUsed: true, usedAt: new Date() },
    });
  } else {
    // Strategy 2: Generate via AI (fallback)
    try {
      const aiReview = await generateSingleReview(company.name, company.category);
      reviewContent = aiReview.content;
      rating = aiReview.rating;
      isAiGenerated = true;
    } catch (error) {
      console.error("AI generation failed:", error);
      // Ultimate fallback: generic review
      reviewContent = `Đánh giá cho ${company.name}`;
      rating = 5;
      isAiGenerated = true;
    }
  }

  // Create Review record
  const review = await prisma.review.create({
    data: {
      qrCodeId: qrCode.id,
      companyId: company.id,
      content: reviewContent,
      rating,
      status: "PENDING",
      isAiGenerated,
    },
  });

  // Check if we need to trigger background generation
  // This runs asynchronously — doesn't block the response
  checkAndTriggerGeneration(company.id).catch(console.error);

  // Return the review + metadata needed for the form
  return NextResponse.json({
    reviewId: review.id,
    content: reviewContent,
    rating,
    isAiGenerated,
    company: {
      name: company.name,
      address: company.address,
      category: company.category,
      logoUrl: company.logoUrl,
      googleReviewUrl: company.googleReviewUrl,
      hashtags: company.hashtags,
      complaintEmail: company.complaintEmail,
    },
    socialLinks: qrCode.socialLinks,
  });
}
