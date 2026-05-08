import { getSession } from "@/lib/auth";
import { listUsersAction } from "@/actions/user";
import { EmployeeUserClient } from "@/components/employee/EmployeeUserClient";

export default async function EmployeeUsersPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Không có quyền truy cập</h1>
      </div>
    );
  }

  const data = await listUsersAction({ pageSize: 50, role: "CLIENT" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text">Quản lý khách hàng</h1>
        <p className="text-sm text-gray-500">Tạo và quản lý tài khoản khách hàng</p>
      </div>

      <EmployeeUserClient initialUsers={data} />
    </div>
  );
}
