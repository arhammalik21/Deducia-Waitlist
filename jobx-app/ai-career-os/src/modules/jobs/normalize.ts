import {
  EmploymentType,
  ExperienceLevel,
  SkillImportance,
  WorkPreference,
} from "@prisma/client";
import type { RawJobPayload } from "@/modules/jobs/adapters/types";
import { normalizeSkillName } from "@/modules/career-graph/skills";

/** Curated dictionary for deterministic skill extraction from descriptions. */
export const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Kotlin",
  "Swift",
  "C++",
  "SQL",
  "HTML",
  "CSS",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Node.js",
  "Django",
  "Flask",
  "Spring",
  "Rails",
  ".NET",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "DynamoDB",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Linux",
  "GraphQL",
  "REST APIs",
  "System Design",
  "Machine Learning",
  "PyTorch",
  "TensorFlow",
  "Pandas",
  "Statistics",
  "Airflow",
  "dbt",
  "Spark",
  "Kafka",
  "MLOps",
  "Observability",
  "Storybook",
  "Design Systems",
  "Accessibility",
  "Roadmapping",
  "User Research",
  "Analytics",
  "Communication",
  "Leadership",
  "Mentoring",
  "A/B Testing",
  "OpenAI API",
  "LangChain",
  "Vector Databases",
  "Healthcare Domain",
  "Problem Solving",
  "Collaboration",
] as const;

export type NormalizedSkillMention = {
  name: string;
  importance: SkillImportance;
  rawMention: string;
  confidence: number;
};

export type NormalizedJob = {
  title: string;
  company: string;
  location: string | null;
  workMode: WorkPreference | null;
  employmentType: EmploymentType | null;
  seniority: ExperienceLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  experienceRequirements: string | null;
  educationRequirements: string | null;
  applicationUrl: string | null;
  postedAt: Date | null;
  skills: NormalizedSkillMention[];
};

function detectSeniority(
  title: string,
  hint?: RawJobPayload["seniority"],
): ExperienceLevel | null {
  if (hint) return hint;
  const t = title.toLowerCase();
  if (/\bintern\b/.test(t)) return ExperienceLevel.INTERN;
  if (/\b(junior|jr\.?|entry)\b/.test(t)) return ExperienceLevel.JUNIOR;
  if (/\b(lead|staff|principal)\b/.test(t)) return ExperienceLevel.LEAD;
  if (/\b(director|vp|head of|chief)\b/.test(t)) return ExperienceLevel.EXECUTIVE;
  if (/\b(senior|sr\.?)\b/.test(t)) return ExperienceLevel.SENIOR;
  if (/\b(mid[\s-]?level|intermediate)\b/.test(t)) return ExperienceLevel.MID;
  return ExperienceLevel.MID;
}

function detectWorkMode(
  location: string | undefined,
  description: string,
  hint?: RawJobPayload["workMode"],
): WorkPreference | null {
  if (hint) return hint;
  const blob = `${location ?? ""} ${description}`.toLowerCase();
  if (/\bhybrid\b/.test(blob)) return WorkPreference.HYBRID;
  if (/\bremote\b/.test(blob)) return WorkPreference.REMOTE;
  if (/\b(on[\s-]?site|onsite|in[\s-]?office)\b/.test(blob))
    return WorkPreference.ONSITE;
  return null;
}

function detectEmploymentType(
  description: string,
  hint?: RawJobPayload["employmentType"],
): EmploymentType | null {
  if (hint) return hint;
  const d = description.toLowerCase();
  if (/\bintern(ship)?\b/.test(d)) return EmploymentType.INTERNSHIP;
  if (/\bcontract\b|\bhourly\b/.test(d)) return EmploymentType.CONTRACT;
  if (/\bpart[\s-]?time\b/.test(d)) return EmploymentType.PART_TIME;
  if (/\btemporary\b|\btemp\b/.test(d)) return EmploymentType.TEMPORARY;
  if (/\bfull[\s-]?time\b/.test(d)) return EmploymentType.FULL_TIME;
  return EmploymentType.FULL_TIME;
}

function extractRequirementBlocks(description: string) {
  const experience =
    description.match(
      /(?:experience requirements?|years of experience)[:\s]*([\s\S]{10,400}?)(?:\n\s*\n|education|benefits|$)/i,
    )?.[1] ?? null;
  const education =
    description.match(
      /(?:education requirements?|degree)[:\s]*([\s\S]{10,300}?)(?:\n\s*\n|benefits|compensation|$)/i,
    )?.[1] ?? null;
  return {
    experienceRequirements: experience?.trim() || null,
    educationRequirements: education?.trim() || null,
  };
}

function importanceForContext(context: string): SkillImportance {
  const c = context.toLowerCase();
  if (
    /nice to have|preferred|bonus|plus|optional|good to have/.test(c)
  ) {
    return SkillImportance.PREFERRED;
  }
  return SkillImportance.REQUIRED;
}

function extractSkillsFromText(description: string): NormalizedSkillMention[] {
  const lower = description.toLowerCase();
  const mentions: NormalizedSkillMention[] = [];
  const seen = new Set<string>();

  // Prefer section-aware extraction when labels exist
  const requiredBlock =
    description.match(
      /(?:required|must have|requirements)[:\s]*([\s\S]{10,900}?)(?:\n\s*(?:nice|preferred|bonus|benefits|you will)|$)/i,
    )?.[1] ?? "";
  const preferredBlock =
    description.match(
      /(?:nice to have|preferred|bonus)[:\s]*([\s\S]{10,700}?)(?:\n\s*(?:benefits|you will|compensation)|$)/i,
    )?.[1] ?? "";

  const scan = (block: string, fallbackImportance: SkillImportance) => {
    for (const skill of KNOWN_SKILLS) {
      const key = skill.toLowerCase();
      // Word-ish match; allow . and + in names
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
      if (!re.test(block)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      mentions.push({
        name: normalizeSkillName(skill),
        importance: fallbackImportance,
        rawMention: skill,
        confidence: 0.85,
      });
    }
  };

  if (requiredBlock || preferredBlock) {
    scan(requiredBlock || description, SkillImportance.REQUIRED);
    scan(preferredBlock, SkillImportance.PREFERRED);
  } else {
    for (const skill of KNOWN_SKILLS) {
      const key = skill.toLowerCase();
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
      const match = lower.match(re);
      if (!match || seen.has(key)) continue;
      seen.add(key);
      const idx = lower.indexOf(key);
      const context = description.slice(Math.max(0, idx - 80), idx + key.length + 80);
      mentions.push({
        name: normalizeSkillName(skill),
        importance: importanceForContext(context),
        rawMention: skill,
        confidence: 0.7,
      });
    }
  }

  return mentions;
}

export function normalizeJob(raw: RawJobPayload): NormalizedJob {
  const fromHints: NormalizedSkillMention[] = [];
  const seen = new Set<string>();

  for (const name of raw.requiredSkills ?? []) {
    const n = normalizeSkillName(name);
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    fromHints.push({
      name: n,
      importance: SkillImportance.REQUIRED,
      rawMention: name,
      confidence: 0.95,
    });
  }
  for (const name of raw.preferredSkills ?? []) {
    const n = normalizeSkillName(name);
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    fromHints.push({
      name: n,
      importance: SkillImportance.PREFERRED,
      rawMention: name,
      confidence: 0.9,
    });
  }

  const extracted = extractSkillsFromText(raw.description).filter(
    (s) => !seen.has(s.name.toLowerCase()),
  );

  const reqBlocks = extractRequirementBlocks(raw.description);
  const postedAt = raw.postedAt ? new Date(raw.postedAt) : null;

  return {
    title: raw.title.trim(),
    company: raw.company.trim(),
    location: raw.location?.trim() || null,
    workMode: detectWorkMode(raw.location, raw.description, raw.workMode),
    employmentType: detectEmploymentType(raw.description, raw.employmentType),
    seniority: detectSeniority(raw.title, raw.seniority),
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    salaryCurrency: raw.salaryCurrency ?? null,
    description: raw.description.trim(),
    experienceRequirements: reqBlocks.experienceRequirements,
    educationRequirements: reqBlocks.educationRequirements,
    applicationUrl: raw.applicationUrl?.trim() || null,
    postedAt:
      postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    skills: [...fromHints, ...extracted],
  };
}
