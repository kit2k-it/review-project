"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitCustomerContactAction(formData: FormData) {
  const companyId = formData.get("companyId") as string;
  const reviewId = formData.get("reviewId") as string | null;
  const qrCodeId = formData.get("qrCodeId") as string | null;
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string | null;
  const customerEmail = formData.get("customerEmail") as string | null;

  // Validation
  if (!companyId) {
    return { error: "Thiếu thông tin công ty" };
  }

  if (!customerName || customerName.trim().length < 2) {
    return { error: "Vui lòng nhập tên hợp lệ" };
  }

  // Yêu cầu ít nhất một phương thức liên lạc
  if (!customerPhone && !customerEmail) {
    return { error: "Vui lòng nhập số điện thoại hoặc email" };
  }

  // Validate phone format nếu có
  if (customerPhone && customerPhone.trim()) {
    const phoneDigits = customerPhone.replace(/\s/g, '').replace(/[+\-]/g, '');
    if (!/^[0-9]{10,15}$/.test(phoneDigits)) {
      return { error: "Số điện thoại không hợp lệ" };
    }
  }

  // Validate email format nếu có
  if (customerEmail && customerEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return { error: "Email không hợp lệ" };
    }
  }

  // Kiểm tra xem đã submit trước đó chưa (cùng số phone/email với cùng công ty)
  const existing = await prisma.customerContact.findFirst({
    where: {
      companyId,
      OR: [
        { customerPhone: customerPhone?.trim() },
        { customerEmail: customerEmail?.trim() }
      ].filter(Boolean) as any[]
    }
  });

  if (existing) {
    return {
      error: "Thông tin của bạn đã được ghi nhận trước đó. Cảm ơn bạn!"
    };
  }

  // Tạo mã ưu đãi ngẫu nhiên
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let promoCode = "WELCOME";
  for (let i = 0; i < 4; i++) {
    promoCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Lưu thông tin
  const contact = await prisma.customerContact.create({
    data: {
      reviewId: reviewId || null,
      qrCodeId: qrCodeId || null,
      companyId,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      promoCodeOffered: promoCode,
      source: "review_thankyou",
    }
  });

  revalidatePath("/admin/contacts"); // Nếu có trang admin

  return { success: true, contact, promoCode };
}

export async function getCustomerContactsAction(params: {
  companyId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const where = params.companyId ? { companyId: params.companyId } : {};

  const [contacts, total] = await Promise.all([
    prisma.customerContact.findMany({
      where,
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customerContact.count({ where }),
  ]);

  return {
    contacts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
