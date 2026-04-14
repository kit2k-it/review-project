import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClientWrapper } from "@/components/dashboard/DashboardClientWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardClientWrapper user={session.user}>
      {children}
    </DashboardClientWrapper>
  );
}