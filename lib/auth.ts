"use server"

// Server-only auth: JWT sessions, login, register, logout
// Import ONLY from Server Components and Server Actions
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { hasPermission, isCompanyOwner, getUserCompanies } from "./permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

const SESSION_COOKIE = "qrr_session";
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// ==========================================
// JWT HELPERS
// ==========================================

export async function createSessionToken(userId: string, role: string) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY}s`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

// ==========================================
// SESSION
// ==========================================

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  return user ? { user } : null;
}

// ==========================================
// AUTH ACTIONS
// ==========================================

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const token = await createSessionToken(user.id, user.role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY,
    path: "/",
  });

  redirect("/");
}

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Vui lòng điền đầy đủ thông tin" };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu tối thiểu 6 ký tự" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email đã được sử dụng" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "CLIENT" },
  });

  redirect("/login");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

// ==========================================
// CHANGE PASSWORD (user changes their own password)
// ==========================================
export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session?.user) return { error: "Chưa đăng nhập" };

  if (newPassword.length < 6) {
    return { error: "Mật khẩu mới tối thiểu 6 ký tự" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Không tìm thấy tài khoản" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Mật khẩu hiện tại không đúng" };

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } });

  return { success: true };
}

// ==========================================
// RESET USER PASSWORD (admin only)
// ==========================================
export async function resetUserPasswordAction(userId: string, newPassword: string) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Không có quyền thực hiện" };
  }

  if (userId === session.user.id) {
    return { error: "Không thể đặt lại mật khẩu của chính mình" };
  }

  if (newPassword.length < 6) {
    return { error: "Mật khẩu tối thiểu 6 ký tự" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Tài khoản không tồn tại" };

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  return { success: true };
}

// ==========================================
// REQUIRE AUTH
// ==========================================

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session.user;
}

export async function requireClient() {
  const session = await getSession();
  if (!session?.user || (session.user.role !== "CLIENT" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }
  return session.user;
}

export async function requireEmployee() {
  const session = await getSession();
  if (!session?.user || !["EMPLOYEE", "CLIENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }
  return session.user;
}

// Check if user can manage a specific company
// ADMIN: any company | Others: global companies:manage OR ownership
export async function canManageCompany(companyId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  // ADMIN always can manage
  if (session.user.role === "ADMIN") return true;

  // Check if user has GLOBAL manage permission
  const hasGlobalManage = await hasPermission(session.user.id, "companies:manage");
  if (hasGlobalManage) return true;

  // Check if user is owner
  const isOwner = await isCompanyOwner(session.user.id, companyId);

  return isOwner;
}

// Can VIEW a company (less strict than manage)
// ADMIN: any company | Others: global companies:read or companies:manage OR ownership
export async function canViewCompany(companyId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  // ADMIN always can view
  if (session.user.role === "ADMIN") return true;

  // Check if user has GLOBAL read or manage permission
  const hasGlobalRead = await hasPermission(session.user.id, "companies:read");
  const hasGlobalManage = await hasPermission(session.user.id, "companies:manage");
  if (hasGlobalRead || hasGlobalManage) return true;

  // Check if user is owner
  const isOwner = await isCompanyOwner(session.user.id, companyId);

  return isOwner;
}

// Export permission helpers for convenience
export { hasPermission, isCompanyOwner, getUserCompanies };

// ==========================================
// MIDDLEWARE JWT VERIFY (separate file to avoid bundling jose in client)
// ==========================================

// ==========================================
// MIDDLEWARE JWT VERIFY (separate file to avoid bundling jose in client)
// ==========================================
