"use client";

import { deleteCompanyAction } from "@/actions/company";

export function DeleteCompanyButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        if (!confirm("Xóa công ty này?")) return;
        await deleteCompanyAction(id);
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
        Xóa
      </button>
    </form>
  );
}
