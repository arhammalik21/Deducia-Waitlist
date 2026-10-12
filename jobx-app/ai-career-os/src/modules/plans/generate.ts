import type { GapPriority, GapType } from "@prisma/client";

export const PLAN_GENERATOR_VERSION = "rules-v1" as const;

export type GapInput = {
  id: string;
  gapType: GapType;
  title: string;
  description: string;
  whyItMatters: string;
  suggestedAction: string | null;
  priority: GapPriority;
  relatedJobCount: number;
  skillId: string | null;
  skillName: string | null;
};

export type PlanItemDraft = {
  skillId: string | null;
  priority: number;
  title: string;
  reason: string;
  expectedImpact: string;
  estimatedEffort: string;
  relatedJobCount: number;
};

function priorityWeight(p: GapPriority): number {
  if (p === "HIGH") return 300;
  if (p === "MEDIUM") return 150;
  return 50;
}

function typeWeight(t: GapType): number {
  if (t === "SKILL") return 30;
  if (t === "EVIDENCE") return 20;
  return 10;
}

function estimateEffort(gap: GapInput): string {
  if (gap.gapType === "EVIDENCE") {
    return gap.relatedJobCount >= 3 ? "2–4 days" : "1–2 days";
  }
  if (gap.gapType === "POSITIONING") {
    return "2–6 hours";
  }
  // SKILL
  if (gap.priority === "HIGH" || gap.relatedJobCount >= 4) return "1–2 weeks";
  if (gap.priority === "MEDIUM" || gap.relatedJobCount >= 2) return "3–5 days";
  return "1–2 days";
}

function itemTitle(gap: GapInput): string {
  if (gap.suggestedAction) {
    // Keep action-oriented but short
    const action = gap.suggestedAction.trim();
    if (action.length <= 90) return action;
  }
  if (gap.gapType === "SKILL" && gap.skillName) {
    return `Ship a proof project that demonstrates ${gap.skillName}`;
  }
  if (gap.gapType === "EVIDENCE" && gap.skillName) {
    return `Document evidence for ${gap.skillName} on your Career Graph`;
  }
  return gap.title;
}

function expectedImpact(gap: GapInput, targetRole: string | null): string {
  const role = targetRole ? ` toward ${targetRole}` : "";
  if (gap.relatedJobCount > 0) {
    return `Improves fit on ~${gap.relatedJobCount} scored opportunit${
      gap.relatedJobCount === 1 ? "y" : "ies"
    }${role}.`;
  }
  return `Strengthens your positioning${role}.`;
}

/**
 * Deterministic plan builder — no LLM numeric ranking.
 * Orders by gap severity × opportunity count, then type.
 */
export function buildPlanItems(
  gaps: GapInput[],
  targetRole: string | null,
): PlanItemDraft[] {
  const ranked = [...gaps].sort((a, b) => {
    const scoreA =
      priorityWeight(a.priority) +
      typeWeight(a.gapType) +
      a.relatedJobCount * 12;
    const scoreB =
      priorityWeight(b.priority) +
      typeWeight(b.gapType) +
      b.relatedJobCount * 12;
    return scoreB - scoreA;
  });

  return ranked.slice(0, 12).map((gap, index) => ({
    skillId: gap.skillId,
    priority: index + 1,
    title: itemTitle(gap),
    reason: `${gap.description} ${gap.whyItMatters}`.trim(),
    expectedImpact: expectedImpact(gap, targetRole),
    estimatedEffort: estimateEffort(gap),
    relatedJobCount: gap.relatedJobCount,
  }));
}

export function buildPlanSummary(
  targetRole: string | null,
  itemCount: number,
  highGapCount: number,
): string {
  const role = targetRole ? ` for ${targetRole}` : "";
  if (itemCount === 0) {
    return `No open gaps to convert into actions${role}. Re-run matching after updating your Career Graph, or keep applying to high-match roles.`;
  }
  return `Prioritized ${itemCount} action${itemCount === 1 ? "" : "s"}${role} from your latest gap diagnosis${
    highGapCount > 0 ? ` (${highGapCount} high-priority)` : ""
  }. Complete items in order — each one is ranked by opportunity impact and effort.`;
}
