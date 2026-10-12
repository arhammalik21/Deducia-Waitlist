import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import { gapPriorityRank, listGapsForUser } from "@/modules/gaps/diagnose";

export async function getGapsDashboard(userId: string) {
  const gaps = await listGapsForUser(userId);
  gaps.sort((a, b) => {
    const pr = gapPriorityRank(a.priority) - gapPriorityRank(b.priority);
    if (pr !== 0) return pr;
    return b.relatedJobCount - a.relatedJobCount;
  });

  const matchCount = await prisma.jobMatch.count({ where: { userId } });

  return {
    gaps,
    matchCount,
    counts: {
      skill: gaps.filter((g) => g.gapType === "SKILL").length,
      evidence: gaps.filter((g) => g.gapType === "EVIDENCE").length,
      positioning: gaps.filter((g) => g.gapType === "POSITIONING").length,
      high: gaps.filter((g) => g.priority === "HIGH").length,
    },
  };
}

export async function requireGapsUser() {
  return ensureAppUser();
}
