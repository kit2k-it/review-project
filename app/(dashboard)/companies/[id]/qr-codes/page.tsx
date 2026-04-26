import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, canViewCompany, canManageCompany } from "@/lib/auth";
import QrCodesManager from "@/components/dashboard/QrCodesManager";
import { getCompanyReviewPoolAction } from "@/actions/review";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `Mã QR — ${company.name}` : "Không tìm thấy" };
}

export default async function QrCodesPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) notFound();

  // Check access
  const canView = await canViewCompany(id);
  if (!canView) notFound();

  const canManage = await canManageCompany(id);

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const [qrCodes, poolResult] = await Promise.all([
    prisma.qrCode.findMany({
      where: { companyId: id },
      include: { _count: { select: { reviews: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyReviewPoolAction(id),
  ]);

  if ("error" in poolResult) notFound();

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href={`/companies/${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chi tiết công ty
        </Link>
      </div>

      <QrCodesManager company={company} qrCodes={qrCodes} pool={poolResult} canManage={canManage} />
    </div>
  );
}
