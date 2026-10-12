import Link from "next/link";
import { formatRange } from "@/lib/format";
import { RebuildGraphButton } from "@/components/career/rebuild-graph-button";
import type { getCareerProfile } from "@/modules/career-graph/service";

type ProfileData = Awaited<ReturnType<typeof getCareerProfile>>;

export function ProfileView({ data }: { data: ProfileData }) {
  const empty =
    data.counts.experiences === 0 &&
    data.counts.skills === 0 &&
    data.counts.education === 0 &&
    data.counts.projects === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Career Profile
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
            {data.profile?.fullName || "Your profile"}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
            {data.profile?.headline ||
              data.primaryRole?.title ||
              "Structured education, experience, projects, skills, and evidence from your resume."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--trust-text)]">
            {data.profile?.geography ? (
              <span>{data.profile.geography}</span>
            ) : null}
            {data.profile?.experienceLevel ? (
              <span>· {data.profile.experienceLevel.toLowerCase()}</span>
            ) : null}
            {data.primaryRole ? (
              <span>· Aiming for {data.primaryRole.title}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/app/graph" className="btn-primary">
            Open Career Graph
          </Link>
          {data.latestResume ? <RebuildGraphButton /> : null}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[
          ["Skills", data.counts.skills],
          ["Experience", data.counts.experiences],
          ["Projects", data.counts.projects],
          ["Evidence", data.counts.evidence],
        ].map(([label, value]) => (
          <div key={label as string} className="panel px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {empty ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">No graph data yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {data.latestResume
              ? `We have ${data.latestResume.fileName} on file. Rebuild the Career Graph to extract experience, skills, and evidence.`
              : "Upload a resume in onboarding so we can populate your Career Profile."}
          </p>
          <div className="mt-4">
            {data.latestResume ? (
              <RebuildGraphButton label="Build Career Graph from resume" />
            ) : (
              <Link href="/onboarding" className="btn-primary">
                Upload resume
              </Link>
            )}
          </div>
        </section>
      ) : null}

      {!empty && data.userSkills.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.userSkills.map((us) => (
              <span
                key={us.id}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[#e8e8e8]"
                title={us.provenance}
              >
                {us.skill.canonicalName}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {!empty && data.experiences.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Experience</h2>
          <ul className="mt-4 space-y-5">
            {data.experiences.map((exp) => (
              <li
                key={exp.id}
                className="border-t border-[var(--border)] pt-5 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-white">
                    {exp.title}{" "}
                    <span className="text-[var(--muted)]">· {exp.company}</span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatRange(exp.startDate, exp.endDate, exp.isCurrent) ||
                      (exp.isCurrent ? "Present" : null)}
                  </p>
                </div>
                {exp.location ? (
                  <p className="mt-1 text-xs text-[var(--trust-text)]">
                    {exp.location}
                  </p>
                ) : null}
                {exp.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {exp.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!empty && data.education.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Education</h2>
          <ul className="mt-4 space-y-4">
            {data.education.map((edu) => (
              <li key={edu.id}>
                <p className="font-medium text-white">{edu.institution}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-[var(--trust-text)]">
                  {formatRange(edu.startDate, edu.endDate)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!empty && data.projects.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <ul className="mt-4 space-y-5">
            {data.projects.map((project) => (
              <li key={project.id}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="font-medium text-white">{project.name}</p>
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white underline-offset-2 hover:underline"
                    >
                      Link
                    </a>
                  ) : null}
                </div>
                {project.description ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {project.description}
                  </p>
                ) : null}
                {project.technologies.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--trust-text)]">
                    {project.technologies.join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!empty && data.evidence.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Evidence</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Proof points linked to skills — experiences, projects, and
            certifications.
          </p>
          <ul className="mt-4 space-y-3">
            {data.evidence.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-col gap-1 border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{ev.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                    {ev.type}
                  </p>
                  {ev.evidenceSkills.length > 0 ? (
                    <p className="mt-2 text-xs text-[var(--trust-text)]">
                      Supports:{" "}
                      {ev.evidenceSkills
                        .map((es) => es.skill.canonicalName)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                {ev.strength != null ? (
                  <span className="text-xs text-[var(--muted)]">
                    Strength {(ev.strength * 100).toFixed(0)}%
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!empty && data.certifications.length > 0 ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Certifications</h2>
          <ul className="mt-4 space-y-3">
            {data.certifications.map((cert) => (
              <li key={cert.id}>
                <p className="font-medium text-white">{cert.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {[cert.issuer, formatRange(cert.issueDate, null)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
