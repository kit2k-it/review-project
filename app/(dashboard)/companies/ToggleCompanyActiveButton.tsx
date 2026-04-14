"use client";

import { toggleCompanyActiveAction } from "@/actions/company";
import { PowerOff, Power } from "lucide-react";

export function ToggleCompanyActiveButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  return (
    <form
      action={async () => {
        const action = !isActive ? "kích hoạt lại" : "vô hiệu hóa";
        if (!confirm(`Bạn có chắc muốn ${action} khách hàng này?`)) return;
        await toggleCompanyActiveAction(id);
      }}
    >
      <button
        type="submit"
        className={`flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
          isActive
            ? "border-red-200 text-red-500 hover:bg-red-50"
            : "border-green-200 text-green-600 hover:bg-green-50"
        }`}
        title={isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}
      >
        {isActive ? (
          <PowerOff className="h-3 w-3" />
        ) : (
          <Power className="h-3 w-3" />
        )}
        {isActive ? "Tắt" : "Bật"}
      </button>
    </form>
  );
}
