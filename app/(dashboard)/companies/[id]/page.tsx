import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getCompanyReviewPoolAction } from "@/actions/review";
import QrCodesManager from "@/components/dashboard/QrCodesManager";
import CompanyDetailEdit from "./CompanyDetailEdit";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `${company.name} — QRReview` : "Không tìm thấy" };
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== user.id) notFound();

  const [qrCodes, poolResult] = await Promise.all([
    prisma.qrCode.findMany({
      where: { companyId: id },
      include: { _count: { select: { reviews: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyReviewPoolAction(id),
  ]);

  if ("error" in poolResult) notFound();
  const pool = poolResult as { available: number; used: number; pendingJob: boolean };

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/companies"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">{company.name}</h1>
          <p className="text-sm text-gray-500">Chi tiết khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info + Edit */}
        <div className="lg:col-span-1 space-y-6">
          {/* Info + Edit form */}
          <CompanyDetailEdit company={company} />

          {/* Review pool */}
          <Link href={`/companies/${id}/reviews`}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-text">{pool.available} đánh giá còn trống</p>
                    <p className="text-xs text-gray-500">{pool.used} đã dùng</p>
                  </div>
                </div>
                {pool.pendingJob && (
                  <span className="text-xs text-amber-500 animate-pulse">đang tạo...</span>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Right: QR Codes */}
        <div className="lg:col-span-2">
          <QrCodesManager company={company} qrCodes={qrCodes} pool={pool} />
        </div>
      </div>
    </div>
  );
}
