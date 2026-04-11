import { redirect } from "next/navigation";

// Trang settings hiện tại chưa có nội dung — redirect về trang chủ
export default function SettingsPage() {
  redirect("/");
}