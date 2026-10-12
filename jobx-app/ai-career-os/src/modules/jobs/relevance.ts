/**
 * Lightweight feed ranking for Milestone 4.
 * This is NOT the deterministic match scorer (Milestone 5) — no JobMatch rows,
 * no weighted dimension scores. Just skill / title / preference overlap for sorting.
 */

export type RelevanceInput = {
  jobTitle: string;
  jobSeniority: string | null;
  jobWorkMode: string | null;
  jobLocation: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  userSkills: string[];
  targetRoleTitle: string | null;
  targetSeniority: string | null;
  userWorkPreference: string | null;
  userGeography: string | null;
};

export type RelevanceResult = {
  /** 0–100 preview score for feed sorting only */
  score: number;
  matchedRequired: number;
  totalRequired: number;
  matchedPreferred: number;
  totalPreferred: number;
  titleBoost: boolean;
  reasons: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function titleTokens(title: string): string[] {
  return norm(title)
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2 && !["the", "and", "for", "with"].includes(t));
}

export function computeFeedRelevance(input: RelevanceInput): RelevanceResult {
  const owned = new Set(input.userSkills.map(norm).filter(Boolean));
  const required = input.requiredSkills.map(norm).filter(Boolean);
  const preferred = input.preferredSkills.map(norm).filter(Boolean);

  const matchedRequired = required.filter((s) => owned.has(s)).length;
  const matchedPreferred = preferred.filter((s) => owned.has(s)).length;
  const totalRequired = required.length;
  const totalPreferred = preferred.length;

  const requiredRatio =
    totalRequired > 0 ? matchedRequired / totalRequired : owned.size > 0 ? 0.35 : 0;
  const preferredRatio =
    totalPreferred > 0 ? matchedPreferred / totalPreferred : 0;

  let score = requiredRatio * 70 + preferredRatio * 15;
  const reasons: string[] = [];

  if (totalRequired > 0) {
    reasons.push(
      `${matchedRequired}/${totalRequired} required skills`,
    );
  }

  const target = input.targetRoleTitle?.trim();
  let titleBoost = false;
  if (target) {
    const jobTokens = new Set(titleTokens(input.jobTitle));
    const roleTokens = titleTokens(target);
    const overlap = roleTokens.filter((t) => jobTokens.has(t)).length;
    if (overlap > 0) {
      titleBoost = true;
      const boost = Math.min(12, overlap * 4);
      score += boost;
      reasons.push(`Title aligns with target role`);
    }
  }

  if (
    input.targetSeniority &&
    input.jobSeniority &&
    input.targetSeniority === input.jobSeniority
  ) {
    score += 5;
    reasons.push("Seniority matches");
  }

  if (
    input.userWorkPreference &&
    input.jobWorkMode &&
    (input.userWorkPreference === input.jobWorkMode ||
      input.userWorkPreference === "FLEXIBLE")
  ) {
    score += 4;
    reasons.push("Work mode fits");
  }

  if (
    input.userGeography &&
    input.jobLocation &&
    norm(input.jobLocation).includes(
      norm(input.userGeography).split(",")[0] ?? "",
    )
  ) {
    score += 3;
    reasons.push("Location hint");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    matchedRequired,
    totalRequired,
    matchedPreferred,
    totalPreferred,
    titleBoost,
    reasons,
  };
}
