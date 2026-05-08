"use client";

import type { Company } from "@prisma/client";
import { useState } from "react";
import { updateCompanyAction } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pencil, X, Check, Loader2, MapPin, Phone, ExternalLink, Tag, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  company: Company;
  canManage: boolean;
}

export default function CompanyDetailEdit({ company, canManage }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: company.name,
    address: company.address,
    category: company.category,
    phone: company.phone || "",
    keywords: company.keywords || "",
    googleReviewUrl: company.googleReviewUrl || "",
    complaintEmail: company.complaintEmail || "",
    facebook: (company.socialLinks as any)?.facebook || "",
    tiktok: (company.socialLinks as any)?.tiktok || "",
  });

  async function handleSave() {
    setLoading(true);
    setError("");
    const result = await updateCompanyAction(company.id, {
      name: form.name,
      address: form.address,
      category: form.category,
      phone: form.phone,
      keywords: form.keywords,
      googleMapsUrl: company.googleMapsUrl || "",
      googleReviewUrl: form.googleReviewUrl,
      hashtags: company.hashtags || "",
      placeId: "",
      complaintEmail: form.complaintEmail,
      socialLinks: {
        facebook: form.facebook || undefined,
        tiktok: form.tiktok || undefined,
      },
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditing(false);
      router.refresh();
    }
  }

  function handleCancel() {
    setEditing(false);
    setForm({
      name: company.name,
      address: company.address,
      category: company.category,
      phone: company.phone || "",
      keywords: company.keywords || "",
      googleReviewUrl: company.googleReviewUrl || "",
      complaintEmail: company.complaintEmail || "",
      facebook: (company.socialLinks as any)?.facebook || "",
      tiktok: (company.socialLinks as any)?.tiktok || "",
    });
    setError("");
  }

  const categories = [
    "Nhà hàng", "Café", "Bar", "Quán ăn", "Cửa hàng",
    "Salon làm đẹp", "Phòng gym", "Khách sạn", "Siêu thị",
    "Cửa hàng điện tử", "Nội thất", "Khác",
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>Thông tin</CardTitle>
        {!editing && canManage && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" />
            Sửa
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {editing ? (
          <>
            <Input
              label="Tên"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              required
            />
            <div>
              <label className="text-sm font-medium text-text">
                Danh mục <span className="text-error">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Input
              label="Số điện thoại"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Từ khoá"
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            />
            <Input
              label="Google Review URL"
              value={form.googleReviewUrl}
              onChange={(e) => setForm((f) => ({ ...f, googleReviewUrl: e.target.value }))}
            />
            <Input
              label="Email nhận khiếu nại"
              type="email"
              value={form.complaintEmail}
              onChange={(e) => setForm((f) => ({ ...f, complaintEmail: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={form.facebook}
                  onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={form.tiktok}
                  onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
                  placeholder="https://tiktok.com/@..."
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Những liên kết này sẽ hiển thị trên tất cả mã QR của cửa hàng
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading} size="sm">
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Lưu
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleCancel} size="sm">
                <X className="h-3 w-3" />
                Hủy
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span className="text-gray-600 break-words">{company.address}</span>
            </div>
            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-600">{company.phone}</span>
              </div>
            )}
            {company.googleReviewUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <a
                  href={company.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  Google Review
                </a>
              </div>
            )}
            {company.keywords && (
              <div className="flex items-start gap-2 text-sm">
                <Tag className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span className="text-gray-600 break-words">{company.keywords}</span>
              </div>
            )}
            {company.hashtags && (
              <div className="flex items-start gap-2 text-sm">
                <Tag className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span className="text-gray-600 break-words">{company.hashtags}</span>
              </div>
            )}
            {company.complaintEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-600">{company.complaintEmail}</span>
              </div>
            )}
            {(company.socialLinks as any)?.facebook && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <a
                  href={(company.socialLinks as any)?.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline truncate"
                >
                  Facebook
                </a>
              </div>
            )}
            {(company.socialLinks as any)?.tiktok && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <a
                  href={(company.socialLinks as any)?.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:underline truncate"
                >
                  TikTok
                </a>
              </div>
            )}
            <div className="pt-2">
              <Badge variant="outline">{company.category}</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
