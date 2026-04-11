import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import QrCodesManager from "@/components/dashboard/QrCodesManager";
import { getCompanyReviewPoolAction } from "@/actions/review";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `Mã QR — ${company.name}` : "Không tìm thấy" };
}

export default async function QrCodesPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== user.id) notFound();

  const [qrCodes, pool] = await Promise.all([
    prisma.qrCode.findMany({
      where: { companyId: id },
      include: { _count: { select: { reviews: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyReviewPoolAction(id),
  ]);

  return <QrCodesManager company={company} qrCodes={qrCodes} pool={pool} />;
}
