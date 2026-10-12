import Link from "next/link";
import type { getTargetRoleAnalysis } from "@/modules/career-graph/service";

type Data = Awaited<ReturnType<typeof getTargetRoleAnalysis>>;

export function TargetRoleView({ data }: { data: Data }) {
  if (!data.role) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Target Role
        </p>
        <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
          No target role yet
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Set a target role during onboarding so we can compare your skills
          against the role.
        </p>
        <Link href="/onboarding" className="btn-primary mt-6 inline-flex">
          Update onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Target Role
      </p>
      <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
        {data.role.title}
      </h1>
      <p className="mt-3 text-[15px] text-[var(--muted)]">
        {[data.role.seniority, data.role.industry].filter(Boolean).join(" · ") ||
          "Baseline role analysis from your Career Graph skills. Deeper opportunity matching lands in Milestone 5."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Your skills" value={data.userSkills.length} />
        <Stat label="Overlap" value={data.have.length} />
        <Stat label="Likely gaps" value={data.missing.length} />
      </div>

      <section className="panel mt-8 p-6">
        <h2 className="text-lg font-semibold text-white">Skills you already have</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.have.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No overlap yet with suggested role skills.
            </p>
          ) : (
            data.have.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[#7dd3a0]/40 bg-[#7dd3a0]/10 px-3 py-1 text-sm text-[#b8f0cc]"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">Suggested gaps to close</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Heuristic suggestions from your target title. Full gap diagnosis comes
          after job matching.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.missing.map((s) => (
            <span
              key={s}
              className="rounded-full border border-[#f0c674]/40 bg-[#f0c674]/10 px-3 py-1 text-sm text-[#f5dba0]"
            >
              {s}
            </span>
          ))}
        </div>
        <Link href="/app/gaps" className="mt-5 inline-block text-sm text-white hover:underline">
          Open skill gaps →
        </Link>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">Your Career Graph skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.userSkills.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No skills extracted yet.{" "}
              <Link href="/app/profile" className="text-white underline">
                Build your profile
              </Link>
              .
            </p>
          ) : (
            data.userSkills.map((us) => (
              <span
                key={us.id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[#e8e8e8]"
              >
                {us.skill.canonicalName}
              </span>
            ))
          )}
        </div>
      </section>
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
