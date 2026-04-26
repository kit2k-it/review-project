import { Metadata } from "next";
import { getReviewsAction } from "@/actions/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Đánh giá — QRReview" };

export const revalidate = 10;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getReviewsAction({
    status: params.status || undefined,
    page: Number(params.page) || 1,
    pageSize: 20,
  });

  const reviews = result?.reviews ?? [];
  const pagination = result?.pagination ?? {
    page: Number(params.page) || 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  };

  const statusColors: Record<string, "success" | "warning" | "default"> = {
    SUBMITTED: "success",
    PENDING: "warning",
    EXPIRED: "default",
  };

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Đã gửi",
    PENDING: "Đang xử lý",
    EXPIRED: "Hết hạn",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Đánh giá</h1>
        <p className="text-sm text-gray-500">Xem tất cả đánh giá từ khách hàng</p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-3">
            <select
              name="status"
              defaultValue={params.status || ""}
              className="h-10 flex-1 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUBMITTED">Đã gửi</option>
              <option value="PENDING">Đang xử lý</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Lọc
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Reviews table — desktop */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-gray-400">Chưa có đánh giá nào</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Ngày</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Khách hàng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Mã QR</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nội dung</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Sao</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {review.submittedAt ? formatDateTime(review.submittedAt) : formatDateTime(review.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{review.company.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{review.qrCode.code}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 text-gray-600">{review.content}</p>
                        {review.customerName && (
                          <p className="text-xs text-gray-400 mt-1">Từ: {review.customerName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-amber-500 whitespace-nowrap">
                        {"★".repeat(review.rating)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusColors[review.status]}>
                          {statusLabels[review.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text">{review.company.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{review.qrCode.code}</p>
                    </div>
                    <Badge variant={statusColors[review.status]} className="whitespace-nowrap">
                      {statusLabels[review.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                  {review.customerName && (
                    <p className="text-xs text-gray-400">Từ: {review.customerName}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-amber-500 text-sm">{"★".repeat(review.rating)}</span>
                    <span className="text-xs text-gray-400">
                      {review.submittedAt ? formatDateTime(review.submittedAt) : formatDateTime(review.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/reviews?page=${p}&status=${params.status || ""}`}
              className={`rounded-md border px-3 py-1 text-sm ${
                p === pagination.page ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-gray-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
