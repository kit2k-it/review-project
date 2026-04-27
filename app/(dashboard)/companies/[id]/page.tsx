import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, canViewCompany, canManageCompany } from "@/lib/auth";
import { getCompanyReviewPoolAction } from "@/actions/review";
import QrCodesManager from "@/components/dashboard/QrCodesManager";
import CompanyDetailEdit from "./CompanyDetailEdit";
import Link from "next/link";
import { ArrowLeft, Star, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { assignCompanyToUserAction } from "@/actions/permission";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  return { title: company ? `${company.name} — QRReview` : "Không tìm thấy" };
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;
  console.log('[CompanyDetailPage] Requested company ID:', id);

  const session = await getSession();
  if (!session?.user) {
    console.log('[CompanyDetailPage] No session - notFound');
    notFound();
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  console.log('[CompanyDetailPage] User:', userId, 'role:', userRole);

  // Check access
  const canView = await canViewCompany(id);
  console.log('[CompanyDetailPage] canView result:', canView);
  if (!canView) {
    console.log('[CompanyDetailPage] Access denied - notFound');
    notFound();
  }

  // Check if user can manage this company
  const canManage = await canManageCompany(id);

  const [company, qrCodes, poolResult, assignedUsers] = await Promise.all([
    prisma.company.findUnique({ where: { id } }),
    prisma.qrCode.findMany({
      where: { companyId: id },
      include: { _count: { select: { reviews: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyReviewPoolAction(id),
    // Get users who have access to this company (via permissions)
    prisma.userPermission.findMany({
      where: { companyId: id },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        permission: {
          select: { code: true },
        },
      },
    }) as any,
  ]);

  console.log('[CompanyDetailPage] Company query result:', company ? 'FOUND' : 'NOT FOUND');
  if (!company) {
    console.log('[CompanyDetailPage] Company not found - notFound');
    notFound();
  }
  if ("error" in poolResult) notFound();
  const pool = poolResult as { available: number; used: number; pendingJob: boolean };

  // Group assigned users by permission type
  const usersWithAccess = (assignedUsers as any[]).filter(up =>
    up.permission.code === "companies:read" || up.permission.code === "companies:manage"
  );

  // Check if current user can assign access
  const canAssignAccess = userRole === "ADMIN" || await canManageCompany(id);

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/companies"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">{company.name}</h1>
            <p className="text-sm text-gray-500">Chi tiết khách hàng</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info + Edit + Access Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* Info + Edit form */}
          <CompanyDetailEdit company={company} canManage={canManage} />

          {/* Review pool */}
          <Link href={`/companies/${id}/reviews`}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-text">{pool.available} đánh giá còn trống</p>
                    <p className="text-xs text-gray-500">{pool.used} đã dùng</p>
                  </div>
                </div>
                {pool.pendingJob && (
                  <span className="text-xs text-amber-500 animate-pulse">đang tạo...</span>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Access Management - Show who has access */}
          {(canManage || userRole === "ADMIN") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Truy cập
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Người dùng có quyền xem</h4>
                  {usersWithAccess.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa ai được gán quyền</p>
                  ) : (
                    <ul className="space-y-2">
                      {usersWithAccess.map((up) => (
                        <li key={up.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{up.user.name}</span>
                            <span className="text-gray-500 ml-2">({up.user.email})</span>
                            <div className="text-xs text-gray-400">
                              {up.user.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Assign access button */}
                {canAssignAccess && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const email = formData.get("email") as string;

                      // Find user by email
                      const targetUser = await prisma.user.findFirst({
                        where: { email },
                      });

                      if (!targetUser) {
                        // Return error via redirect
                        redirect(`/companies/${id}?error=Không tìm thấy người dùng`);
                        return;
                      }

                      const result = await assignCompanyToUserAction(targetUser.id, id);

                      if (result.error) {
                        redirect(`/companies/${id}?error=${encodeURIComponent(result.error)}`);
                      }
                      redirect(`/companies/${id}?success=1`);
                    }}
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gán quyền truy cập cho người dùng</label>
                      <div className="flex gap-2">
                        <input
                          name="email"
                          type="email"
                          placeholder="Email người dùng..."
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        />
                        <Button type="submit" size="sm">
                          <UserPlus className="h-4 w-4" />
                          Gán
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Nhập email của nhân viên/khách hàng để gán quyền xem công ty này
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: QR Codes */}
        <div className="lg:col-span-2">
          <QrCodesManager company={company} qrCodes={qrCodes} pool={pool} canManage={canManage} />
        </div>
      </div>
    </div>
  );
}