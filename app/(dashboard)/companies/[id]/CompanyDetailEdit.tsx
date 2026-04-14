"use client";

import { useState } from "react";
import { updateCompanyAction } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pencil, X, Check, Loader2, MapPin, Phone, ExternalLink, Tag, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

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
  complaintEmail: string | null;
}

export default function CompanyDetailEdit({ company }: { company: Company }) {
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
        {!editing && (
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
            <div className="pt-2">
              <Badge variant="outline">{company.category}</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
