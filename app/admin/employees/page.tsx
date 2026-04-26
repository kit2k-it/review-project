import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AdminEmployeesPage() {
  const admin = await requireAdmin();

  // Get all users with role EMPLOYEE or CLIENT (non-admin)
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["EMPLOYEE", "CLIENT"],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          companies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get permissions for each user
  const usersWithPerms = await Promise.all(
    users.map(async (user) => {
      const perms = await prisma.userPermission.findMany({
        where: { userId: user.id },
        include: {
          permission: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        ...user,
        permissions: perms,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên & Khách hàng</h1>
          <p className="text-gray-600 mt-1">
            Phân quyền và quản lý truy cập cho nhân viên và khách hàng
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quyền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Công ty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersWithPerms.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "EMPLOYEE"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role === "EMPLOYEE" ? "Nhân viên" : "Khách hàng"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.length === 0 ? (
                      <span className="text-xs text-gray-500">Không có quyền đặc biệt</span>
                    ) : (
                      user.permissions.map((perm) => (
                        <span
                          key={perm.id}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                          title={perm.company ? `Cho công ty: ${perm.company.name}` : "Toàn cục"}
                        >
                          {perm.permission.code}
                          {perm.company && " (*)"}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Companies count based on ownership or permissions */}
                  {user._count.companies > 0 ? (
                    <span>{user._count.companies} công ty</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/admin/employees/${user.id}/permissions`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Phân quyền
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usersWithPerms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Chưa có nhân viên hoặc khách hàng nào</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">📌 Ghi chú:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Nhân viên (EMPLOYEE)</strong>: Có thể được phân quyền để quản lý công ty và mã QR</li>
          <li>• <strong>Khách hàng (CLIENT)</strong>: Mặc định chỉ đọc, có thể được gán quyền truy cập vào công ty cụ thể</li>
          <li>• Nhấn &quot;Phân quyền&quot; để gán/thay đổi quyền cho từng người dùng</li>
          <li>• (*) = Quyền áp dụng cho một công ty cụ thể</li>
        </ul>
      </div>
    </div>
  );
}
