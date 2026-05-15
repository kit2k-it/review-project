"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UserWithAccess {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface AccessManagementProps {
  usersWithAccess: UserWithAccess[];
  companyId: string;
  canAssignAccess: boolean;
  currentUserId: string;
}

export default function AccessManagement({
  usersWithAccess,
  companyId,
  canAssignAccess,
  currentUserId,
}: AccessManagementProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemoveAccess(targetUserId: string) {
    if (!confirm("Gỡ quyền truy cập của người dùng này?")) return;

    setRemovingId(targetUserId);
    try {
      const response = await fetch(`/api/companies/${companyId}/users/${targetUserId}/access`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Có lỗi xảy ra");
      } else {
        // Refresh page to update list
        window.location.reload();
      }
    } catch {
      alert("Có lỗi xảy ra");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Người dùng có quyền xem</h4>
        {usersWithAccess.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa ai được gán quyền</p>
        ) : (
          <ul className="space-y-2">
            {usersWithAccess.map((up) => (
              <li key={up.id} className="flex items-center justify-between text-sm py-1">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{up.user.name}</span>
                  <span className="text-gray-500 ml-2">({up.user.email})</span>
                  <div className="text-xs text-gray-400">
                    {up.user.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
                  </div>
                </div>
                {canAssignAccess && up.user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAccess(up.user.id)}
                    disabled={removingId === up.user.id}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Gỡ quyền truy cập"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign access form */}
      {/* This will be added separately if needed */}
    </div>
  );
}
