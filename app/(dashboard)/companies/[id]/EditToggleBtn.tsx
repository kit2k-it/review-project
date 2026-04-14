"use client";

import { Pencil } from "lucide-react";

interface EditToggleBtnProps {
  targetId: string;
}

export function EditToggleBtn({ targetId }: EditToggleBtnProps) {
  return (
    <button
      onClick={() => {
        const el = document.getElementById(targetId);
        if (el) el.click();
      }}
      className="flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Pencil className="h-3 w-3" />
      Sửa
    </button>
  );
}