"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { requireAdmin, requireClient, getSession } from "@/lib/auth";
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
// ASSIGN EMPLOYEE TO COMPANY
// Admin: any employee → any company
// Client: only EMPLOYEES they created → their own companies
// ==========================================
export async function assignEmployeeToCompanyAction(employeeId: string, companyId: string) {
  let creatorId: string | null = null;
  let creatorRole: string | null = null;
  try {
    creatorRole = (await requireAdmin()).role;
  } catch {
    const client = await requireClient();
    creatorId = client.id;
    creatorRole = client.role;
  }

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Tài khoản nhân viên không tồn tại" };
  if ((employee.role as string) !== "EMPLOYEE") {
    return { error: "Chỉ tài khoản nhân viên mới có thể được gán" };
  }

  if (creatorRole === "CLIENT" && (employee as any).createdById !== creatorId) {
    return { error: "Bạn chỉ có thể gán nhân viên mà bạn tạo" };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Công ty không tồn tại" };

  if (creatorRole === "CLIENT" && company.userId !== creatorId) {
    return { error: "Bạn chỉ có thể gán nhân viên vào công ty của bạn" };
  }

  try {
    await prisma.employeeAssignment.create({ data: { employeeId, companyId } });
  } catch {
    // Already assigned
  }
  revalidatePath(`/companies/${companyId}`);
  return { success: true };
}

// ==========================================
// REMOVE EMPLOYEE FROM COMPANY
// ==========================================
export async function removeEmployeeFromCompanyAction(employeeId: string, companyId: string) {
  let creatorId: string | null = null;
  let creatorRole: string | null = null;
  try {
    creatorRole = (await requireAdmin()).role;
  } catch {
    const client = await requireClient();
    creatorId = client.id;
    creatorRole = client.role;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Công ty không tồn tại" };

  if (creatorRole === "CLIENT" && company.userId !== creatorId) {
    return { error: "Không có quyền gỡ nhân viên khỏi công ty này" };
  }

  await prisma.employeeAssignment.deleteMany({ where: { employeeId, companyId } });
  revalidatePath(`/companies/${companyId}`);
  return { success: true };
}

// ==========================================
// GET EMPLOYEES OF A COMPANY
// ==========================================
export async function getCompanyEmployeesAction(companyId: string) {
  let creatorId: string | null = null;
  try {
    await requireAdmin();
  } catch {
    try {
      creatorId = (await requireClient()).id;
    } catch {
      // EMPLOYEE is allowed to view employees — skip creatorId check
    }
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return [];

  if (creatorId && company.userId !== creatorId) return [];

  return prisma.employeeAssignment.findMany({
    where: { companyId },
    include: {
      employee: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==========================================
// GET MY EMPLOYEES (for Client: only ones they created)
// ==========================================
export async function getMyEmployeesAction() {
  const client = await requireClient();

  return prisma.user.findMany({
    where: { role: "EMPLOYEE" as any, createdById: client.id },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

// ==========================================
// GET ALL EMPLOYEES (for Client: only their created ones)
// ==========================================
export async function getAllEmployeesAction() {
  let creatorId: string | null = null;
  try {
    creatorId = (await requireAdmin()).id;
  } catch {
    try {
      creatorId = (await requireClient()).id;
    } catch {
      // EMPLOYEE is allowed — skip creatorId filter
    }
  }

  // Admin: all | Client: only their created | Employee: all (for assignment)
  const where = creatorId
    ? { role: Role.EMPLOYEE, createdById: creatorId }
    : { role: Role.EMPLOYEE };

  return prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

// ==========================================
// UPDATE EMPLOYEE (Admin: any | Client: only their created)
// ==========================================
export async function updateEmployeeAction(
  employeeId: string,
  data: { name?: string; email?: string; password?: string }
) {
  let creatorId: string | null = null;
  let creatorRole: string | null = null;
  try {
    creatorRole = (await requireAdmin()).role;
  } catch {
    const client = await requireClient();
    creatorId = client.id;
    creatorRole = client.role;
  }

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Tài khoản nhân viên không tồn tại" };

  if (creatorRole === "CLIENT" && (employee as any).createdById !== creatorId) {
    return { error: "Bạn không có quyền chỉnh sửa tài khoản này" };
  }

  const updateData: { name?: string; email?: string; passwordHash?: string } = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

  if (Object.keys(updateData).length === 0) {
    return { error: "Không có thông tin nào được cập nhật" };
  }

  try {
    await prisma.user.update({ where: { id: employeeId }, data: updateData });
    revalidatePath("/employees");
    return { success: true };
  } catch {
    return { error: "Không thể cập nhật tài khoản" };
  }
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
