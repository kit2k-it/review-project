"use client";

import { useState, useTransition } from "react";
import { registerAction } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await registerAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form action={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Tạo tài khoản</h2>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input name="name" type="text" label="Họ tên" placeholder="Nguyễn Văn A" required />
          <Input name="email" type="email" label="Email" placeholder="email@example.com" required />
          <Input name="password" type="password" label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" required />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang đăng ký...
              </>
            ) : "Đăng ký"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
