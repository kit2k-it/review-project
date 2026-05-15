"use client";

import { useState } from "react";
import Link from "next/link";
import { updateCompanyAction } from "@/actions/company";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Company {
  id: string;
  name: string;
  address: string;
  category: string;
  phone: string | null;
  keywords: string | null;
  googleMapsUrl: string | null;
  googleReviewUrl: string | null;
  hashtags: string | null;
  placeId: string | null;
  logoUrl: string | null;
  complaintEmail: string | null;
}

export default function CompanyEditForm({ company }: { company: Company }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address,
    category: company.category,
    phone: company.phone || "",
    keywords: company.keywords || "",
    googleMapsUrl: company.googleMapsUrl || "",
    googleReviewUrl: company.googleReviewUrl || "",
    hashtags: company.hashtags || "",
    placeId: company.placeId || "",
    complaintEmail: company.complaintEmail || "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateCompanyAction(company.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      window.location.href = "/companies";
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Chỉnh sửa khách hàng</h1>
        <p className="text-sm text-gray-500">Cập nhật thông tin {company.name}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Input
              label="Tên khách hàng"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              required
            />

            <Input
              label="Địa chỉ"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              required
            />

            <div>
              <label className="text-sm font-medium text-text">
                Danh mục <span className="text-error">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {[
                  "Nhà hàng",
                  "Café",
                  "Bar",
                  "Quán ăn",
                  "Cửa hàng",
                  "Salon làm đẹp",
                  "Phòng gym",
                  "Khách sạn",
                  "Siêu thị",
                  "Cửa hàng điện tử",
                  "Nội thất",
                  "Khác",
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              label="Google Maps URL"
              name="googleMapsUrl"
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData((f) => ({ ...f, googleMapsUrl: e.target.value }))}
            />

            <Input
              label="Google Review URL"
              name="googleReviewUrl"
              value={formData.googleReviewUrl}
              onChange={(e) => setFormData((f) => ({ ...f, googleReviewUrl: e.target.value }))}
            />

            <Input
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              placeholder="VD: 0901234567"
            />

            <Input
              label="Từ khoá"
              name="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="VD: restaurant, ha noi, food"
            />

            <Input
              label="Hashtags"
              name="hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData((f) => ({ ...f, hashtags: e.target.value }))}
              placeholder="VD: restaurant, ha noi, food"
            />

            <Input
              label="Email nhận khiếu nại"
              name="complaintEmail"
              type="email"
              value={formData.complaintEmail}
              onChange={(e) => setFormData((f) => ({ ...f, complaintEmail: e.target.value }))}
              placeholder="complaints@example.com"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Link
                href="/companies"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
