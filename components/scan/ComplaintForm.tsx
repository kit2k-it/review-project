"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin } from "lucide-react";

export interface ScanData {
  reviewId: string;
  qrCodeId: string;
  content: string;
  rating: number;
  isAiGenerated: boolean;
  company: {
    id: string;
    name: string;
    address: string;
    category: string;
    logoUrl?: string;
    googleReviewUrl?: string;
    hashtags?: string;
    complaintEmail?: string | null;
    socialLinks?: { facebook?: string; tiktok?: string };
  };
}

interface ComplaintFormProps {
  data: ScanData;
  onBack: () => void;
}

export default function ComplaintForm({ data, onBack }: ComplaintFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data.company.complaintEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text">{data.company.name}</h1>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3 w-3" />
            {data.company.address}
          </div>
          {data.company.socialLinks && (data.company.socialLinks.facebook || data.company.socialLinks.tiktok) && (
            <div className="mt-3 flex items-center justify-center gap-3">
              {data.company.socialLinks.facebook && (
                <a
                  href={data.company.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>
              )}
              {data.company.socialLinks.tiktok && (
                <a
                  href={data.company.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mb-2 font-semibold text-text">Chưa cài đặt khiếu nại</h2>
            <p className="mb-4 text-sm text-gray-500">
              Doanh nghiệp này chưa cài đặt email nhận khiếu nại.
            </p>
            <Button onClick={onBack} variant="outline" size="sm">
              ← Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung khiếu nại");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintEmail: data.company.complaintEmail,
          companyName: data.company.name,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          content: content.trim(),
          rating: data.rating, // Send the rating from the review
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Không thể gửi khiếu nại");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Không thể gửi khiếu nại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Cảm ơn bạn!</h1>
          <p className="mt-2 text-gray-500">
            Khiếu nại của bạn đã được gửi đến {data.company.name}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Họ sẽ liên hệ với bạn sớm nhất có thể.
          </p>
          <Button onClick={onBack} className="mt-6" variant="outline" size="sm">
            ← Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text">{data.company.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          {data.company.address}
        </div>
        {data.company.socialLinks && (data.company.socialLinks.facebook || data.company.socialLinks.tiktok) && (
          <div className="mt-3 flex items-center justify-center gap-3">
            {data.company.socialLinks.facebook && (
              <a
                href={data.company.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            )}
            {data.company.socialLinks.tiktok && (
              <a
                href={data.company.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                TikTok
              </a>
            )}
          </div>
        )}
      </div>

      {/* Complaint Form */}
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-700">
                Gửi khiếu nại để {data.company.name} có thể cải thiện dịch vụ
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tên (tùy chọn)</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Số điện thoại (tùy chọn)</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Complaint content */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Nội dung khiếu nại <span className="text-error">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Mô tả vấn đề bạn gặp phải..."
                />
                <p className="mt-1 text-xs text-gray-400">{content.length} ký tự</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                  ← Quay lại
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Gửi khiếu nại
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        Powered by QRReview
      </p>
    </div>
  );
}
