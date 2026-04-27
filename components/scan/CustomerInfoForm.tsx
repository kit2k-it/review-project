"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";
import { submitCustomerContactAction } from "@/actions/customer-contact";

interface CustomerInfoFormProps {
  companyId: string;
  reviewId?: string;
  qrCodeId?: string;
  onComplete?: () => void;
}

export default function CustomerInfoForm({
  companyId,
  reviewId,
  qrCodeId,
  onComplete,
}: CustomerInfoFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setError("Vui lòng nhập số điện thoại hoặc email");
      return;
    }

    const formData = new FormData();
    formData.append("companyId", companyId);
    if (reviewId) formData.append("reviewId", reviewId);
    if (qrCodeId) formData.append("qrCodeId", qrCodeId);
    formData.append("customerName", name);
    if (phone) formData.append("customerPhone", phone);
    if (email) formData.append("customerEmail", email);

    startTransition(async () => {
      const result = await submitCustomerContactAction(formData);

      if (result.error) {
        setError(result.error);
        setPromoCode(null);
      } else {
        setIsSubmitted(true);
        setPromoCode(result.promoCode!); // promoCode always exists on success
        onComplete?.();
      }
    });
  }

  if (isSubmitted && promoCode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text">Đăng ký thành công!</h2>
            <p className="text-gray-500">
              Cảm ơn bạn đã để lại thông tin. Dưới đây là mã ưu đãi đặc biệt dành cho bạn:
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-6 border-2 border-primary/20">
            <p className="text-sm text-gray-600 mb-2">Mã giảm giá</p>
            <div className="text-4xl font-bold text-primary tracking-wider">
              {promoCode}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Giảm 10% cho lần mua hàng tiếp theo
            </p>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>• Mã có hiệu lực trong 30 ngày</p>
            <p>• Áp dụng cho tất cả sản phẩm</p>
            <p>• Vui lòng cung cấp mã khi thanh toán</p>
          </div>

          <Button
            onClick={() => window.close()}
            variant="outline"
            className="mt-4"
          >
            Đóng cửa sổ
          </Button>
        </div>

        <p className="mt-12 text-xs text-gray-400">
          Powered by QRReview
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-text">
                Nhận ưu đãi đặc biệt
              </h2>
              <p className="text-sm text-gray-500">
                Để lại thông tin để nhận mã giảm giá và thông tin khuyến mãi
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0901234567"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  "Nhận ưu đãi ngay"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => window.close()}
        variant="ghost"
        className="mt-6 text-sm text-gray-500 hover:text-gray-700"
      >
        Bỏ qua
      </Button>

      <p className="mt-8 text-xs text-gray-400">
        Powered by QRReview
      </p>
    </div>
  );
}
