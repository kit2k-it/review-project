"use client";

import { Pencil } from "lucide-react";

export function EditTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Pencil className="h-3 w-3" />
      Sửa
    </button>
  );
}
