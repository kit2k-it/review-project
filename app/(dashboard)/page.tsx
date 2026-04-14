import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, QrCode, Star } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const [companyCount, qrCount, reviewCount, recentReviews] = await Promise.all([
    prisma.company.count({ where: { userId: user.id } }),
    prisma.qrCode.count({ where: { company: { userId: user.id } } }),
    prisma.review.count({ where: { company: { userId: user.id }, status: "SUBMITTED" } }),
    prisma.review.findMany({
      where: { company: { userId: user.id }, status: "SUBMITTED" },
      include: { company: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Khách hàng", value: companyCount, icon: Building2, color: "text-primary" },
    { label: "Mã QR", value: qrCount, icon: QrCode, color: "text-secondary" },
    { label: "Đánh giá", value: reviewCount, icon: Star, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Tổng quan</h1>
        <p className="text-sm text-gray-500">Xem tổng quan hoạt động của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg bg-gray-50 p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bắt đầu nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/companies/new"
              className="block rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-medium text-text">+ Thêm khách hàng mới</p>
              <p className="text-sm text-gray-500">Tìm kiếm trên Google Maps</p>
            </Link>
            <Link
              href="/companies"
              className="block rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-medium text-text">Quản lý mã QR</p>
              <p className="text-sm text-gray-500">Tạo và tải mã QR cho khách hàng</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đánh giá gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có đánh giá nào</p>
            ) : (
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{review.company.name}</span>
                      <span className="text-xs text-amber-500">{"★".repeat(review.rating)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}