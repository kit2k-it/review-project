import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminIndexPage() {
  await requireAdmin();
  redirect("/admin/users");
}