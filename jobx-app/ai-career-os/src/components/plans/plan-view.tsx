import Link from "next/link";
import { GeneratePlanButton } from "@/components/plans/generate-plan-button";
import { PlanItemActions } from "@/components/plans/plan-item-actions";
import type { getPlanDashboard } from "@/modules/plans/service";

type Data = Awaited<ReturnType<typeof getPlanDashboard>>;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-[var(--border)] text-[var(--trust-text)]",
  IN_PROGRESS: "border-[#8cb4ff]/40 bg-[#8cb4ff]/10 text-[#c5d9ff]",
  COMPLETED: "border-[#7dd3a0]/40 bg-[#7dd3a0]/10 text-[#b8f0cc]",
  DISMISSED: "border-[var(--border)] text-[var(--muted)] line-through",
};

export function PlanView({ data }: { data: Data }) {
  const plan = data.plan;
  const visibleItems =
    plan?.items.filter((i) => i.status !== "DISMISSED") ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Action Plan
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
            {plan?.title ?? "Your next moves"}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
            {plan?.summary ??
              "A prioritized plan from your gaps, ranked by opportunity impact and effort — the MVP close of Diagnose → Match → Gaps → Act."}
          </p>
        </div>
        <GeneratePlanButton
          label={plan ? "Regenerate plan" : "Generate action plan"}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Stat label="Actions" value={data.counts.total} />
        <Stat label="Pending" value={data.counts.pending} />
        <Stat label="In progress" value={data.counts.inProgress} />
        <Stat label="Done" value={data.counts.completed} />
      </div>

      {!plan ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">No plan yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {data.matchCount === 0
              ? "Score opportunities first, then diagnose gaps — the plan is built from those signals."
              : data.gapCount === 0
                ? "Matching is done and there are no open gaps. Generate a plan anyway to capture a summary, or keep applying to high-match roles."
                : `You have ${data.gapCount} open gap${data.gapCount === 1 ? "" : "s"}. Generate a prioritized plan to close them.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <GeneratePlanButton />
            <Link href="/app/gaps" className="btn-ghost">
              Review gaps
            </Link>
            <Link href="/app/jobs" className="btn-ghost">
              Opportunities
            </Link>
          </div>
        </section>
      ) : visibleItems.length === 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Plan is clear</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No pending actions. Regenerate after the next match run, or browse
            your best-matched opportunities.
          </p>
          <Link
            href="/app/jobs"
            className="mt-4 inline-block text-sm text-white hover:underline"
          >
            See opportunities →
          </Link>
        </section>
      ) : (
        <ol className="mt-8 space-y-4">
          {visibleItems.map((item) => (
            <li key={item.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 text-sm font-semibold text-white">
                    {item.priority}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${STATUS_STYLE[item.status] ?? STATUS_STYLE.PENDING}`}
                      >
                        {item.status.replace("_", " ").toLowerCase()}
                      </span>
                      {item.estimatedEffort ? (
                        <span className="text-xs text-[var(--muted)]">
                          ~{item.estimatedEffort}
                        </span>
                      ) : null}
                      {item.relatedJobCount ? (
                        <span className="text-xs text-[var(--muted)]">
                          · {item.relatedJobCount} jobs
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-white">
                      {item.title}
                    </h2>
                  </div>
                </div>
                {item.skill ? (
                  <span className="rounded-full border border-[#7dd3a0]/35 bg-[#7dd3a0]/10 px-3 py-1 text-xs text-[#b8f0cc]">
                    {item.skill.canonicalName}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {item.reason}
              </p>
              <p className="mt-2 text-sm text-[var(--trust-text)]">
                Impact: {item.expectedImpact}
              </p>

              <div className="mt-4">
                <PlanItemActions itemId={item.id} status={item.status} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {plan ? (
        <p className="mt-8 text-xs text-[var(--muted)]">
          Generated by {plan.generatedBy ?? "rules"} ·{" "}
          <Link href="/app/gaps" className="text-white hover:underline">
            Gaps
          </Link>{" "}
          ·{" "}
          <Link href="/app/jobs" className="text-white hover:underline">
            Matches
          </Link>
        </p>
      ) : null}
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
