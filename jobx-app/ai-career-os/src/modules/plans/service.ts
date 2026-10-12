import { PlanItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import {
  PLAN_GENERATOR_VERSION,
  buildPlanItems,
  buildPlanSummary,
} from "@/modules/plans/generate";

export async function getActivePlan(userId: string) {
  return prisma.careerPlan.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: { skill: true },
        orderBy: { priority: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlanDashboard(userId: string) {
  const [plan, gapCount, matchCount, primaryRole] = await Promise.all([
    getActivePlan(userId),
    prisma.skillGap.count({ where: { userId, status: "OPEN" } }),
    prisma.jobMatch.count({ where: { userId } }),
    prisma.targetRole.findFirst({
      where: { userId, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const items = plan?.items ?? [];
  return {
    plan,
    gapCount,
    matchCount,
    targetRoleTitle: primaryRole?.title ?? null,
    counts: {
      total: items.length,
      pending: items.filter((i) => i.status === "PENDING").length,
      inProgress: items.filter((i) => i.status === "IN_PROGRESS").length,
      completed: items.filter((i) => i.status === "COMPLETED").length,
    },
  };
}

export async function generateActionPlan(userId: string): Promise<
  | { ok: true; planId: string; itemCount: number }
  | { ok: false; error: string }
> {
  const [gaps, primaryRole, matchCount] = await Promise.all([
    prisma.skillGap.findMany({
      where: { userId, status: "OPEN" },
      include: { skill: true },
      orderBy: [{ relatedJobCount: "desc" }],
    }),
    prisma.targetRole.findFirst({
      where: { userId, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.jobMatch.count({ where: { userId } }),
  ]);

  if (matchCount === 0) {
    return {
      ok: false,
      error:
        "No JobMatch scores yet. Open Opportunities or Skill Gaps to run matching first.",
    };
  }

  const drafts = buildPlanItems(
    gaps.map((g) => ({
      id: g.id,
      gapType: g.gapType,
      title: g.title,
      description: g.description,
      whyItMatters: g.whyItMatters,
      suggestedAction: g.suggestedAction,
      priority: g.priority,
      relatedJobCount: g.relatedJobCount,
      skillId: g.skillId,
      skillName: g.skill?.canonicalName ?? null,
    })),
    primaryRole?.title ?? null,
  );

  const highGapCount = gaps.filter((g) => g.priority === "HIGH").length;
  const title = primaryRole?.title
    ? `Action plan · ${primaryRole.title}`
    : "Your career action plan";
  const summary = buildPlanSummary(
    primaryRole?.title ?? null,
    drafts.length,
    highGapCount,
  );

  const plan = await prisma.$transaction(async (tx) => {
    await tx.careerPlan.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    return tx.careerPlan.create({
      data: {
        userId,
        title,
        summary,
        status: "ACTIVE",
        generatedBy: PLAN_GENERATOR_VERSION,
        items: {
          create: drafts.map((d) => ({
            skillId: d.skillId,
            priority: d.priority,
            title: d.title,
            reason: d.reason,
            expectedImpact: d.expectedImpact,
            estimatedEffort: d.estimatedEffort,
            relatedJobCount: d.relatedJobCount,
            status: PlanItemStatus.PENDING,
          })),
        },
      },
    });
  });

  return { ok: true, planId: plan.id, itemCount: drafts.length };
}

export async function updatePlanItemStatus(
  userId: string,
  itemId: string,
  status: PlanItemStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const item = await prisma.careerPlanItem.findFirst({
    where: {
      id: itemId,
      plan: { userId, status: "ACTIVE" },
    },
  });

  if (!item) {
    return { ok: false, error: "Plan item not found." };
  }

  await prisma.careerPlanItem.update({
    where: { id: itemId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  return { ok: true };
}

export async function requirePlanUser() {
  return ensureAppUser();
}
