"use server";

import { prisma } from "@/lib/prisma";
import { generateQrCode } from "@/lib/utils";
import { requireAuth, hasPermission, isCompanyOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==========================================
// CREATE QR CODE
// ==========================================
export async function createQrCodeAction(
  companyId: string,
  socialLinks?: { facebook?: string; tiktok?: string }
) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Khách hàng không tồn tại" };

  // Check permission: global qr-codes:manage OR is owner of company
  const hasGlobalManage = await hasPermission(user.id, "qr-codes:manage");
  const isOwner = await isCompanyOwner(user.id, companyId);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền tạo mã QR" };
  }

  // Generate unique code
  let code = generateQrCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.qrCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateQrCode();
    attempts++;
  }

  const qrCode = await prisma.qrCode.create({
    data: {
      companyId,
      code,
      socialLinks: socialLinks ?? undefined,
    },
  });

  revalidatePath(`/companies/${companyId}/qr-codes`);
  return { success: true, qrCode };
}

// ==========================================
// DELETE QR CODE
// ==========================================
export async function deleteQrCodeAction(id: string) {
  const user = await requireAuth();

  const qrCode = await prisma.qrCode.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!qrCode) return { error: "Mã QR không tồn tại" };

  // Check permission: global qr-codes:manage OR is owner of company
  const hasGlobalManage = await hasPermission(user.id, "qr-codes:manage");
  const isOwner = await isCompanyOwner(user.id, qrCode.companyId);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền" };
  }

  await prisma.qrCode.delete({ where: { id } });

  revalidatePath(`/companies/${qrCode.companyId}/qr-codes`);
  return { success: true };
}

// ==========================================
// TOGGLE QR CODE ACTIVE
// ==========================================
export async function toggleQrCodeAction(id: string) {
  const user = await requireAuth();

  const qrCode = await prisma.qrCode.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!qrCode) return { error: "Mã QR không tồn tại" };

  // Check permission: global qr-codes:manage OR is owner
  const hasGlobalManage = await hasPermission(user.id, "qr-codes:manage");
  const isOwner = await isCompanyOwner(user.id, qrCode.companyId);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền" };
  }

  await prisma.qrCode.update({
    where: { id },
    data: { isActive: !qrCode.isActive },
  });

  revalidatePath(`/companies/${qrCode.companyId}/qr-codes`);
  return { success: true };
}

// ==========================================
// LIST QR CODES
// ==========================================
export async function listQrCodesAction(companyId: string) {
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Khách hàng không tồn tại" };

  // Check permission: global qr-codes:manage OR is owner of company
  const hasGlobalManage = await hasPermission(user.id, "qr-codes:manage");
  const isOwner = await isCompanyOwner(user.id, companyId);

  if (!hasGlobalManage && !isOwner) {
    return { error: "Không có quyền" };
  }

  const qrCodes = await prisma.qrCode.findMany({
    where: { companyId },
    include: {
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { qrCodes };
}
