import Link from "next/link";
import { RematchButton } from "@/components/matching/rematch-button";
import type { getGapsDashboard } from "@/modules/gaps/service";

type Data = Awaited<ReturnType<typeof getGapsDashboard>>;

const TYPE_STYLE: Record<string, string> = {
  SKILL: "border-[#f0c674]/40 bg-[#f0c674]/10 text-[#f5dba0]",
  EVIDENCE: "border-[#d4a5ff]/40 bg-[#d4a5ff]/10 text-[#e6ccff]",
  POSITIONING: "border-[#8cb4ff]/40 bg-[#8cb4ff]/10 text-[#c5d9ff]",
};

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "text-[#ff8e8e]",
  MEDIUM: "text-[#f0c674]",
  LOW: "text-[var(--muted)]",
};

export function GapsView({ data }: { data: Data }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Skill Gaps
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
            What to close next
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
            Diagnosed from deterministic JobMatch scores — skill, evidence, and
            positioning gaps prioritized by opportunity impact.
          </p>
        </div>
        <RematchButton
          label={data.matchCount === 0 ? "Score opportunities" : "Re-run matching"}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Stat label="Open gaps" value={data.gaps.length} />
        <Stat label="Skill" value={data.counts.skill} />
        <Stat label="Evidence" value={data.counts.evidence} />
        <Stat label="High priority" value={data.counts.high} />
      </div>

      {data.matchCount === 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">No matches yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Run match scoring against the opportunity feed to diagnose gaps.
            Make sure jobs are ingested and your Career Graph has skills.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <RematchButton />
            <Link href="/app/jobs" className="btn-ghost">
              View opportunities
            </Link>
          </div>
        </section>
      ) : data.gaps.length === 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">No open gaps</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your profile covers required skills on the scored opportunities, or
            the feed needs a refresh. Re-run matching after updating your graph.
          </p>
          <Link
            href="/app/plan"
            className="mt-4 inline-block text-sm text-white hover:underline"
          >
            Continue to Action Plan →
          </Link>
        </section>
      ) : (
        <>
          <div className="mt-6">
            <Link href="/app/plan" className="btn-ghost inline-flex">
              Build action plan from these gaps →
            </Link>
          </div>

          <ul className="mt-8 space-y-4">
            {data.gaps.map((gap) => (
              <li key={gap.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${TYPE_STYLE[gap.gapType] ?? TYPE_STYLE.SKILL}`}
                      >
                        {gap.gapType.toLowerCase()}
                      </span>
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.08em] ${PRIORITY_STYLE[gap.priority]}`}
                      >
                        {gap.priority.toLowerCase()}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      {gap.title}
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {gap.relatedJobCount} related job
                    {gap.relatedJobCount === 1 ? "" : "s"}
                  </p>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {gap.description}
                </p>
                <p className="mt-2 text-sm text-[var(--trust-text)]">
                  Why it matters: {gap.whyItMatters}
                </p>
                {gap.suggestedAction ? (
                  <p className="mt-3 text-sm text-white">
                    Next: {gap.suggestedAction}
                  </p>
                ) : null}
                {gap.job ? (
                  <Link
                    href={`/app/jobs/${gap.job.id}`}
                    className="mt-4 inline-block text-sm text-white hover:underline"
                  >
                    Example role: {gap.job.title} at {gap.job.company} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </>
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
