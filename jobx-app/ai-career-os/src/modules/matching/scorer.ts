import type { ExperienceLevel, WorkPreference } from "@prisma/client";
import {
  MATCH_SCORER_VERSION,
  MATCH_WEIGHTS_V1,
  type MatchScoreResult,
} from "@/modules/matching/types";

const LEVEL_RANK: Record<ExperienceLevel, number> = {
  INTERN: 0,
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
  EXECUTIVE: 5,
};

export type ScorerJobSkill = {
  skillId: string;
  name: string;
  importance: "REQUIRED" | "PREFERRED";
};

export type ScorerUserSkill = {
  skillId: string;
  name: string;
  /** True when at least one evidence row links to this skill. */
  hasEvidence: boolean;
};

export type ScorerInput = {
  job: {
    id: string;
    title: string;
    location: string | null;
    workMode: WorkPreference | null;
    seniority: ExperienceLevel | null;
    educationRequirements: string | null;
    experienceRequirements: string | null;
  };
  jobSkills: ScorerJobSkill[];
  user: {
    geography: string | null;
    workPreference: WorkPreference | null;
    experienceLevel: ExperienceLevel | null;
    educationCount: number;
    experienceCount: number;
    targetRoleTitle: string | null;
  };
  userSkills: ScorerUserSkill[];
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function scoreSkills(input: ScorerInput) {
  const owned = new Map(
    input.userSkills.map((s) => [s.skillId, s] as const),
  );
  const required = input.jobSkills.filter((s) => s.importance === "REQUIRED");
  const preferred = input.jobSkills.filter((s) => s.importance === "PREFERRED");

  const matchedRequired = required.filter((s) => owned.has(s.skillId));
  const matchedPreferred = preferred.filter((s) => owned.has(s.skillId));
  const missingRequired = required.filter((s) => !owned.has(s.skillId));

  const requiredRatio =
    required.length > 0 ? matchedRequired.length / required.length : null;
  const preferredRatio =
    preferred.length > 0 ? matchedPreferred.length / preferred.length : 0;

  let skills: number;
  if (requiredRatio == null) {
    skills =
      preferred.length > 0
        ? 0.45 + preferredRatio * 0.4
        : input.userSkills.length > 0
          ? 0.4
          : 0.15;
  } else {
    skills = requiredRatio * 0.85 + preferredRatio * 0.15;
  }

  return {
    score: clamp01(skills),
    matchedRequired: matchedRequired.map((s) => s.name),
    missingRequired: missingRequired.map((s) => ({
      skillId: s.skillId,
      name: s.name,
    })),
    matchedPreferred: matchedPreferred.map((s) => s.name),
    requiredCount: required.length,
    preferredCount: preferred.length,
  };
}

function scoreExperience(input: ScorerInput) {
  const userLevel = input.user.experienceLevel;
  const jobLevel = input.job.seniority;

  if (!userLevel || !jobLevel) {
    const hasExp = input.user.experienceCount > 0;
    return {
      score: hasExp ? 0.55 : 0.35,
      detail: hasExp
        ? "Experience present but seniority not fully specified"
        : "Limited experience signal",
    };
  }

  const diff = LEVEL_RANK[jobLevel] - LEVEL_RANK[userLevel];
  // User at or above job level scores high; below loses points by distance
  let score: number;
  if (diff <= 0) score = 1 - Math.min(Math.abs(diff), 2) * 0.08;
  else score = 1 - Math.min(diff, 3) * 0.28;

  return {
    score: clamp01(score),
    detail: `User ${userLevel} vs job ${jobLevel}`,
  };
}

function scoreEducation(input: ScorerInput) {
  const req = input.job.educationRequirements?.trim();
  if (!req) {
    return {
      score: input.user.educationCount > 0 ? 0.75 : 0.65,
      detail: "No explicit education requirement",
    };
  }
  if (input.user.educationCount > 0) {
    return {
      score: 0.85,
      detail: "Education on file against stated requirements",
    };
  }
  return {
    score: 0.3,
    detail: "Role lists education requirements; none on profile",
  };
}

function scoreLocation(input: ScorerInput) {
  const work = input.user.workPreference;
  const mode = input.job.workMode;
  let modeScore = 0.55;

  if (mode === "REMOTE") {
    if (!work || work === "REMOTE" || work === "FLEXIBLE") modeScore = 1;
    else if (work === "HYBRID") modeScore = 0.75;
    else modeScore = 0.45;
  } else if (mode && work) {
    if (work === "FLEXIBLE" || work === mode) modeScore = 1;
    else if (work === "HYBRID" || mode === "HYBRID") modeScore = 0.7;
    else modeScore = 0.35;
  } else if (mode) {
    modeScore = 0.65;
  }

  let geoScore = 0.6;
  const geo = input.user.geography?.trim().toLowerCase();
  const loc = input.job.location?.trim().toLowerCase();
  if (geo && loc) {
    const city = geo.split(",")[0]?.trim() ?? geo;
    if (loc.includes(city) || geo.includes(loc.split(",")[0] ?? "")) {
      geoScore = 1;
    } else if (/\bremote\b/.test(loc)) {
      geoScore = 0.85;
    } else {
      geoScore = 0.4;
    }
  } else if (loc && /\bremote\b/.test(loc)) {
    geoScore = 0.85;
  }

  return {
    score: clamp01(modeScore * 0.7 + geoScore * 0.3),
    detail: `Work mode ${mode ?? "n/a"} · geo ${input.user.geography ?? "n/a"}`,
  };
}

function scoreEvidence(input: ScorerInput) {
  const owned = new Map(input.userSkills.map((s) => [s.skillId, s] as const));
  const required = input.jobSkills.filter((s) => s.importance === "REQUIRED");
  const focus = required.length > 0 ? required : input.jobSkills;

  if (focus.length === 0) {
    const evidenced = input.userSkills.filter((s) => s.hasEvidence).length;
    return {
      score: input.userSkills.length
        ? clamp01(0.35 + (evidenced / input.userSkills.length) * 0.4)
        : 0.2,
      evidencedSkills: [] as string[],
      weakSkills: [] as string[],
    };
  }

  let points = 0;
  const evidencedSkills: string[] = [];
  const weakSkills: string[] = [];

  for (const js of focus) {
    const us = owned.get(js.skillId);
    if (!us) continue;
    if (us.hasEvidence) {
      points += 1;
      evidencedSkills.push(us.name);
    } else {
      points += 0.35;
      weakSkills.push(us.name);
    }
  }

  return {
    score: clamp01(points / focus.length),
    evidencedSkills,
    weakSkills,
  };
}

export function scoreJobMatch(input: ScorerInput): MatchScoreResult {
  const skills = scoreSkills(input);
  const experience = scoreExperience(input);
  const education = scoreEducation(input);
  const location = scoreLocation(input);
  const evidence = scoreEvidence(input);

  const dimensions = {
    skills: round4(skills.score),
    experience: round4(experience.score),
    education: round4(education.score),
    location: round4(location.score),
    evidence: round4(evidence.score),
  };

  const overall = round4(
    dimensions.skills * MATCH_WEIGHTS_V1.skills +
      dimensions.experience * MATCH_WEIGHTS_V1.experience +
      dimensions.education * MATCH_WEIGHTS_V1.education +
      dimensions.location * MATCH_WEIGHTS_V1.location +
      dimensions.evidence * MATCH_WEIGHTS_V1.evidence,
  );

  const titleHint =
    input.user.targetRoleTitle &&
    input.job.title
      .toLowerCase()
      .includes(input.user.targetRoleTitle.toLowerCase().split(" ")[0] ?? "")
      ? `Aligned with target role “${input.user.targetRoleTitle}”. `
      : "";

  const explanation = [
    titleHint.trim(),
    `Skills ${(dimensions.skills * 100).toFixed(0)}% (${skills.matchedRequired.length}/${skills.requiredCount || "—"} required).`,
    `Experience ${(dimensions.experience * 100).toFixed(0)}% — ${experience.detail}.`,
    `Evidence ${(dimensions.evidence * 100).toFixed(0)}%${
      evidence.weakSkills.length
        ? ` (claimed without proof: ${evidence.weakSkills.slice(0, 4).join(", ")})`
        : ""
    }.`,
    `Location ${(dimensions.location * 100).toFixed(0)}%; education ${(dimensions.education * 100).toFixed(0)}%.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    scorerVersion: MATCH_SCORER_VERSION,
    overall,
    dimensions,
    explanation,
    breakdown: {
      weights: MATCH_WEIGHTS_V1,
      skills,
      experience,
      education,
      location,
      evidence,
      jobId: input.job.id,
    },
  };
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
