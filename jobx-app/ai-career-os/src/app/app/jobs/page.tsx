import { redirect } from "next/navigation";
import { JobsView } from "@/components/jobs/jobs-view";
import {
  listOpportunities,
  requireJobsUser,
  runSeedIngest,
} from "@/modules/jobs/service";
import { runMatchingForUser } from "@/modules/matching/service";
import { prisma } from "@/lib/db";

export const metadata = { title: "Opportunities" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    workMode?: string;
    seniority?: string;
    employmentType?: string;
    sort?: string;
  }>;
}) {
  const user = await requireJobsUser();
  if (!user) redirect("/login?next=/app/jobs");

  const params = await searchParams;
  const filters = {
    q: params.q,
    workMode: params.workMode,
    seniority: params.seniority,
    employmentType: params.employmentType,
    sort: params.sort === "recent" ? ("recent" as const) : ("relevance" as const),
  };

  let data = await listOpportunities(user.id, filters);
  if (
    data.total === 0 &&
    !filters.q &&
    !filters.workMode &&
    !filters.seniority &&
    !filters.employmentType
  ) {
    await runSeedIngest();
    data = await listOpportunities(user.id, filters);
  }

  const matchCount = await prisma.jobMatch.count({ where: { userId: user.id } });
  if (data.total > 0 && matchCount === 0) {
    await runMatchingForUser(user.id);
    data = await listOpportunities(user.id, filters);
  }

  return <JobsView data={data} filters={filters} />;
}
