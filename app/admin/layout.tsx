import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardClientWrapper } from "@/components/dashboard/DashboardClientWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <DashboardClientWrapper user={user}>
      {children}
    </DashboardClientWrapper>
  );
}
