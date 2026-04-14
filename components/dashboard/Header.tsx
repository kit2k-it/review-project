"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  user: { name: string; email: string; role: string };
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-text" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-text">Xin chào, {user.name}</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
          </p>
        </div>
      </div>
    </header>
  );
}
