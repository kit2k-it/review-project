"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireClient, getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ==========================================
// LIST USERS (Admin only)
// ==========================================
export async function listUsersAction(params: {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const where = {
    ...(params.search && {
      OR: [
        { email: { contains: params.search, mode: "insensitive" as const } },
        { name: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
    ...(params.role && { role: params.role as any }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ==========================================
// CREATE USER
// Admin: any role | Client: EMPLOYEE only
// ==========================================
const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  name: z.string().min(1, "Tên không được để trống"),
  role: z.enum(["USER", "CLIENT", "EMPLOYEE", "ADMIN"]),
});

export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Email đã được sử dụng" };
  }

  let creatorId: string | null = null;
  let creatorRole: string | null = null;
  try {
    const admin = await requireAdmin();
    creatorRole = admin.role;
  } catch {
    const client = await requireClient();
    creatorId = client.id;
    creatorRole = client.role;
    // Check permission: need user:create global permission
    const hasCreatePerm = await hasPermission(client.id, "user:create");
    if (!hasCreatePerm) {
      return { error: "Không có quyền tạo tài khoản" };
    }
    if (parsed.data.role !== "EMPLOYEE") {
      return { error: "Chỉ quản trị viên mới có thể tạo tài khoản vai trò này" };
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role as any,
        createdById: creatorId ?? undefined,
      },
    });
    revalidatePath("/admin/users");
    return { success: true, userId: user.id };
  } catch {
    return { error: "Không thể tạo tài khoản" };
  }
}

// ==========================================
// UPDATE USER ROLE (Admin only)
// ==========================================
export async function updateUserRoleAction(userId: string, role: string) {
  const admin = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Tài khoản không tồn tại" };

  if (userId === admin.id) {
    return { error: "Không thể thay đổi vai trò của chính mình" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ==========================================
// DELETE USER (Admin only)
// ==========================================
export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "Không thể xóa tài khoản của chính mình" };
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  return { success: true };
}

// ==========================================
// STATS (Admin dashboard)
// ==========================================
export async function getAdminStatsAction() {
  await requireAdmin();

  const [userCount, clientCount, employeeCount, companyCount, reviewCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CLIENT" } as any }),
    prisma.user.count({ where: { role: "EMPLOYEE" } as any }),
    prisma.company.count(),
    prisma.review.count({ where: { status: "SUBMITTED" } as any }),
  ]);

  return { userCount, clientCount, employeeCount, companyCount, reviewCount };
}
