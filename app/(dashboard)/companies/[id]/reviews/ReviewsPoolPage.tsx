import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, canViewCompany, canManageCompany } from "@/lib/auth";
import { getCompanyReviewPoolAction, getPreGeneratedReviewsAction } from "@/actions/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Star, ArrowLeft, RefreshCw, Clock, CheckCircle, Bot, User } from "lucide-react";
import { AddReviewForm } from "./AddReviewForm";
import { ReviewItemActions } from "./ReviewItemActions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `Đánh giá — ${company.name}` : "Không tìm thấy" };
}

export default async function ReviewsPoolPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) notFound();

  // Check access
  const canView = await canViewCompany(id);
  if (!canView) notFound();

  const canManage = await canManageCompany(id);

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const [reviewsResult, pool] = await Promise.all([
    getPreGeneratedReviewsAction({ companyId: id, pageSize: 30 }),
    getCompanyReviewPoolAction(id),
  ]);

  if ("error" in reviewsResult || "error" in pool) notFound();

  const { reviews, pagination } = reviewsResult;
  const safePool = pool as { available: number; used: number; pendingJob: boolean };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/companies/${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Đánh giá — {company.name}</h1>
          <p className="text-sm text-gray-500">Danh sách đánh giá được tạo sẵn</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{safePool.available}</p>
              <p className="text-sm text-gray-500">Còn trống</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{safePool.used}</p>
              <p className="text-sm text-gray-500">Đã dùng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`rounded-lg p-3 ${safePool.pendingJob ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"}`}>
              <RefreshCw className={`h-5 w-5 ${safePool.pendingJob ? "animate-spin" : ""}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {safePool.pendingJob ? "Đang tạo..." : "Sẵn sàng"}
              </p>
              <p className="text-sm text-gray-500">Trạng thái</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Các đánh giá được tạo sẵn sẽ được khách quét QR sử dụng. Khi hết đánh giá,
              hệ thống sẽ tự động tạo thêm (cần API key OpenAI).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Review */}
      <AddReviewForm companyId={id} canManage={canManage} />

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Star className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-400">Chưa có đánh giá nào</p>
            <p className="text-sm text-gray-400">Đánh giá sẽ được tạo tự động khi có khách hàng</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className={!review.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-amber-500">{"★".repeat(review.rating)}</span>
                      <Badge variant={review.isUsed ? "default" : "success"}>
                        {review.isUsed ? "Đã dùng" : "Còn trống"}
                      </Badge>
                      {!review.isActive && (
                        <Badge variant="error">Đã tắt</Badge>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        review.isManuallyCreated
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}>
                        {review.isManuallyCreated ? (
                          <>
                            <User className="h-3 w-3" />
                            Thủ công
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3" />
                            AI
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{review.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {review.usedAt
                        ? `Đã dùng: ${formatDateTime(review.usedAt)}`
                        : `Tạo: ${formatDateTime(review.createdAt)}`}
                    </p>
                  </div>
                  <ReviewItemActions
                    reviewId={review.id}
                    companyId={id}
                    initialContent={review.content}
                    initialRating={review.rating}
                    isActive={review.isActive}
                    isUsed={review.isUsed}
                    canManage={canManage}
                  />
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
              href={`/companies/${id}/reviews?page=${p}`}
              className={`rounded-md border px-3 py-1 text-sm ${
                p === pagination.page ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-gray-50"
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
