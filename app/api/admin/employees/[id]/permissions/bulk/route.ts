"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    await requireAdmin();

    const formData = await request.formData();
    const permissionIds = formData.getAll("permissionId");
    // companyId có thể không có (global permissions) hoặc có nhiều giá trị
    const companyIds = formData.getAll("companyId");

    console.log("Bulk permission update:", { userId, permissionIds, companyIds });

    // Validate: nếu có companyId được gửi, thì số lượng phải khớp với permissionIds
    // Nếu không có companyId (global), tất cả permissionId sẽ có companyId = null
    if (companyIds.length > 0 && permissionIds.length !== companyIds.length) {
      return NextResponse.json({ error: "Invalid data: mismatched lengths" }, { status: 400 });
    }

    // Remove all existing permissions for this user first
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    // Create new permissions
    for (let i = 0; i < permissionIds.length; i++) {
      const permissionId = permissionIds[i] as string;
      // Global permission: companyId = null (companyIds rỗng hoặc giá trị rỗng)
      const companyId = companyIds.length > 0 ? (companyIds[i] as string) : null;

      await prisma.userPermission.create({
        data: {
          userId,
          permissionId,
          ...(companyId ? { companyId } : {}),
        },
      });
    }

    revalidatePath(`/admin/employees/${userId}/permissions`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk update permissions error:", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
