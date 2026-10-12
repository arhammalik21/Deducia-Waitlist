import Link from "next/link";
import { IngestJobsButton } from "@/components/jobs/ingest-jobs-button";
import { RematchButton } from "@/components/matching/rematch-button";
import { formatMonthYear } from "@/lib/format";
import type { listOpportunities } from "@/modules/jobs/service";

type JobsData = Awaited<ReturnType<typeof listOpportunities>>;

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

export function JobsView({
  data,
  filters,
}: {
  data: JobsData;
  filters: {
    q?: string;
    workMode?: string;
    seniority?: string;
    employmentType?: string;
    sort?: "relevance" | "recent";
  };
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Opportunities
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
            Normalized job feed
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
            Normalized feed with deterministic JobMatch scores ({data.scorerVersion})
            {data.targetRoleTitle ? ` for ${data.targetRoleTitle}` : ""}.
            Dimensions: skills, experience, education, location, evidence.
            Top matches can be emailed to your account; open a job for Apply Assist.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RematchButton
            label={data.matchCount === 0 ? "Run match scoring" : "Re-score matches"}
          />
          <IngestJobsButton
            label={
              data.total === 0 ? "Load opportunity feed" : "Refresh seed feed"
            }
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Active jobs" value={data.total} />
        <Stat label="Fresh" value={data.freshCount} />
        <Stat label="Your skills" value={data.userSkillCount} />
        <Stat label="Showing" value={data.jobs.length} />
      </div>

      <form className="panel mt-8 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-[#d6d4d5]">Search</span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Title, company, location"
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#d6d4d5]">Work mode</span>
          <select
            name="workMode"
            defaultValue={filters.workMode ?? ""}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
            <option value="FLEXIBLE">Flexible</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#d6d4d5]">Seniority</span>
          <select
            name="seniority"
            defaultValue={filters.seniority ?? ""}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#d6d4d5]">Type</span>
          <select
            name="employmentType"
            defaultValue={filters.employmentType ?? ""}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="PART_TIME">Part-time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#d6d4d5]">Sort</span>
          <select
            name="sort"
            defaultValue={filters.sort ?? "relevance"}
            className="input-field"
          >
            <option value="relevance">Best match</option>
            <option value="recent">Most recent</option>
          </select>
        </label>
        <div className="flex items-end sm:col-span-3 lg:col-span-6">
          <button type="submit" className="btn-ghost">
            Apply filters
          </button>
        </div>
      </form>

      {data.jobs.length === 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">No jobs yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Load the seed opportunity feed, or run{" "}
            <code className="text-white">npm run jobs:ingest</code>.
          </p>
          <div className="mt-4">
            <IngestJobsButton />
          </div>
        </section>
      ) : (
        <ul className="mt-8 space-y-4">
          {data.jobs.map((job) => {
            const required = job.jobSkills.filter(
              (s) => s.importance === "REQUIRED",
            );
            const preferred = job.jobSkills.filter(
              (s) => s.importance === "PREFERRED",
            );
            return (
              <li key={job.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/app/jobs/${job.id}`}
                      className="text-lg font-semibold text-white hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                      {job.match
                        ? `${Math.round(job.match.overallScore * 100)}% match`
                        : `${job.relevance.score}% fit`}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 text-xs text-[var(--trust-text)]">
                      {job.workMode ? (
                        <Pill>{job.workMode.toLowerCase()}</Pill>
                      ) : null}
                      {job.seniority ? (
                        <Pill>{job.seniority.toLowerCase()}</Pill>
                      ) : null}
                      {job.freshness !== "FRESH" ? (
                        <Pill>{job.freshness.toLowerCase()}</Pill>
                      ) : null}
                    </div>
                  </div>
                </div>

                {job.match?.explanation ? (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--trust-text)]">
                    {job.match.explanation}
                  </p>
                ) : job.relevance.reasons.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--trust-text)]">
                    {job.relevance.reasons.join(" · ")}
                  </p>
                ) : null}

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {required.slice(0, 6).map((js) => (
                    <span
                      key={js.id}
                      className="rounded-full border border-[#7dd3a0]/35 bg-[#7dd3a0]/10 px-2.5 py-0.5 text-xs text-[#b8f0cc]"
                    >
                      {js.skill.canonicalName}
                    </span>
                  ))}
                  {preferred.slice(0, 3).map((js) => (
                    <span
                      key={js.id}
                      className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--trust-text)]"
                    >
                      {js.skill.canonicalName}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                  <span>
                    {formatSalary(
                      job.salaryMin,
                      job.salaryMax,
                      job.salaryCurrency,
                    ) || "Salary not listed"}
                    {job.relevance.totalRequired > 0
                      ? ` · ${job.relevance.matchedRequired}/${job.relevance.totalRequired} required skills`
                      : null}
                  </span>
                  <span>
                    {job.postedAt
                      ? `Posted ${formatMonthYear(job.postedAt)}`
                      : `Source: ${job.source}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 capitalize">
      {children}
    </span>
  );
}
