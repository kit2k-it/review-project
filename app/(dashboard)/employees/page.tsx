import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Employee management is now at /admin/employees for admins
  if (session.user.role === "ADMIN") {
    redirect("/admin/employees");
  }

  // Non-admins cannot manage employees
  redirect("/companies");
}
