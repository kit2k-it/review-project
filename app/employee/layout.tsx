import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth";
import { DashboardClientWrapper } from "@/components/dashboard/DashboardClientWrapper";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireEmployee();

  return (
    <DashboardClientWrapper user={user}>
      {children}
    </DashboardClientWrapper>
  );
}
