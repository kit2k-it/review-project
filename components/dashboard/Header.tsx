"use client";

interface HeaderProps {
  user: { name: string; email: string; role: string };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Xin chào, {user.name}</h1>
        <p className="text-sm text-gray-500">
          {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
        </p>
      </div>
    </header>
  );
}
