"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/actions/user";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Plus, Trash2, Mail, X, Pencil } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
}

export function EmployeesClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [showCreate, setShowCreate] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createUserAction({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
        role: "EMPLOYEE",
      });
      if (result.success && result.userId) {
        const newEmployee: Employee = {
          id: result.userId,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
        };
        setEmployees((prev) => [newEmployee, ...prev]);
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa tài khoản nhân viên này?")) return;
    startTransition(async () => {
      const { deleteUserAction } = await import("@/actions/user");
      await deleteUserAction(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    });
  }

  async function handleEdit(formData: FormData) {
    startTransition(async () => {
      const { updateEmployeeAction } = await import("@/actions/user");
      const result = await updateEmployeeAction(editEmployee!.id, {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string || undefined,
      });
      if (result.success) {
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editEmployee!.id
              ? { ...e, name: formData.get("name") as string, email: formData.get("email") as string }
              : e
          )
        );
        setEditEmployee(null);
        router.refresh();
      }
    });
  }

  const filtered = employees.filter(
    (e) =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Nhân viên</h1>
          <p className="text-sm text-gray-500">Quản lý tài khoản nhân viên của bạn</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      {employees.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="mb-2 text-lg font-medium text-gray-400">Chưa có nhân viên nào</p>
            <p className="mb-4 text-sm text-gray-400">
              Tạo tài khoản nhân viên để gán vào công ty
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-400">
                Không tìm thấy nhân viên nào
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((emp) => (
                <Card key={emp.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text">{emp.name}</p>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditEmployee(emp)}
                        className="text-gray-500 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(emp.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          isPending={isPending}
        />
      )}

      {/* Edit modal */}
      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSubmit={handleEdit}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function CreateEmployeeModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Thêm nhân viên</h2>
            <p className="text-sm text-gray-500">Tài khoản sẽ được tạo với vai trò Nhân viên</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={onSubmit}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Họ tên</label>
            <Input name="name" required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Email</label>
            <Input name="email" type="email" required placeholder="nhanvien@company.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mật khẩu</label>
            <Input name="password" type="password" required minLength={6} placeholder="Tối thiểu 6 ký tự" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-gray-50">
              Hủy
            </button>
            <SubmitButton disabled={isPending}>Tạo tài khoản</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({
  employee,
  onClose,
  onSubmit,
  isPending,
}: {
  employee: Employee;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Sửa thông tin nhân viên</h2>
            <p className="text-sm text-gray-500">Cập nhật tên, email hoặc đặt lại mật khẩu</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={onSubmit}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Họ tên</label>
            <Input name="name" required defaultValue={employee.name} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Email</label>
            <Input name="email" type="email" required defaultValue={employee.email} placeholder="nhanvien@company.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Mật khẩu mới
              <span className="ml-1 font-normal text-gray-400">(bỏ trống nếu không đổi)</span>
            </label>
            <Input name="password" type="password" minLength={6} placeholder="Tối thiểu 6 ký tự" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-gray-50">
              Hủy
            </button>
            <SubmitButton disabled={isPending}>Lưu thay đổi</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
