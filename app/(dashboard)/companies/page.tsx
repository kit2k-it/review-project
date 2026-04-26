import { Metadata } from "next";
import { listCompaniesAction } from "@/actions/company";
import { requireAuth, hasPermission, getUserCompanies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, Plus } from "lucide-react";
import { CompanyCard } from "./CompanyCard";

export const metadata: Metadata = { title: "Khách hàng — QRReview" };

export const revalidate = 30;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const search = params.q || "";
  const category = params.category || "";
  const page = Number(params.page) || 1;
  const tab = params.tab === "inactive" ? "inactive" : "active";
  const user = await requireAuth();

  // Get all categories from companies user can access
  const userCompanies = await getUserCompanies(user.id);
  const companyIds = userCompanies.map(c => c.id);

  const categories = await prisma.company.findMany({
    select: { category: true },
    distinct: ["category"],
    where: {
      id: { in: companyIds },
    },
  });

  // Check if user can add company (ADMIN or has companies:manage permission)
  const canCreateCompany = user.role === "ADMIN" || await hasPermission(user.id, "companies:manage");

  const { companies, pagination } = await listCompaniesAction({
    search,
    category,
    page,
    pageSize: 20,
    status: tab === "inactive" ? "inactive" : "active",
  });

  // Check manage permissions for all companies (parallel)
  const { canManageCompany } = await import("@/lib/auth");
  const companiesWithPermissions = await Promise.all(
    companies.map(async (company) => ({
      ...company,
      canManage: await canManageCompany(company.id),
    }))
  );

  const activeCount = userCompanies.filter(c => c.isActive).length;
  const inactiveCount = userCompanies.filter(c => !c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý khách hàng và mã QR</p>
        </div>
        <div className="flex items-center gap-3">
          {canCreateCompany && (
            <Link href="/companies/new">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Thêm khách hàng mới
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <Link
            href={`/companies?tab=active${search ? `&q=${encodeURIComponent(search)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Đang hoạt động ({activeCount})
          </Link>
          <Link
            href={`/companies?tab=inactive${search ? `&q=${encodeURIComponent(search)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === "inactive"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Đã tắt ({inactiveCount})
          </Link>
        </nav>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-3">
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
            <input type="hidden" name="tab" value={tab} />
            <Button type="submit" variant="outline" size="sm" className="sm:w-auto">
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
            <p className="text-lg font-medium text-gray-400">
              {tab === "active" ? "Chưa có khách hàng nào đang hoạt động" : "Chưa có khách hàng nào bị tắt"}
            </p>
            <p className="mb-4 text-sm text-gray-400">
              {tab === "active" ? "Bắt đầu bằng cách thêm khách hàng mới" : "Các khách hàng bị tắt sẽ hiển thị ở đây"}
            </p>
            {canCreateCompany && tab === "active" && (
              <Link href="/companies/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Thêm khách hàng
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companiesWithPermissions.map((company) => (
            <CompanyCard key={company.id} company={company} canManage={company.canManage} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/companies?page=${p}&q=${search}&category=${category}&tab=${tab}`}
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
