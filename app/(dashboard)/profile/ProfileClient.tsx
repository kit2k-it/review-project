"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, CheckCircle } from "lucide-react";

interface ProfileClientProps {
  user: { name: string; email: string; role: string };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  CLIENT: "Khách hàng",
  EMPLOYEE: "Nhân viên",
  USER: "Người dùng",
};

export function ProfileClient({ user }: ProfileClientProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleChangePassword(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setSuccess(false);
      const currentPassword = formData.get("currentPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (newPassword !== confirmPassword) {
        setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
        return;
      }

      const result = await changePasswordAction(currentPassword, newPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Reset form
        formData.delete("currentPassword");
        formData.delete("newPassword");
        formData.delete("confirmPassword");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Hồ sơ cá nhân</h1>
        <p className="text-sm text-gray-500">Quản lý thông tin tài khoản</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-text">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-500">Vai trò: </span>
            <span className="text-sm font-medium text-text">{ROLE_LABELS[user.role] || user.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Đổi mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={handleChangePassword}
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Đổi mật khẩu thành công
              </div>
            )}

            <Input
              label="Mật khẩu hiện tại"
              name="currentPassword"
              type="password"
              required
              placeholder="Nhập mật khẩu hiện tại"
            />
            <Input
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              required
              minLength={6}
              placeholder="Tối thiểu 6 ký tự"
            />
            <Input
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              placeholder="Nhập lại mật khẩu mới"
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xử lý...
                </>
              ) : "Đổi mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
