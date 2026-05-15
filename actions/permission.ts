"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==========================================
// LIST ALL PERMISSIONS
// ==========================================
export async function listPermissionsAction() {
  await requireAuth(); // Only authenticated users can view permissions

  const permissions = await prisma.permission.findMany({
    orderBy: { code: "asc" },
  });

  return { permissions };
}

// ==========================================
// LIST USER PERMISSIONS
// ==========================================
export async function listUserPermissionsAction(userId: string) {
  const currentUser = await requireAuth();

  // Only admin can view any user's permissions
  // Regular users can only view their own
  if (currentUser.role !== "ADMIN" && currentUser.id !== userId) {
    return { error: "Không có quyền xem" };
  }

  const userPerms = await prisma.userPermission.findMany({
    where: { userId },
    include: {
      permission: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      permission: {
        code: "asc",
      },
    },
  });

  return { permissions: userPerms };
}

// ==========================================
// ASSIGN PERMISSION TO USER
// ==========================================
export async function assignUserPermissionAction(
  userId: string,
  permissionCode: string,
  companyId?: string
) {
  const admin = await requireAuth();

  // Only ADMIN can assign permissions
  if (admin.role !== "ADMIN") {
    return { error: "Không có quyền phân quyền" };
  }

  // Find permission by code
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });

  if (!permission) {
    return { error: "Permission không tồn tại" };
  }

  // Verify user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return { error: "Người dùng không tồn tại" };
  }

  // If companyId provided, verify company exists
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return { error: "Công ty không tồn tại" };
    }
  }

  // Check if permission already exists
  const existing = await prisma.userPermission.findFirst({
    where: {
      userId,
      permissionId: permission.id,
      ...(companyId && { companyId }),
    },
  });

  if (existing) {
    return { error: "Permission đã được gán" };
  }

  // Create user permission
  await prisma.userPermission.create({
    data: {
      userId,
      permissionId: permission.id,
      companyId: companyId || null,
    },
  });

  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/[id]/permissions");

  return { success: true };
}

// ==========================================
// REMOVE USER PERMISSION
// ==========================================
export async function removeUserPermissionAction(permissionId: string) {
  const admin = await requireAuth();

  // Only ADMIN can remove permissions
  if (admin.role !== "ADMIN") {
    return { error: "Không có quyền xóa permission" };
  }

  const userPerm = await prisma.userPermission.findUnique({
    where: { id: permissionId },
    include: {
      company: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!userPerm) {
    return { error: "Permission không tồn tại" };
  }

  // Allow admin to remove any permission
  // Also allow company owner to remove permissions on their own company
  const isCompanyOwner = userPerm.company?.userId === admin.id;
  if (admin.role !== "ADMIN" && !isCompanyOwner) {
    return { error: "Không có quyền xóa permission này" };
  }

  await prisma.userPermission.delete({ where: { id: permissionId } });

  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/[id]/permissions");

  return { success: true };
}

// ==========================================
// ASSIGN COMPANY TO USER (for read access)
// Convenience function to assign companies:read, qr-codes:read, and reviews:read permissions
// ==========================================
export async function assignCompanyToUserAction(userId: string, companyId: string) {
  const admin = await requireAuth();

  // Only ADMIN or company owner can assign
  if (admin.role !== "ADMIN") {
    // Check if admin is owner of the company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company || company.userId !== admin.id) {
      return { error: "Không có quyền gán công ty" };
    }
  }

  // Get all required read permissions
  const permissionCodes = ["companies:read", "qr-codes:read", "reviews:read"];
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });

  if (permissions.length !== permissionCodes.length) {
    return { error: "Một hoặc nhiều permission không tồn tại trong hệ thống" };
  }

  // Check and create permissions for each
  const results = [];
  for (const perm of permissions) {
    // Check if already assigned
    const existing = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId: perm.id,
        companyId,
      },
    });

    if (!existing) {
      await prisma.userPermission.create({
        data: {
          userId,
          permissionId: perm.id,
          companyId,
        },
      });
      results.push(perm.code);
    }
  }

  revalidatePath("/admin/employees");
  revalidatePath("/companies");

  return { success: true, assigned: results };
}

// ==========================================
// REMOVE COMPANY ACCESS FROM USER
// ==========================================
export async function removeCompanyFromUserAction(userId: string, companyId: string) {
  const admin = await requireAuth();

  // Only ADMIN or company owner can remove
  if (admin.role !== "ADMIN") {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company || company.userId !== admin.id) {
      return { error: "Không có quyền gỡ quyền truy cập" };
    }
  }

  // Get all company-related read permissions
  const permissionCodes = ["companies:read", "qr-codes:read", "reviews:read"];
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });

  const permissionIds = permissions.map(p => p.id);

  // Find all user permissions for these permissions and this company
  const userPerms = await prisma.userPermission.findMany({
    where: {
      userId,
      permissionId: { in: permissionIds },
      companyId,
    },
  });

  if (userPerms.length === 0) {
    return { error: "Chưa được gán quyền truy cập" };
  }

  // Delete all matching permissions
  for (const userPerm of userPerms) {
    await prisma.userPermission.delete({ where: { id: userPerm.id } });
  }

  revalidatePath("/admin/employees");
  revalidatePath("/companies");

  return { success: true, removed: userPerms.length };
}

// ==========================================
// GET COMPANIES FOR ASSIGNMENT DROPDOWN
// ==========================================
export async function listCompaniesForAssignmentAction() {
  const admin = await requireAuth();

  // Admin sees all companies
  // Company owners see their own companies
  let companies;
  if (admin.role === "ADMIN") {
    companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
  } else {
    companies = await prisma.company.findMany({
      where: { userId: admin.id },
      orderBy: { name: "asc" },
    });
  }

  return {
    companies: companies.map(c => ({
      id: c.id,
      name: c.name,
    })),
  };
}
