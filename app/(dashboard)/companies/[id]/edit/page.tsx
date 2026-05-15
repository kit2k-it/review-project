import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, canUpdateCompany } from "@/lib/auth";
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

  // Check if user can update this company (owner OR has companies:update permission)
  const canUpdate = await canUpdateCompany(id);
  if (!canUpdate) {
    redirect(`/companies/${id}?error=Bạn không có quyền chỉnh sửa thông tin công ty này`);
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  return <CompanyEditForm company={company} />;
}
