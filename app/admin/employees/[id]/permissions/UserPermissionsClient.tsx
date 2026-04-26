"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  code: string;
  name: string;
}

interface UserPermission {
  id: string;
  permissionId: string;
  permission: {
    id: string;
    code: string;
    name: string;
  };
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function UserPermissionsClient({
  initialUser,
  initialPermissions,
  initialUserPermissions,
}: {
  initialUser: UserInfo;
  initialPermissions: Permission[];
  initialUserPermissions: UserPermission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [permissions] = useState<Permission[]>(initialPermissions);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(initialUserPermissions);

  // Map key: permissionId
  const getPermissionKey = (permId: string) => permId;

  // State for selected permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Map<string, { permissionId: string }>>(new Map());

  // Initialize from existing userPermissions
  useEffect(() => {
    const map = new Map<string, { permissionId: string }>();
    userPermissions.forEach((up) => {
      const key = getPermissionKey(up.permissionId);
      map.set(key, { permissionId: up.permissionId });
    });
    setSelectedPermissions(map);
  }, [userPermissions]);

  // Toggle permission
  const togglePermission = (permissionId: string) => {
    const key = getPermissionKey(permissionId);
    setSelectedPermissions((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { permissionId });
      }
      return next;
    });
  };

  // Save all changes
  const handleSave = async () => {
    startTransition(async () => {
      const formData = new FormData();
      selectedPermissions.forEach((value) => {
        formData.append("permissionId", value.permissionId);
      });

      const response = await fetch(`/api/admin/employees/${initialUser.id}/permissions/bulk`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Có lỗi xảy ra khi lưu");
      }
    });
  };

  // Count selected
  const selectedCount = selectedPermissions.size;

  // Get selected permissions with details for summary
  const selectedPermsDetails = permissions.filter(p => selectedPermissions.has(getPermissionKey(p.id)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/employees" className="hover:text-blue-600">
              Nhân viên & Khách hàng
            </Link>
            <span>/</span>
            <span>Phân quyền</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Phân quyền: {initialUser.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {initialUser.email} • {initialUser.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/employees">
            <Button variant="outline">← Quay lại</Button>
          </Link>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Permission assignment */}
        <div className="lg:col-span-2 space-y-6">
          {/* All Permissions */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Tất cả quyền hệ thống</h2>
              <p className="text-sm text-gray-500">Chọn các quyền để gán cho nhân viên</p>
            </div>
            <div className="space-y-2">
              {permissions.map((perm) => {
                const key = getPermissionKey(perm.id);
                const isSelected = selectedPermissions.has(key);
                return (
                  <div key={perm.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`perm-${perm.id}`}
                      checked={isSelected}
                      onChange={() => togglePermission(perm.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <label htmlFor={`perm-${perm.id}`} className="font-medium cursor-pointer">
                        {perm.code}
                      </label>
                      <p className="text-sm text-gray-500">{perm.name}</p>
                    </div>
                  </div>
                );
              })}
              {permissions.length === 0 && (
                <p className="text-sm text-gray-500">Không có quyền nào trong hệ thống</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* User info */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin người dùng</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Tên:</span> {initialUser.name}</p>
              <p><span className="font-medium">Email:</span> {initialUser.email}</p>
              <p>
                <span className="font-medium">Vai trò:</span>{" "}
                <span className={`px-2 py-1 rounded-full text-xs ${initialUser.role === "EMPLOYEE" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                  {initialUser.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
                </span>
              </p>
            </div>
          </div>

          {/* Selected permissions summary */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quyền đã chọn ({selectedCount})</h3>
            {selectedPermsDetails.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa chọn quyền nào</p>
            ) : (
              <ul className="space-y-2">
                {selectedPermsDetails.map((perm) => (
                  <li key={perm.id} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{perm.code}</span>
                      <p className="text-xs text-gray-500">{perm.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
