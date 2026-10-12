import { redirect } from "next/navigation";
import { GraphView } from "@/components/career/graph-view";
import {
  getCareerGraphView,
  requireCareerUser,
} from "@/modules/career-graph/service";

export const metadata = { title: "Career Graph" };

export default async function GraphPage() {
  const user = await requireCareerUser();
  if (!user) redirect("/login?next=/app/graph");

  const data = await getCareerGraphView(user.id);
  return <GraphView data={data} />;
}
