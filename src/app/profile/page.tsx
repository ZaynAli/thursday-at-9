import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { getCurrentUser } from "@/lib/data";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  return <ProfileClient />;
}
