import { getSession, hasPermission } from "@/lib/auth";
import { listUsersAction } from "@/actions/user";
import { UserManagementClient } from "@/components/admin/UserManagementClient";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Chưa đăng nhập</h1>
        <p className="text-gray-500">Vui lòng <a href="/login" className="text-primary hover:underline">đăng nhập</a> để tiếp tục</p>
      </div>
    );
  }

  const user = session.user;

  // Check if user has permission to manage users (admin or has user:create permission)
  const isAdmin = user.role === "ADMIN";
  const canCreateUser = await hasPermission(user.id, "user:create");

  if (!isAdmin && !canCreateUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Không có quyền truy cập</h1>
        <p className="text-gray-500">Bạn không có quyền quản lý tài khoản</p>
      </div>
    );
  }

  const params = await searchParams;
  const roleFilter = params.role === "CLIENT" ? "CLIENT" : undefined;

  const data = await listUsersAction({ pageSize: 50, role: roleFilter });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {roleFilter === "CLIENT" ? "Quản lý khách hàng" : "Quản lý tài khoản"}
        </h1>
        <p className="text-sm text-gray-500">
          {roleFilter === "CLIENT"
            ? "Tạo và quản lý tài khoản khách hàng"
            : "Tạo, chỉnh sửa và phân quyền tài khoản"}
        </p>
      </div>

      <UserManagementClient initialUsers={data} currentUserRole={user.role} currentUserId={user.id} />
    </div>
  );
}