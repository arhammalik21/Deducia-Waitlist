import { z } from "zod";
import { getAiProvider, isAiConfigured } from "@/lib/ai";
import type {
  ExperienceLevelValue,
  FieldKey,
  OnboardingDraft,
} from "@/modules/resume/types";

export type { FieldKey, OnboardingDraft } from "@/modules/resume/types";

export const extractedProfileSchema = z.object({
  fullName: z.string().nullable().optional(),
  targetRole: z.string().nullable().optional(),
  geography: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  experienceLevel: z
    .enum(["INTERN", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .nullable()
    .optional(),
  skills: z.array(z.string()).nullish().default([]),
  summary: z.string().nullable().optional(),
});

export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;

/** Fields that resumes rarely contain — always treat as user-provided unless filled. */
const ALWAYS_ASK: FieldKey[] = [
  "workPreference",
  "salaryMin",
  "salaryMax",
  "timeHorizon",
];

const REQUIRED_FIELDS: FieldKey[] = [
  "fullName",
  "targetRole",
  "geography",
  "experienceLevel",
  "workPreference",
];

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function heuristicParse(text: string): ExtractedProfile {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  const firstLine = lines[0] ?? "";
  const looksLikeName =
    firstLine.length > 2 &&
    firstLine.length < 60 &&
    !/@/.test(firstLine) &&
    !/resume|curriculum|cv|linkedin/i.test(firstLine);

  const locationMatch =
    text.match(
      /(?:location|based in|lives? in)[:\s]+([A-Za-z .,\-]{3,60})/i,
    ) ||
    text.match(
      /\b([A-Z][a-zA-Z]+(?:[\s,]+\s*[A-Z][a-zA-Z]+){1,3})\b(?=\s*(?:\||•|,?\s*(?:USA|UK|India|Canada|Remote)))/,
    );

  const titleHints = [
    /(?:title|role|position)[:\s]+([^\n|]{3,80})/i,
    /\b((?:Senior|Junior|Lead|Staff|Principal)?\s*(?:Software|Backend|Frontend|Full[\s-]?Stack|Data|Product|DevOps|ML|AI)\s+(?:Engineer|Developer|Scientist|Manager|Designer|Analyst))\b/i,
  ];
  let targetRole: string | null = null;
  for (const re of titleHints) {
    const m = text.match(re);
    if (m?.[1]) {
      targetRole = m[1].trim();
      break;
    }
  }

  let experienceLevel: ExtractedProfile["experienceLevel"] = null;
  if (/intern/i.test(text)) experienceLevel = "INTERN";
  else if (/\b(10\+|15\+|20\+|principal|staff|lead)\b/i.test(text))
    experienceLevel = "LEAD";
  else if (/\b(senior|8\+|7\+)\b/i.test(text)) experienceLevel = "SENIOR";
  else if (/\b(junior|entry[\s-]?level|1[-–]2)\b/i.test(text))
    experienceLevel = "JUNIOR";
  else if (/\b(mid[\s-]?level|3[-–]5|4[-–]6)\b/i.test(text))
    experienceLevel = "MID";

  const skillSection = text.match(
    /(?:skills|technologies|tech stack)[:\s]*([\s\S]{20,800}?)(?:\n\s*\n|experience|education|projects|$)/i,
  );
  const skills = skillSection
    ? skillSection[1]
        .split(/[,|•\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 40)
        .slice(0, 30)
    : [];

  void emailMatch;

  return {
    fullName: looksLikeName ? firstLine : null,
    targetRole,
    geography: locationMatch?.[1]?.trim() ?? null,
    industry: null,
    experienceLevel,
    skills,
    summary: lines.slice(0, 4).join(" ").slice(0, 400) || null,
  };
}

async function aiParse(text: string): Promise<ExtractedProfile> {
  const provider = getAiProvider();
  const result = await provider.complete({
    purpose: "resume_onboarding_extract",
    promptVersion: "v1",
    json: true,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Extract onboarding fields from a resume. Return JSON only with keys:
fullName, targetRole (best current or most recent job title), geography (city/region/country if present),
industry, experienceLevel (one of INTERN|JUNIOR|MID|SENIOR|LEAD|EXECUTIVE or null),
skills (string array), summary (1-2 sentences).
Use null for unknown fields. Do not invent employers or titles not supported by the text.`,
      },
      {
        role: "user",
        content: `Resume text:\n\n${text.slice(0, 24_000)}`,
      },
    ],
  });

  const raw = JSON.parse(result.content) as unknown;
  return extractedProfileSchema.parse(raw);
}

export async function parseResumeProfile(text: string): Promise<{
  profile: ExtractedProfile;
  source: "ai" | "heuristic";
  warning?: string;
}> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      profile: extractedProfileSchema.parse({ skills: [] }),
      source: "heuristic",
      warning:
        "We couldn't read text from this file (it may be a scanned PDF). Fill in the details below.",
    };
  }

  if (isAiConfigured()) {
    try {
      const profile = await aiParse(trimmed);
      return { profile, source: "ai" };
    } catch (error) {
      const heuristic = heuristicParse(trimmed);
      return {
        profile: heuristic,
        source: "heuristic",
        warning:
          error instanceof Error
            ? `AI extraction failed (${error.message}). We prefilled what we could — please review.`
            : "AI extraction failed. We prefilled what we could — please review.",
      };
    }
  }

  return {
    profile: heuristicParse(trimmed),
    source: "heuristic",
    warning:
      "AI is not configured (set AI_API_KEY). We extracted what we could from the text — please review and complete missing fields.",
  };
}

export function toOnboardingDraft(
  profile: ExtractedProfile,
  fallbacks?: Partial<OnboardingDraft>,
): OnboardingDraft {
  return {
    fullName: clean(profile.fullName) || fallbacks?.fullName || "",
    targetRole: clean(profile.targetRole) || fallbacks?.targetRole || "",
    geography: clean(profile.geography) || fallbacks?.geography || "",
    industry: clean(profile.industry) || fallbacks?.industry || "",
    experienceLevel:
      (profile.experienceLevel as ExperienceLevelValue | null) ||
      fallbacks?.experienceLevel ||
      "",
    workPreference: fallbacks?.workPreference || "FLEXIBLE",
    salaryMin: fallbacks?.salaryMin || "",
    salaryMax: fallbacks?.salaryMax || "",
    timeHorizon: fallbacks?.timeHorizon || "6 months",
  };
}

export function missingOnboardingFields(draft: OnboardingDraft): FieldKey[] {
  const missing: FieldKey[] = [];

  for (const key of REQUIRED_FIELDS) {
    const value = draft[key];
    if (!String(value ?? "").trim()) missing.push(key);
  }

  for (const key of ALWAYS_ASK) {
    if (key === "workPreference" || key === "timeHorizon") continue;
    // salary optional — only nudge if both empty? skip required
  }

  // Preferences always need confirmation even when defaulted
  if (!missing.includes("workPreference")) {
    // keep visible as review, not missing
  }

  return missing;
}

export function reviewHints(draft: OnboardingDraft): {
  missing: FieldKey[];
  confirm: FieldKey[];
} {
  const missing = missingOnboardingFields(draft);
  const confirm: FieldKey[] = ALWAYS_ASK.filter((k) => !missing.includes(k));
  return { missing, confirm };
}
