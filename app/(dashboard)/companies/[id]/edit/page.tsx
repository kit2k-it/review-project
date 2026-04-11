import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import CompanyEditForm from "./CompanyEditForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `Chỉnh sửa — ${company.name}` : "Không tìm thấy" };
}

export default async function EditCompanyPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== user.id) notFound();

  return <CompanyEditForm company={company} />;
}
