import { notFound, redirect } from "next/navigation";
import { JobDetailView } from "@/components/jobs/job-detail-view";
import { getLatestApplyAssist } from "@/modules/apply-assist/service";
import {
  getOpportunity,
  getUserSkillOverlap,
  requireJobsUser,
} from "@/modules/jobs/service";
import {
  getMatchForJob,
  runMatchingForUser,
} from "@/modules/matching/service";

export const metadata = { title: "Opportunity" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireJobsUser();
  if (!user) redirect("/login?next=/app/jobs");

  const { id } = await params;
  const job = await getOpportunity(id);
  if (!job) notFound();

  let match = await getMatchForJob(user.id, job.id);
  if (!match) {
    await runMatchingForUser(user.id);
    match = await getMatchForJob(user.id, job.id);
  }

  const [overlap, assist] = await Promise.all([
    getUserSkillOverlap(user.id, job.id),
    getLatestApplyAssist(user.id, job.id),
  ]);

  return (
    <JobDetailView
      job={job}
      overlap={overlap}
      match={match}
      userEmail={user.email}
      applyAssist={
        assist
          ? {
              id: assist.id,
              coverLetter: assist.coverLetter,
              talkingPoints: assist.talkingPoints,
              emailSubject: assist.emailSubject,
              emailedAt: assist.emailedAt?.toISOString() ?? null,
              createdAt: assist.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
