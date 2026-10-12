import { redirect } from "next/navigation";
import { GapsView } from "@/components/gaps/gaps-view";
import { getGapsDashboard, requireGapsUser } from "@/modules/gaps/service";
import { runMatchingForUser } from "@/modules/matching/service";
import { prisma } from "@/lib/db";

export const metadata = { title: "Skill Gaps" };

export default async function GapsPage() {
  const user = await requireGapsUser();
  if (!user) redirect("/login?next=/app/gaps");

  const [jobCount, matchCount] = await Promise.all([
    prisma.job.count({ where: { status: "ACTIVE" } }),
    prisma.jobMatch.count({ where: { userId: user.id } }),
  ]);

  if (jobCount > 0 && matchCount === 0) {
    await runMatchingForUser(user.id);
  }

  const data = await getGapsDashboard(user.id);
  return <GapsView data={data} />;
}
