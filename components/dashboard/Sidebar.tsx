"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Star,
  LogOut,
  Scan,
  Users,
  UserRound,
  User,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItemsByRole: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  ADMIN: [
    { href: "/", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/companies", label: "Khách hàng", icon: Building2 },
    { href: "/reviews", label: "Đánh giá", icon: Star },
    { href: "/reports", label: "Báo cáo", icon: BarChart3 },
    { href: "/admin/users", label: "Quản lý tài khoản", icon: Users },
    { href: "/admin/employees", label: "Phân quyền & Nhân viên", icon: UserRound },
  ],
  CLIENT: [
    // Không hiển thị "Tổng quan" cho CLIENT
    { href: "/companies", label: "Khách hàng", icon: Building2 },
    { href: "/reviews", label: "Đánh giá", icon: Star },
  ],
  EMPLOYEE: [
    { href: "/", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/companies", label: "Khách hàng", icon: Building2 },
    { href: "/reviews", label: "Đánh giá", icon: Star },
  ],
  USER: [
    { href: "/", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/companies", label: "Khách hàng", icon: Building2 },
    { href: "/reviews", label: "Đánh giá", icon: Star },
  ],
};

// All roles see "Hồ sơ" at the bottom
const profileNavItem = { href: "/profile", label: "Hồ sơ", icon: User } as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  CLIENT: "Khách hàng",
  EMPLOYEE: "Nhân viên",
  USER: "Người dùng",
};

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navItemsByRole[user.role] || navItemsByRole["USER"];

  async function handleLogout() {
    const { logoutAction } = await import("@/lib/auth");
    await logoutAction();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Scan className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-text">QRReview</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-500 hover:bg-gray-100 hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile link */}
      <div className="border-t border-border px-3 py-2">
        <Link
          href={profileNavItem.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === profileNavItem.href
              ? "bg-primary/10 text-primary"
              : "text-gray-500 hover:bg-gray-100 hover:text-text"
          )}
        >
          <profileNavItem.icon className="h-4 w-4" />
          {profileNavItem.label}
        </Link>
      </div>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
