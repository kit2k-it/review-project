"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, QrCode, Star, Phone, ChevronRight } from "lucide-react";
import { ToggleCompanyActiveButton } from "./ToggleCompanyActiveButton";

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
        <div className="absolute bottom-3 right-3 flex gap-2">
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
        </div>
      )}
    </Card>
  );
}
