"use server";

import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validators";
import { requireAuth, hasPermission, isCompanyOwner, getUserCompanies } from "@/lib/auth";
import { generateReviewsForCompany } from "./review";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ==========================================
// CREATE COMPANY
// ==========================================
export async function createCompanyAction(
  prevState: { error?: string } | null,
  data: { name: string; address: string; category: string; phone: string; keywords: string; googleMapsUrl: string; googleReviewUrl: string; hashtags: string; placeId: string; complaintEmail?: string }
) {
  const user = await requireAuth();

  // Check permission: ADMIN or has global companies:manage
  const hasGlobalManage = await hasPermission(user.id, "companies:manage");
  if (user.role !== "ADMIN" && !hasGlobalManage) {
    return { error: "Không có quyền tạo khách hàng" };
  }

  const raw = {
    name: data.name,
    address: data.address,
    category: data.category,
    phone: data.phone,
    keywords: data.keywords,
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
        phone: parsed.data.phone || null,
        keywords: parsed.data.keywords || null,
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
    return { error: "Không thể tạo khách hàng. Vui lòng thử lại." };
  }
}

// ==========================================
// UPDATE COMPANY
// ==========================================
export async function updateCompanyAction(
  id: string,
  data: { name: string; address: string; category: string; phone: string; keywords: string; googleMapsUrl: string; googleReviewUrl: string; hashtags: string; placeId: string; logoUrl?: string; complaintEmail?: string }
) {
  const user = await requireAuth();

  // Check if user has global companies:manage permission OR is owner
  const hasGlobalManage = await hasPermission(user.id, "companies:manage");
  const isOwner = await isCompanyOwner(user.id, id);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền chỉnh sửa" };
  }

  const raw = {
    name: data.name,
    address: data.address,
    category: data.category,
    phone: data.phone,
    keywords: data.keywords,
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
        phone: parsed.data.phone || null,
        keywords: parsed.data.keywords || null,
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
    return { error: "Không thể cập nhật khách hàng" };
  }
}

// ==========================================
// TOGGLE COMPANY ACTIVE / DEACTIVE
// ==========================================
export async function toggleCompanyActiveAction(id: string) {
  const user = await requireAuth();

  // Check if user has global companies:manage permission OR is owner
  const hasGlobalManage = await hasPermission(user.id, "companies:manage");
  const isOwner = await isCompanyOwner(user.id, id);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền thao tác" };
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return { error: "Khách hàng không tồn tại" };

  await prisma.company.update({
    where: { id },
    data: { isActive: !company.isActive },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { success: true, isActive: !company.isActive };
}

// ==========================================
// DELETE COMPANY
// ==========================================
export async function deleteCompanyAction(id: string) {
  const user = await requireAuth();

  // Check if user has global companies:manage permission OR is owner
  const hasGlobalManage = await hasPermission(user.id, "companies:manage");
  const isOwner = await isCompanyOwner(user.id, id);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền xóa" };
  }

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
  status?: "active" | "inactive" | "all";
}) {
  const user = await requireAuth();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  // Determine which companies user can see
  let userCompanyIds: string[];
  if (user.role === "ADMIN") {
    // Admin sees all
    const all = await prisma.company.findMany({ select: { id: true } });
    userCompanyIds = all.map(c => c.id);
  } else {
    // Check if user has global companies:manage permission
    const hasGlobalManage = await hasPermission(user.id, "companies:manage");
    if (hasGlobalManage) {
      // Global manage can see all companies
      const all = await prisma.company.findMany({ select: { id: true } });
      userCompanyIds = all.map(c => c.id);
    } else {
      // Otherwise, only companies they own or have companies:read permission for
      userCompanyIds = (await getUserCompanies(user.id)).map(c => c.id);
    }
  }

  // Build where clause
  const where: any = {
    id: { in: userCompanyIds },
    ...(params.status === "active" ? { isActive: true } : {}),
    ...(params.status === "inactive" ? { isActive: false } : {}),
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
