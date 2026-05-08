import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserCompaniesPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { id: userId } = await params;

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Không tìm thấy người dùng</h1>
      </div>
    );
  }

  // Get companies user owns
  const ownedCompanies = await prisma.company.findMany({
    where: { userId: userId },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  // Get companies user has permissions for
  const permCompanies = await prisma.userPermission.findMany({
    where: {
      userId: userId,
      companyId: { not: null },
    },
    include: {
      company: {
        select: { id: true, name: true, isActive: true },
      },
      permission: {
        select: { code: true, name: true },
      },
    },
  });

  // Group companies by id and collect permissions
  const companyMap = new Map<string, {
    id: string;
    name: string;
    isActive: boolean;
    permissions: string[];
    isOwner: boolean;
  }>();

  // Add owned companies
  ownedCompanies.forEach(c => {
    companyMap.set(c.id, {
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      permissions: [],
      isOwner: true,
    });
  });

  // Add permission-based companies
  permCompanies.forEach(p => {
    if (!p.company) return;
    const existing = companyMap.get(p.companyId!);
    if (existing) {
      existing.permissions.push(p.permission.code);
    } else {
      companyMap.set(p.companyId!, {
        id: p.companyId!,
        name: p.company.name,
        isActive: p.company.isActive,
        permissions: [p.permission.code],
        isOwner: false,
      });
    }
  });

  const companies = Array.from(companyMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Công ty của {user.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {user.email} - {user.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Danh sách công ty ({companies.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Người dùng này chưa có quyền truy cập vào công ty nào
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {company.name}
                      </Link>
                      {!company.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Ngưng hoạt động
                        </span>
                      )}
                      {company.isOwner && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Chủ sở hữu
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {company.permissions.map((perm, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/companies/${company.id}`}>
                      Xem
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
