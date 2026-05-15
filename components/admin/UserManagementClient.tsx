"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserRoleAction, deleteUserAction } from "@/actions/user";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input } from "@/components/ui/Input";
import { X, Lock } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  CLIENT: "Khách hàng",
  EMPLOYEE: "Nhân viên",
  USER: "Người dùng",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  CLIENT: "bg-blue-100 text-blue-700",
  EMPLOYEE: "bg-green-100 text-green-700",
  USER: "bg-gray-100 text-gray-600",
};

export function UserManagementClient({
  initialUsers,
  currentUserRole,
  currentUserId,
}: {
  initialUsers: Awaited<ReturnType<typeof import("@/actions/user").listUsersAction>>;
  currentUserRole?: string;
  currentUserId?: string;
}) {
  const { users, pagination } = initialUsers;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetUser, setResetUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEmployee = currentUserRole === "EMPLOYEE";

  async function handleResetPassword(formData: FormData) {
    startTransition(async () => {
      const { resetUserPasswordAction } = await import("@/lib/auth");
      const result = await resetUserPasswordAction(
        resetUser!.id,
        formData.get("newPassword") as string
      );
      if (result.success) {
        setResetUser(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm kiếm email, tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {!isEmployee && (
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="CLIENT">Khách hàng</option>
            <option value="EMPLOYEE">Nhân viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        )}
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          + {isEmployee ? "Thêm khách hàng" : "Thêm tài khoản"}
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text">Tên</th>
              <th className="px-4 py-3 text-left font-medium text-text">Email</th>
              <th className="px-4 py-3 text-left font-medium text-text">Vai trò</th>
              <th className="px-4 py-3 text-left font-medium text-text">Ngày tạo</th>
              <th className="px-4 py-3 text-left font-medium text-text">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {currentUserRole !== "EMPLOYEE" && (
                      <button
                        onClick={() => setResetUser({ id: user.id, name: user.name, email: user.email })}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-primary"
                        title="Đặt lại mật khẩu"
                      >
                        <Lock className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                    {currentUserRole === "ADMIN" && (
                      <>
                        <button
                          onClick={async () => {
                            if (confirm(`Xóa tài khoản ${user.email}?`)) {
                              await deleteUserAction(user.id);
                              router.refresh();
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Chưa có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} currentUserRole={currentUserRole} />
      )}

      {/* Reset password modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSubmit={handleResetPassword}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: { id: string; name: string; email: string };
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Đặt lại mật khẩu</h2>
            <p className="text-sm text-gray-500">Đặt mật khẩu mới cho {user.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={onSubmit}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <p className="font-medium text-text">{user.name}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mật khẩu mới</label>
            <Input
              name="newPassword"
              type="password"
              required
              minLength={6}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-gray-50">
              Hủy
            </button>
            <SubmitButton>Đặt lại mật khẩu</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, currentUserRole }: { onClose: () => void; currentUserRole?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      // If employee with user:create, force role to CLIENT
      if (currentUserRole === "EMPLOYEE") {
        formData.set("role", "CLIENT");
      }
      const result = await createUserAction({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
        role: (formData.get("role") as "USER" | "CLIENT" | "EMPLOYEE" | "ADMIN") || "CLIENT",
      });
      if (result.success) {
        onClose();
        router.refresh();
      }
    });
  }

  const isEmployee = currentUserRole === "EMPLOYEE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">{isEmployee ? "Tạo khách hàng mới" : "Tạo tài khoản mới"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Họ tên</label>
            <Input name="name" required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Email</label>
            <Input name="email" type="email" required placeholder="user@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mật khẩu</label>
            <Input name="password" type="password" required minLength={6} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Vai trò</label>
            {isEmployee ? (
              <div className="rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Khách hàng (Client)
                <input type="hidden" name="role" value="CLIENT" />
              </div>
            ) : (
              <select name="role" required className="w-full rounded-lg border border-border px-3 py-2 text-sm">
                <option value="CLIENT">Khách hàng (Client)</option>
                <option value="EMPLOYEE">Nhân viên (Employee)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-gray-50">
              Hủy
            </button>
            <SubmitButton>{isEmployee ? "Tạo khách hàng" : "Tạo tài khoản"}</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}