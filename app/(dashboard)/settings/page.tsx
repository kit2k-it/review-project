"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { User, Info } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Cài đặt</h1>
        <p className="text-sm text-gray-500">Quản lý thông tin tài khoản</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Đánh giá tự động sử dụng lại các đánh giá đã quét trước đó.
              Khi hết đánh giá, hệ thống sẽ tự động reset để tái sử dụng.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-text">Cách thức hoạt động</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tạo công ty và mã QR</li>
                <li>Đánh giá được tạo sẵn cho mỗi công ty</li>
                <li>Khách quét QR sẽ nhận được đánh giá có sẵn</li>
                <li>Khi hết đánh giá, hệ thống reset lại để tái sử dụng</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}