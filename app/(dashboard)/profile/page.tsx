import { getSession } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) return null;

  return <ProfileClient user={session.user} />;
}
