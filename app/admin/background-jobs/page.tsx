import { Metadata } from "next";
import { getBackgroundJobs, getJobStats, retryJobAction, cancelJobAction } from "@/actions/background-job";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Play, XCircle, RefreshCw, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Background Jobs — QRReview" };

const STATUS_COLORS: Record<string, "default" | "outline" | "success" | "warning" | "error"> = {
  PENDING: "outline",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "default",
};

export default async function BackgroundJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jobType?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const jobType = params.jobType || "";
  const page = Number(params.page) || 1;

  const [{ jobs, pagination }, stats] = await Promise.all([
    getBackgroundJobs({
      status: status || undefined,
      jobType: jobType || undefined,
      page,
      pageSize: 20,
    }),
    getJobStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Background Jobs</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi các công việc nền</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">← Quay lại Admin</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.PENDING || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus.RUNNING || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.COMPLETED || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.byStatus.FAILED || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap gap-3">
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Pending</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              name="jobType"
              defaultValue={jobType}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Tất cả loại job</option>
              <option value="GENERATE_REVIEWS">Generate Reviews</option>
            </select>
            <Button type="submit" variant="outline" size="sm">
              Lọc
            </Button>
            {status && <Link href="/admin/background-jobs"><Button variant="ghost" size="sm">Xóa filter</Button></Link>}
          </form>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách jobs ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Không có job nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Company</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Attempts</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-left py-3 px-4 font-medium">Started</th>
                    <th className="text-left py-3 px-4 font-medium">Error</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {job.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/companies/${job.companyId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {job.company?.name || "Unknown"}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{job.jobType}</td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_COLORS[job.status] || "default"}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{job.attempts}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(job.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-red-600" title={job.errorMsg || ""}>
                        {job.errorMsg ? (
                          <span className="text-xs">{job.errorMsg.slice(0, 50)}...</span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {(job.status === "FAILED" || job.status === "CANCELLED") && (
                            <form action={async () => {
                              "use server";
                              await retryJobAction(job.id);
                            }}>
                              <Button type="submit" size="sm" variant="outline">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            </form>
                          )}
                          {(job.status === "PENDING" || job.status === "RUNNING") && (
                            <form action={async () => {
                              "use server";
                              await cancelJobAction(job.id);
                            }}>
                              <Button type="submit" size="sm" variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?status=${status}&jobType=${jobType}&page=${p}`}
              className={`px-3 py-2 rounded text-sm ${
                p === page
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {/* Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">📌 Ghi chú:</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Retry</strong>: Chỉ có thể dùng cho job FAILED hoặc CANCELLED. Sẽ reset job về PENDING và thử lại.</p>
          <p>• <strong>Cancel</strong>: Dừng job đang PENDING hoặc RUNNING.</p>
          <p>• <strong>Auto-generation</strong>: Khi pool review của công ty còn &lt;10, hệ thống sẽ tự động tạo 15 review mới.</p>
        </CardContent>
      </Card>
    </div>
  );
}
