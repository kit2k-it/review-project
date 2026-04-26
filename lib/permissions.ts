import { prisma } from "@/lib/prisma";

/**
 * Check if user has a specific permission (global only)
 * Per-company permissions have been removed - only global permissions apply.
 * @param userId - User ID
 * @param permissionCode - Permission code (e.g., "companies:read", "qr-codes:create")
 * @returns true if user has the global permission
 */
export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  // 1. Check if user is ADMIN (has all permissions)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") {
    return true;
  }

  // 2. Get permission ID from code
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });

  if (!permission) {
    console.warn(`Permission not found: ${permissionCode}`);
    return false;
  }

  // 3. Check UserPermission (only global permissions, companyId is null)
  const userPerm = await prisma.userPermission.findFirst({
    where: {
      userId,
      permissionId: permission.id,
      companyId: null, // Only global permissions
    },
  });

  return !!userPerm;
}

/**
 * Check if user is owner of a company
 */
export async function isCompanyOwner(userId: string, companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });
  return company?.userId === userId;
}

/**
 * Get all companies that a user can access.
 * ADMIN: all companies
 * Global permission holders (companies:read or companies:manage): all companies
 * Others: only owned companies
 *
 * @param userId - User ID
 * @returns Array of companies with id and name
 */
export async function getUserCompanies(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") {
    // Admin sees all companies
    return prisma.company.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Check if user has global companies:read or companies:manage permission
  const [hasRead, hasManage] = await Promise.all([
    hasPermission(userId, "companies:read"),
    hasPermission(userId, "companies:manage"),
  ]);

  if (hasRead || hasManage) {
    // Users with global permission can see all companies
    return prisma.company.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Only owned companies
  return prisma.company.findMany({
    where: { userId },
    select: { id: true, name: true, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}
