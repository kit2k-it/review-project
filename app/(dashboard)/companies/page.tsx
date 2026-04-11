import { Metadata } from "next";
import { listCompaniesAction } from "@/actions/company";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Building2, Plus, MapPin, QrCode, Star } from "lucide-react";
import { DeleteCompanyButton } from "./DeleteCompanyButton";

export const metadata: Metadata = { title: "Công ty — QRReview" };

export const revalidate = 30;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q || "";
  const category = params.category || "";
  const page = Number(params.page) || 1;

  // Get all categories for filter
  const categories = await prisma.company.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  const { companies, pagination } = await listCompaniesAction({
    search,
    category,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Công ty</h1>
          <p className="text-sm text-gray-500">Quản lý công ty và mã QR</p>
        </div>
        <Link href="/companies/new">
          <Button>
            <Plus className="h-4 w-4" />
            Thêm công ty mới
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <input
              name="q"
              defaultValue={search}
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              className="flex h-10 flex-1 min-w-[200px] rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-md border border-border bg-white px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company list */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-400">Chưa có công ty nào</p>
            <p className="mb-4 text-sm text-gray-400">Bắt đầu bằng cách thêm công ty mới</p>
            <Link href="/companies/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Thêm công ty
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{company.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.address}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{company.category}</Badge>
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
                <div className="flex gap-2">
                  <Link
                    href={`/companies/${company.id}/qr-codes`}
                    className="flex-1 rounded-md border border-border py-2 text-center text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Mã QR
                  </Link>
                  <Link
                    href={`/companies/${company.id}/edit`}
                    className="flex-1 rounded-md border border-border py-2 text-center text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Chỉnh sửa
                  </Link>
                  <DeleteCompanyButton id={company.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/companies?page=${p}&q=${search}&category=${category}`}
              className={`rounded-md border px-3 py-1 text-sm ${
                p === page ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
