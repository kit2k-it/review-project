"use server";

import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { generateReviewsForCompany } from "./review";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ==========================================
// CREATE COMPANY
// ==========================================
export async function createCompanyAction(
  prevState: { error?: string } | null,
  data: { name: string; address: string; category: string; googleMapsUrl: string; googleReviewUrl: string; hashtags: string; placeId: string; complaintEmail?: string }
) {
  const user = await requireAuth();

  const raw = {
    name: data.name,
    address: data.address,
    category: data.category,
    googleMapsUrl: data.googleMapsUrl,
    googleReviewUrl: data.googleReviewUrl,
    hashtags: data.hashtags,
    placeId: data.placeId,
    logoUrl: "",
    complaintEmail: data.complaintEmail || "",
  };

  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        address: parsed.data.address,
        category: parsed.data.category,
        googleMapsUrl: parsed.data.googleMapsUrl || null,
        googleReviewUrl: parsed.data.googleReviewUrl || null,
        hashtags: parsed.data.hashtags || null,
        placeId: parsed.data.placeId || null,
        logoUrl: parsed.data.logoUrl || null,
        complaintEmail: parsed.data.complaintEmail || null,
      },
    });

    // Trigger background review generation (non-blocking)
    generateReviewsForCompany(company.id).catch(console.error);

    revalidatePath("/companies");
    return { success: true, companyId: company.id };
  } catch (error) {
    console.error("Create company error:", error);
    return { error: "Không thể tạo công ty. Vui lòng thử lại." };
  }
}

// ==========================================
// UPDATE COMPANY
// ==========================================
export async function updateCompanyAction(
  id: string,
  data: { name: string; address: string; category: string; googleMapsUrl: string; googleReviewUrl: string; hashtags: string; placeId: string; logoUrl?: string; complaintEmail?: string }
) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return { error: "Công ty không tồn tại" };
  if (company.userId !== user.id) return { error: "Không có quyền chỉnh sửa" };

  const raw = {
    name: data.name,
    address: data.address,
    category: data.category,
    googleMapsUrl: data.googleMapsUrl,
    googleReviewUrl: data.googleReviewUrl,
    hashtags: data.hashtags,
    placeId: data.placeId,
    logoUrl: data.logoUrl || "",
    complaintEmail: data.complaintEmail || "",
  };

  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        category: parsed.data.category,
        googleMapsUrl: parsed.data.googleMapsUrl || null,
        googleReviewUrl: parsed.data.googleReviewUrl || null,
        hashtags: parsed.data.hashtags || null,
        placeId: parsed.data.placeId || null,
        logoUrl: parsed.data.logoUrl || null,
        complaintEmail: parsed.data.complaintEmail || null,
      },
    });

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Không thể cập nhật công ty" };
  }
}

// ==========================================
// DELETE COMPANY
// ==========================================
export async function deleteCompanyAction(id: string) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return { error: "Công ty không tồn tại" };
  if (company.userId !== user.id) return { error: "Không có quyền xóa" };

  await prisma.company.delete({ where: { id } });

  revalidatePath("/companies");
  return { success: true };
}

// ==========================================
// LIST COMPANIES
// ==========================================
export async function listCompaniesAction(params: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await requireAuth();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const where = {
    userId: user.id,
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" as const } },
        { address: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
    ...(params.category && { category: params.category }),
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        _count: { select: { qrCodes: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
