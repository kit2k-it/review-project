import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getEmployeeReportOverview } from "@/actions/report";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { TrendingUp, Star, Building2, QrCode, BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Báo cáo — QRReview" };
export const revalidate = 60;

function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

function StatCard({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: any; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default async function EmployeeReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; companyId?: string }>;
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">Bạn không được phép xem báo cáo.</p>
      </div>
    );
  }

  const params = await searchParams;

  // Get companies this employee owns + has permissions for
  const ownedCompanies = await prisma.company.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, isActive: true },
  });
  const ownedIds = ownedCompanies.map(c => c.id);

  const permCompanies = await prisma.userPermission.findMany({
    where: {
      userId: session.user.id,
      companyId: { not: null },
    },
    select: { companyId: true },
    distinct: ['companyId'],
  });
  const permIds = permCompanies.map(p => p.companyId!).filter(Boolean);

  const allCompanyIds = [...new Set([...ownedIds, ...permIds])];

  // Get company details for filter dropdown
  const userCompanies = allCompanyIds.length > 0
    ? await prisma.company.findMany({
        where: { id: { in: allCompanyIds } },
        select: { id: true, name: true, isActive: true },
      })
    : [];

  // Fetch report data using employee-specific function
  const overview = await getEmployeeReportOverview(session.user.id, params);

  // Calculate conversion rate
  const pendingReviews = overview.reviewsByStatus.find((s: { status: string; count: number }) => s.status === "PENDING")?.count || 0;
  const submittedReviews = overview.reviewsByStatus.find((s: { status: string; count: number }) => s.status === "SUBMITTED")?.count || 0;
  const totalAvailable = pendingReviews + submittedReviews;
  const conversionRate = totalAvailable > 0 ? ((submittedReviews / totalAvailable) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Báo cáo & Thống kê</h1>
        <p className="text-sm text-gray-500">Thống kê hoạt động của các cửa hàng bạn quản lý</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Chọn khoảng thời gian và cửa hàng để lọc dữ liệu</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col sm:flex-row gap-3">
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">Từ ngày</label>
                <input
                  type="date"
                  name="dateFrom"
                  id="dateFrom"
                  defaultValue={params.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium mb-1">Đến ngày</label>
                <input
                  type="date"
                  name="dateTo"
                  id="dateTo"
                  defaultValue={params.dateTo || new Date().toISOString().split('T')[0]}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {userCompanies.length > 0 && (
              <div className="flex-1">
                <label htmlFor="companyId" className="block text-sm font-medium mb-1">Cửa hàng</label>
                <select
                  name="companyId"
                  id="companyId"
                  defaultValue={params.companyId || ""}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tất cả cửa hàng</option>
                  {userCompanies.map((company: { id: string; name: string }) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button type="submit" className="flex h-10 items-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                Áp dụng
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Số cửa hàng quản lý"
          value={userCompanies.length}
          icon={Building2}
          description={`${userCompanies.filter(c => c.isActive).length} đang hoạt động`}
        />
        <StatCard
          title="Tổng số mã QR"
          value={overview.totalQrCodes}
          icon={QrCode}
          description={`${overview.activeQrCodes} đang hoạt động`}
        />
        <StatCard
          title="Tổng số đánh giá"
          value={overview.totalReviews}
          icon={Star}
          description={`Trung bình ${overview.averageRating?.toFixed(1) || 'N/A'} sao`}
        />
        <StatCard
          title="Tỷ lệ chuyển đổi"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          description={`${submittedReviews} / ${totalAvailable} đánh giá`}
        />
        <StatCard
          title="Pool đánh giá khả dụng"
          value={overview.preGeneratedReviews.available}
          icon={BarChart3}
          description={`/${overview.preGeneratedReviews.total} tổng pool`}
        />
      </div>

      {/* Reviews by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái đánh giá</CardTitle>
          <CardDescription>Tổng quan các trạng thái của các cửa hàng bạn quản lý</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overview.reviewsByStatus.map((status: { status: string; count: number }) => (
              <div key={status.status} className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-primary">{formatNumber(status.count)}</p>
                <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  status.status === "SUBMITTED" ? "bg-green-100 text-green-700" :
                  status.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {status.status}
                </span>
              </div>
            ))}
            {overview.reviewsByStatus.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-400">
                Chưa có đánh giá nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
