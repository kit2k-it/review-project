import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "qrr_session";

// Public routes
const publicRoutes = ["/login", "/register"];
const publicPrefixes = ["/scan/", "/api/scan/", "/api/complaint"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((r) => pathname === r)) {
    return NextResponse.next();
  }

  // Allow scan routes
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and _next
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Check session cookie exists
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // For admin/employee routes, we just check if the cookie exists
  // Detailed permission checks are done in the page components
  if (pathname.startsWith("/admin") || pathname.startsWith("/employee")) {
    // Allow access - page components will verify session and permissions
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
