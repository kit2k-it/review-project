"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, QrCode, Star, Phone, ChevronRight, Trash2 } from "lucide-react";
import { ToggleCompanyActiveButton } from "./ToggleCompanyActiveButton";
import { deleteCompanyAction } from "@/actions/company";

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    address: string;
    category: string;
    phone: string | null;
    isActive: boolean;
    _count: { qrCodes: number; reviews: number };
  };
  canManage?: boolean;
}

export function CompanyCard({ company, canManage }: CompanyCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Bạn có chắc muốn xóa công ty "${company.name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteCompanyAction(company.id);
      setDeleting(false);

      if (result?.error) {
        setError(result.error);
      } else {
        // Refresh page to show updated list
        window.location.reload();
      }
    } catch (err) {
      setDeleting(false);
      setError("Đã xảy ra lỗi");
    }
  }
  return (
    <Card className={`group relative overflow-hidden ${!company.isActive ? "opacity-60" : ""}`}>
      <Link href={`/companies/${company.id}`} className="block cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className={`truncate text-base group-hover:text-primary transition-colors ${!company.isActive ? "text-gray-400" : ""}`}>
                {company.name}
              </CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{company.address}</span>
              </div>
              {company.phone && (
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!company.isActive && (
                <Badge variant="error">Đã tắt</Badge>
              )}
              <Badge variant={company.isActive ? "outline" : "default"}>
                {company.category}
              </Badge>
              {company.isActive && (
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <QrCode className="h-3 w-3" />
              {company._count.qrCodes} QR
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {company._count.reviews} đánh giá
            </span>
          </div>
        </CardContent>
      </Link>
      {canManage && (
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link
              href={`/companies/${company.id}/qr-codes`}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Mã QR
            </Link>
            <Link
              href={`/companies/${company.id}/edit`}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Sửa
            </Link>
            <ToggleCompanyActiveButton id={company.id} isActive={company.isActive} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">{error}</p>
          )}
        </div>
      )}
    </Card>
  );
}
