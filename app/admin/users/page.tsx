import { requireAdmin } from "@/lib/auth";
import { listUsersAction } from "@/actions/user";
import { UserManagementClient } from "@/components/admin/UserManagementClient";

export default async function AdminUsersPage() {
  const user = await requireAdmin();

  const data = await listUsersAction({ pageSize: 50 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text">Quản lý tài khoản</h1>
        <p className="text-sm text-gray-500">Tạo, chỉnh sửa và phân quyền tài khoản</p>
      </div>

      <UserManagementClient initialUsers={data} currentUserRole={user.role} currentUserId={user.id} />
    </div>
  );
}