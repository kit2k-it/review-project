import { getMyEmployeesAction } from "@/actions/user";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const employees = await getMyEmployeesAction();

  return <EmployeesClient initialEmployees={employees} />;
}
