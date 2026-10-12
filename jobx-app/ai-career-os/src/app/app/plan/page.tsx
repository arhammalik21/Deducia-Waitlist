import { redirect } from "next/navigation";
import { PlanView } from "@/components/plans/plan-view";
import {
  generateActionPlan,
  getPlanDashboard,
  requirePlanUser,
} from "@/modules/plans/service";

export const metadata = { title: "Action Plan" };

export default async function PlanPage() {
  const user = await requirePlanUser();
  if (!user) redirect("/login?next=/app/plan");

  let data = await getPlanDashboard(user.id);

  // Auto-generate once when matches+gaps exist but no active plan.
  if (!data.plan && data.matchCount > 0 && data.gapCount > 0) {
    await generateActionPlan(user.id);
    data = await getPlanDashboard(user.id);
  }

  return <PlanView data={data} />;
}
