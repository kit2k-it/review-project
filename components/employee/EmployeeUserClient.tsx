"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/actions/user";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";

export function EmployeeUserClient({
  initialUsers,
}: {
  initialUsers: Awaited<ReturnType<typeof import("@/actions/user").listUsersAction>>;
}) {
  const { users, pagination } = initialUsers;
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          + Thêm khách hàng
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text">Tên</th>
              <th className="px-4 py-3 text-left font-medium text-text">Email</th>
              <th className="px-4 py-3 text-left font-medium text-text">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Chưa có tài khoản khách hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreateModal && (
        <CreateClientModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateClientModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUserAction({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
        role: "CLIENT",
      });
      if (result.success) {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">Tạo khách hàng mới</h2>
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-gray-50">
              Hủy
            </button>
            <SubmitButton>Tạo khách hàng</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
