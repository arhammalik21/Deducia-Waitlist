import { redirect } from "next/navigation";
import { TargetRoleView } from "@/components/career/target-role-view";
import {
  getTargetRoleAnalysis,
  requireCareerUser,
} from "@/modules/career-graph/service";

export const metadata = { title: "Target Role" };

export default async function TargetRolePage() {
  const user = await requireCareerUser();
  if (!user) redirect("/login?next=/app/target-role");

  const data = await getTargetRoleAnalysis(user.id);
  return <TargetRoleView data={data} />;
}
