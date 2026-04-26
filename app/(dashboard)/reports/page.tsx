import { Metadata } from "next";
import { getReportOverview, getBackgroundJobStats, exportReportCsv } from "@/actions/report";
import { requireAuth, hasPermission, getUserCompanies } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Star, Building2, QrCode, Users, BarChart3 } from "lucide-react";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";

export const metadata: Metadata = { title: "Báo cáo — QRReview" };
export const revalidate = 60; // Cache for 60 seconds

// Helper to format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

// Stat Card Component
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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  // Check permissions: ADMIN or has companies:read or reviews:read
  const hasCompaniesRead = await hasPermission(session.id, "companies:read");
  const hasReviewsRead = await hasPermission(session.id, "reviews:read");
  if (session.role !== "ADMIN" && !hasCompaniesRead && !hasReviewsRead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">Bạn không được phép xem báo cáo.</p>
      </div>
    );
  }

  // Get accessible companies for dropdown
  const userCompanies = await getUserCompanies(session.id);

  // Fetch data in parallel
  const [overview, jobStats] = await Promise.all([
    getReportOverview(params),
    getBackgroundJobStats(params),
  ]);

  // Calculate conversion rate (pending to submitted)
  const pendingReviews = overview.reviewsByStatus.find((s: { status: string; count: number }) => s.status === "PENDING")?.count || 0;
  const submittedReviews = overview.reviewsByStatus.find((s: { status: string; count: number }) => s.status === "SUBMITTED")?.count || 0;
  const totalAvailable = pendingReviews + submittedReviews;
  const conversionRate = totalAvailable > 0 ? ((submittedReviews / totalAvailable) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-500">Tổng quan hoạt động hệ thống</p>
        </div>
        <ExportCsvButton params={params} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Chọn khoảng thời gian và công ty để lọc dữ liệu</CardDescription>
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
            { (session.role === "ADMIN" || hasCompaniesRead || hasReviewsRead) && (
              <div className="flex-1">
                <label htmlFor="companyId" className="block text-sm font-medium mb-1">Công ty</label>
                <select
                  name="companyId"
                  id="companyId"
                  defaultValue={params.companyId || ""}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tất cả công ty</option>
                  {userCompanies.map((company: { id: string; name: string }) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <Button type="submit" variant="outline" size="sm">
                Áp dụng
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tổng số khách hàng"
          value={overview.totalCompanies}
          icon={Building2}
          description={`${overview.activeCompanies} đang hoạt động, ${overview.inactiveCompanies} đã tắt`}
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
        <StatCard
          title="Người dùng"
          value={overview.totalUsers}
          icon={Users}
          description={`${overview.usersByRole.find((r: { role: string; count: number }) => r.role === "ADMIN")?.count || 0} admin, ${overview.usersByRole.filter((r: { role: string; count: number }) => r.role !== "ADMIN").reduce((sum: number, r: { role: string; count: number }) => sum + r.count, 0)} khác`}
        />
      </div>

      {/* Stats Grid - Background Job & Users */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Background Job Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê Background Jobs</CardTitle>
            <CardDescription>Tình trạng job tạo đánh giá tự động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tổng số job</span>
                <span className="text-sm font-bold">{jobStats.totalJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tỷ lệ hoàn thành</span>
                <span className="text-sm font-bold">{jobStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Số lần thử trung bình</span>
                <span className="text-sm font-bold">{jobStats.averageAttempts.toFixed(1)}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Trạng thái</p>
                <div className="space-y-1">
                  {jobStats.jobsByStatus.map((s: { status: string; count: number }) => (
                    <div key={s.status} className="flex justify-between text-xs">
                      <span>{s.status}</span>
                      <span>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ người dùng</CardTitle>
            <CardDescription>Theo vai trò</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.usersByRole.map((role: { role: string; count: number }) => (
                <div key={role.role} className="flex items-center justify-between">
                  <Badge variant={role.role === "ADMIN" ? "error" : "default"}>
                    {role.role}
                  </Badge>
                  <span className="font-bold">{role.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái đánh giá</CardTitle>
          <CardDescription>Tổng quan các trạng thái trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overview.reviewsByStatus.map((status: { status: string; count: number }) => (
              <div key={status.status} className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-primary">{formatNumber(status.count)}</p>
                <Badge variant={
                  status.status === "SUBMITTED" ? "success" :
                  status.status === "PENDING" ? "warning" : "error"
                } className="mt-2">
                  {status.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
