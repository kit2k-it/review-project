import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserPermissionsClient from "./UserPermissionsClient";

export default async function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  const admin = await requireAdmin();

  // Get user info
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!targetUser) {
    notFound();
  }

  // Get all permissions available
  const allPermissions = await prisma.permission.findMany({
    orderBy: { code: "asc" },
  });

  // Get user's current permissions
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: {
      permission: true,
    },
    orderBy: {
      permission: {
        code: "asc",
      },
    },
  });

  return (
    <UserPermissionsClient
      initialUser={targetUser}
      initialPermissions={allPermissions}
      initialUserPermissions={userPermissions}
    />
  );
}
