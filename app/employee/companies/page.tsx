import { Metadata } from "next";
import { getSession, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, Plus } from "lucide-react";
import { CompanyCard } from "@/app/(dashboard)/companies/CompanyCard";

export const metadata: Metadata = { title: "Khách hàng — QRReview" };

export default async function EmployeeCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Không có quyền truy cập</h1>
      </div>
    );
  }

  const params = await searchParams;
  const search = params.q || "";
  const category = params.category || "";
  const page = Number(params.page) || 1;
  const tab = params.tab === "inactive" ? "inactive" : "active";
  const pageSize = 20;

  // Get companies user owns
  const ownedCompanies = await prisma.company.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const ownedIds = ownedCompanies.map(c => c.id);

  // Get companies user has permissions for
  const permCompanies = await prisma.userPermission.findMany({
    where: {
      userId: session.user.id,
      companyId: { not: null },
    },
    select: { companyId: true },
    distinct: ['companyId'],
  });
  const permIds = permCompanies.map(p => p.companyId!).filter(Boolean);

  // Merge all company IDs
  const allCompanyIds = [...new Set([...ownedIds, ...permIds])];

  // Build where clause
  const where: any = {
    id: { in: allCompanyIds },
  };

  if (tab === "inactive") {
    where.isActive = false;
  } else {
    where.isActive = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  // Get categories
  const categories = await prisma.company.findMany({
    select: { category: true },
    distinct: ["category"],
    where: { id: { in: allCompanyIds } },
  });

  // Get companies with pagination
  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            qrCodes: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Check manage permissions
  const { canManageCompany } = await import("@/lib/auth");
  const companiesWithPermissions = await Promise.all(
    companies.map(async (company) => ({
      ...company,
      canManage: await canManageCompany(company.id),
      isOwner: company.userId === session.user.id,
    }))
  );

  const activeCount = allCompanyIds.length > 0
    ? await prisma.company.count({ where: { id: { in: allCompanyIds }, isActive: true } })
    : 0;
  const inactiveCount = allCompanyIds.length > 0
    ? await prisma.company.count({ where: { id: { in: allCompanyIds }, isActive: false } })
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý khách hàng và mã QR</p>
        </div>
        {/* EMPLOYEE can create new company */}
        <Link href="/companies/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Thêm khách hàng mới
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <Link
          href="?tab=active"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-text"
          }`}
        >
          Đang hoạt động ({activeCount})
        </Link>
        <Link
          href="?tab=inactive"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "inactive"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-text"
          }`}
        >
          Ngưng hoạt động ({inactiveCount})
        </Link>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Tìm kiếm tên, địa chỉ..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              name="category"
              defaultValue={category}
              className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            <input type="hidden" name="tab" value={tab} />
            <Button type="submit" variant="outline" size="sm">
              Lọc
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company List */}
      {companiesWithPermissions.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Chưa có khách hàng nào</h3>
          <p className="text-gray-500 mb-4">
            {tab === "inactive"
              ? "Không có khách hàng nào ngưng hoạt động"
              : "Bạn chưa tạo hoặc được gán quyền cho khách hàng nào"}
          </p>
          <Link href="/companies/new">
            <Button>
              <Plus className="h-4 w-4" />
              Thêm khách hàng mới
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companiesWithPermissions.map((company) => (
            <div key={company.id}>
              <CompanyCard company={company} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?tab=${tab}&q=${search}&category=${category}&page=${p}`}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
