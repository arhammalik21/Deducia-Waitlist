import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await ensureAppUser();
  if (!user) {
    redirect("/login?next=/app");
  }

  if (user.profile?.onboardingStatus !== "COMPLETED") {
    redirect("/onboarding");
  }

  const [
    primaryRole,
    resumeCount,
    skillCount,
    jobCount,
    gapCount,
    matchCount,
    planItemPending,
  ] = await Promise.all([
    prisma.targetRole.findFirst({
      where: { userId: user.id, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resumeDocument.count({ where: { userId: user.id } }),
    prisma.userSkill.count({ where: { userId: user.id } }),
    prisma.job.count({ where: { status: "ACTIVE" } }),
    prisma.skillGap.count({ where: { userId: user.id, status: "OPEN" } }),
    prisma.jobMatch.count({ where: { userId: user.id } }),
    prisma.careerPlanItem.count({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        plan: { userId: user.id, status: "ACTIVE" },
      },
    }),
  ]);

  const nextSteps = [
    !resumeCount
      ? {
          title: "Upload your resume",
          body: "Add a resume so we can extract skills and evidence into your Career Graph.",
          href: "/onboarding",
          cta: "Add resume",
        }
      : null,
    resumeCount && !skillCount
      ? {
          title: "Build your Career Graph",
          body: "Your resume is on file — extract experience, skills, and evidence into the graph.",
          href: "/app/profile",
          cta: "Open profile",
        }
      : null,
    {
      title: "Review your target role",
      body: primaryRole
        ? `You're aiming for ${primaryRole.title}. Compare your graph skills against the role.`
        : "Confirm the role you're targeting so matching stays focused.",
      href: "/app/target-role",
      cta: "View target role",
    },
    {
      title: "Explore opportunities",
      body:
        matchCount > 0
          ? `${matchCount} jobs scored with explainable JobMatch dimensions.`
          : jobCount > 0
            ? `${jobCount} normalized jobs ready — run matching to score them.`
            : "Load the opportunity feed to browse normalized roles and required skills.",
      href: "/app/jobs",
      cta: "See opportunities",
    },
    {
      title: "Close your gaps",
      body:
        gapCount > 0
          ? `${gapCount} open gaps are prioritized by opportunity impact.`
          : matchCount > 0
            ? "Matching is done — diagnose skill, evidence, and positioning gaps."
            : "Skill, evidence, and positioning gaps appear after matching.",
      href: "/app/gaps",
      cta: "Review gaps",
    },
    {
      title: "Follow your action plan",
      body:
        planItemPending > 0
          ? `${planItemPending} prioritized action${planItemPending === 1 ? "" : "s"} ready to work.`
          : gapCount > 0
            ? "Turn open gaps into a sequenced plan with effort and impact."
            : "Generate a plan after matching to close the Diagnose → Act loop.",
      href: "/app/plan",
      cta: "Open plan",
    },
  ].filter(Boolean) as {
    title: string;
    body: string;
    href: string;
    cta: string;
  }[];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Dashboard
      </p>
      <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
        Welcome{user.profile?.fullName ? `, ${user.profile.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        {primaryRole
          ? `Your baseline is set for ${primaryRole.title}. Keep building evidence and closing gaps.`
          : "Your career command center — diagnose, match, close gaps, and act."}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          {
            q: "Where am I now?",
            a: "Your Career Profile and Graph summarize skills, experience, and evidence.",
            href: "/app/profile",
            cta: "View profile",
          },
          {
            q: "What jobs am I close to?",
            a: "Matched opportunities with explainable dimension scores appear here.",
            href: "/app/jobs",
            cta: "See opportunities",
          },
          {
            q: "What am I missing?",
            a: "Skill, evidence, and positioning gaps — prioritized by opportunity impact.",
            href: "/app/gaps",
            cta: "Review gaps",
          },
          {
            q: "What should I do next?",
            a: "A personalized Action Plan closes the loop with concrete next steps.",
            href: "/app/plan",
            cta: "Open plan",
          },
        ].map((item) => (
          <div key={item.q} className="panel p-5">
            <h2 className="text-xl font-semibold tracking-tight text-white">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {item.a}
            </p>
            <Link
              href={item.href}
              className="mt-4 inline-block text-sm font-semibold text-white hover:underline"
            >
              {item.cta} →
            </Link>
          </div>
        ))}
      </div>

      <section className="panel mt-8 p-6">
        <h3 className="font-medium text-white">Recommended next steps</h3>
        <ul className="mt-4 space-y-4">
          {nextSteps.map((step) => (
            <li
              key={step.title}
              className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
              </div>
              <Link href={step.href} className="btn-ghost shrink-0 self-start">
                {step.cta}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
