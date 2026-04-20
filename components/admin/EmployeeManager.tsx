"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignEmployeeToCompanyAction, removeEmployeeFromCompanyAction } from "@/actions/user";
import { Button } from "@/components/ui/Button";

interface EmployeeAssignment {
  id: string;
  employeeId: string;
  companyId: string;
  createdAt: Date;
  employee: {
    id: string;
    email: string;
    name: string;
    createdAt?: Date;
  };
}

interface Employee {
  id: string;
  email: string;
  name: string;
  createdAt?: Date;
}

interface EmployeeManagerProps {
  companyId: string;
  initialEmployees: EmployeeAssignment[];
  allEmployees: Employee[];
}

export function EmployeeManager({
  companyId,
  initialEmployees,
  allEmployees,
}: EmployeeManagerProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const assignedIds = new Set(employees.map((e) => e.employeeId));
  const availableEmployees = allEmployees.filter((e) => !assignedIds.has(e.id));

  async function handleAssign() {
    if (!selectedEmployeeId) return;
    startTransition(async () => {
      await assignEmployeeToCompanyAction(selectedEmployeeId, companyId);
      // Refresh the list
      const newAssignment = availableEmployees.find((e) => e.id === selectedEmployeeId);
      if (newAssignment) {
        setEmployees([
          {
            id: `temp-${Date.now()}`,
            employeeId: newAssignment.id,
            companyId,
            createdAt: new Date(),
            employee: newAssignment,
          },
          ...employees,
        ]);
        setSelectedEmployeeId("");
      }
      router.refresh();
    });
  }

  async function handleRemove(employeeId: string) {
    if (!confirm("Gỡ nhân viên khỏi công ty này?")) return;
    startTransition(async () => {
      await removeEmployeeFromCompanyAction(employeeId, companyId);
      setEmployees(employees.filter((e) => e.employeeId !== employeeId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
        >
          <option value="">-- Chọn nhân viên --</option>
          {availableEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.email})
            </option>
          ))}
        </select>
        <Button
          onClick={handleAssign}
          disabled={!selectedEmployeeId || isPending}
        >
          {isPending ? "Đang gán..." : "Gán"}
        </Button>
      </div>

      {employees.length === 0 ? (
        <p className="text-sm text-gray-400">Chưa có nhân viên nào được gán</p>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-text">{emp.employee.name}</p>
                <p className="text-xs text-gray-500">{emp.employee.email}</p>
              </div>
              <button
                onClick={() => handleRemove(emp.employeeId)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Gỡ bỏ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}