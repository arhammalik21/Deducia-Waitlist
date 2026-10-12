import { redirect } from "next/navigation";
import { ProfileView } from "@/components/career/profile-view";
import {
  getCareerProfile,
  requireCareerUser,
} from "@/modules/career-graph/service";

export const metadata = { title: "Career Profile" };

export default async function ProfilePage() {
  const user = await requireCareerUser();
  if (!user) redirect("/login?next=/app/profile");

  const data = await getCareerProfile(user.id);
  return <ProfileView data={data} />;
}
