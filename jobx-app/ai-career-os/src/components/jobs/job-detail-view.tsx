import Link from "next/link";
import {
  ApplyAssistPanel,
  type ApplyAssistSnapshot,
} from "@/components/jobs/apply-assist-panel";
import { formatMonthYear } from "@/lib/format";
import type {
  getOpportunity,
  getUserSkillOverlap,
} from "@/modules/jobs/service";
import type { getMatchForJob } from "@/modules/matching/service";

type Job = NonNullable<Awaited<ReturnType<typeof getOpportunity>>>;
type Overlap = Awaited<ReturnType<typeof getUserSkillOverlap>>;
type Match = Awaited<ReturnType<typeof getMatchForJob>>;

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
) {
  if (min == null && max == null) return null;
  const cur = currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function JobDetailView({
  job,
  overlap,
  match,
  userEmail,
  applyAssist,
}: {
  job: Job;
  overlap: Overlap;
  match: Match;
  userEmail: string;
  applyAssist: ApplyAssistSnapshot;
}) {
  const required = job.jobSkills.filter((s) => s.importance === "REQUIRED");
  const preferred = job.jobSkills.filter((s) => s.importance === "PREFERRED");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/jobs"
        className="text-sm text-[var(--muted)] hover:text-white"
      >
        ← Back to opportunities
      </Link>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Opportunity
      </p>
      <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
        {job.title}
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        {job.company}
        {job.location ? ` · ${job.location}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--trust-text)]">
        {job.workMode ? <Meta>{job.workMode}</Meta> : null}
        {job.employmentType ? <Meta>{job.employmentType}</Meta> : null}
        {job.seniority ? <Meta>{job.seniority}</Meta> : null}
        <Meta>{job.freshness}</Meta>
        <Meta>source: {job.source}</Meta>
      </div>

      {match ? (
        <section className="panel mt-8 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                JobMatch {match.scorerVersion}
              </p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {Math.round(match.overallScore * 100)}%
              </p>
            </div>
            <Link href="/app/gaps" className="text-sm text-white hover:underline">
              Review gaps →
            </Link>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--trust-text)]">
            {match.explanation}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {(
              [
                ["Skills", match.skillsScore],
                ["Experience", match.experienceScore],
                ["Education", match.educationScore],
                ["Location", match.locationScore],
                ["Evidence", match.evidenceScore],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[var(--border)] px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {Math.round(value * 100)}%
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="panel mt-6 grid gap-3 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Compensation
          </p>
          <p className="mt-1 text-sm text-white">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) ||
              "Not listed"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Posted
          </p>
          <p className="mt-1 text-sm text-white">
            {job.postedAt ? formatMonthYear(job.postedAt) : "Unknown"}
          </p>
        </div>
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-semibold text-white">Skill overlap</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              You have ({overlap.have.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {overlap.have.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">None yet</p>
              ) : (
                overlap.have.map((js) => (
                  <span
                    key={js.id}
                    className="rounded-full border border-[#7dd3a0]/40 bg-[#7dd3a0]/10 px-2.5 py-0.5 text-xs text-[#b8f0cc]"
                  >
                    {js.skill.canonicalName}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Missing ({overlap.missing.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {overlap.missing.slice(0, 12).map((js) => (
                <span
                  key={js.id}
                  className="rounded-full border border-[#f0c674]/40 bg-[#f0c674]/10 px-2.5 py-0.5 text-xs text-[#f5dba0]"
                >
                  {js.skill.canonicalName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-semibold text-white">Required skills</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {required.map((js) => (
            <span
              key={js.id}
              className="rounded-full border border-[#7dd3a0]/35 bg-[#7dd3a0]/10 px-3 py-1 text-sm text-[#b8f0cc]"
            >
              {js.skill.canonicalName}
            </span>
          ))}
        </div>
        {preferred.length > 0 ? (
          <>
            <h3 className="mt-6 text-sm font-medium text-white">Preferred</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {preferred.map((js) => (
                <span
                  key={js.id}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--trust-text)]"
                >
                  {js.skill.canonicalName}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-semibold text-white">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
          {job.description}
        </p>
      </section>

      <ApplyAssistPanel
        jobId={job.id}
        userEmail={userEmail}
        initialAssist={applyAssist}
      />

      {job.applicationUrl ? (
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-8 inline-flex"
        >
          View application link
        </a>
      ) : null}
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 uppercase tracking-[0.06em]">
      {children}
    </span>
  );
}
