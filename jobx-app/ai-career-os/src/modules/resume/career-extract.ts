import { z } from "zod";
import { getAiProvider, isAiConfigured } from "@/lib/ai";
import {
  extractedProfileSchema,
  heuristicParse,
  type ExtractedProfile,
} from "@/modules/resume/parse-profile";

const dateString = z.string().nullable().optional();

const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().nullable().optional(),
  startDate: dateString,
  endDate: dateString,
  isCurrent: z.boolean().optional().default(false),
  description: z.string().nullable().optional(),
  skills: z.array(z.string()).optional().default([]),
});

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: dateString,
  endDate: dateString,
  description: z.string().nullable().optional(),
});

const projectSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  technologies: z.array(z.string()).optional().default([]),
});

const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable().optional(),
  issueDate: dateString,
  credentialUrl: z.string().nullable().optional(),
});

const achievementSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  metric: z.string().nullable().optional(),
});

export const careerGraphExtractSchema = extractedProfileSchema.extend({
  experiences: z.array(experienceSchema).nullish().default([]),
  education: z.array(educationSchema).nullish().default([]),
  projects: z.array(projectSchema).nullish().default([]),
  certifications: z.array(certificationSchema).nullish().default([]),
  achievements: z.array(achievementSchema).nullish().default([]),
});

export type CareerGraphExtract = z.infer<typeof careerGraphExtractSchema>;

function section(text: string, ...labels: string[]) {
  const joined = labels.join("|");
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:${joined})\\s*[:\\n]+([\\s\\S]*?)(?=\\n\\s*(?:experience|work history|education|projects?|skills|certifications?|achievements?|awards|summary)\\b|$)`,
    "i",
  );
  return text.match(re)?.[1]?.trim() ?? "";
}

function heuristicCareerExtract(
  text: string,
  base: ExtractedProfile,
): CareerGraphExtract {
  const skills = [...(base.skills ?? [])];
  const experiences: CareerGraphExtract["experiences"] = [];
  const education: CareerGraphExtract["education"] = [];
  const projects: CareerGraphExtract["projects"] = [];

  const expBlock = section(
    text,
    "experience",
    "work experience",
    "work history",
    "employment",
  );
  if (expBlock) {
    const chunks = expBlock
      .split(/\n(?=[A-Z][^\n]{2,80})/)
      .map((c) => c.trim())
      .filter((c) => c.length > 12)
      .slice(0, 8);
    for (const chunk of chunks) {
      const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const head = lines[0] ?? "";
      const atMatch = head.match(/^(.+?)\s+(?:[-–@|]|at)\s+(.+)$/i);
      const title = (atMatch?.[1] ?? head).slice(0, 120);
      const company = (atMatch?.[2] ?? lines[1] ?? "Unknown company").slice(
        0,
        120,
      );
      if (title.length < 2) continue;
      experiences.push({
        company,
        title,
        location: null,
        startDate: null,
        endDate: null,
        isCurrent: /present|current/i.test(chunk),
        description: lines.slice(1, 6).join(" ").slice(0, 800) || null,
        skills: [],
      });
    }
  }

  const eduBlock = section(text, "education");
  if (eduBlock) {
    const lines = eduBlock
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (lines[0]) {
      education.push({
        institution: lines[0].slice(0, 160),
        degree: lines[1]?.slice(0, 120) ?? null,
        fieldOfStudy: null,
        startDate: null,
        endDate: null,
        description: lines.slice(2).join(" ").slice(0, 400) || null,
      });
    }
  }

  const projectBlock = section(text, "projects", "personal projects");
  if (projectBlock) {
    const chunks = projectBlock
      .split(/\n(?=[A-Z*•\-])/)
      .map((c) => c.trim())
      .filter((c) => c.length > 8)
      .slice(0, 6);
    for (const chunk of chunks) {
      const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const name = lines[0]?.replace(/^[-•*]\s*/, "").slice(0, 120);
      if (!name) continue;
      projects.push({
        name,
        description: lines.slice(1).join(" ").slice(0, 600) || null,
        url: chunk.match(/https?:\/\/\S+/)?.[0] ?? null,
        technologies: [],
      });
    }
  }

  return careerGraphExtractSchema.parse({
    ...base,
    skills,
    experiences,
    education,
    projects,
    certifications: [],
    achievements: [],
  });
}

async function aiCareerExtract(text: string): Promise<CareerGraphExtract> {
  const provider = getAiProvider();
  const result = await provider.complete({
    purpose: "resume_career_graph_extract",
    promptVersion: "v1",
    json: true,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Extract a structured career graph from a resume. Return JSON only with:
fullName, targetRole, geography, industry,
experienceLevel (INTERN|JUNIOR|MID|SENIOR|LEAD|EXECUTIVE or null),
skills (string[]), summary,
experiences: [{company, title, location, startDate, endDate, isCurrent, description, skills[]}],
education: [{institution, degree, fieldOfStudy, startDate, endDate, description}],
projects: [{name, description, url, technologies[]}],
certifications: [{name, issuer, issueDate, credentialUrl}],
achievements: [{title, description, metric}].
Dates as YYYY-MM or YYYY when possible, else null.
Do not invent employers, schools, or skills not supported by the text. Empty arrays when unknown.`,
      },
      {
        role: "user",
        content: `Resume text:\n\n${text.slice(0, 28_000)}`,
      },
    ],
  });

  return careerGraphExtractSchema.parse(JSON.parse(result.content) as unknown);
}

export async function extractCareerGraph(text: string): Promise<{
  graph: CareerGraphExtract;
  source: "ai" | "heuristic";
  warning?: string;
}> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      graph: careerGraphExtractSchema.parse({ skills: [] }),
      source: "heuristic",
      warning:
        "We couldn't read text from this file (it may be a scanned PDF). Career Graph stays empty until you upload a readable resume.",
    };
  }

  if (isAiConfigured()) {
    try {
      const graph = await aiCareerExtract(trimmed);
      return { graph, source: "ai" };
    } catch (error) {
      return {
        graph: heuristicCareerExtract(trimmed, heuristicParse(trimmed)),
        source: "heuristic",
        warning:
          error instanceof Error
            ? `AI career extraction failed (${error.message}). Used text heuristics instead.`
            : "AI career extraction failed. Used text heuristics instead.",
      };
    }
  }

  return {
    graph: heuristicCareerExtract(trimmed, heuristicParse(trimmed)),
    source: "heuristic",
    warning:
      "AI is not configured (set AI_API_KEY). Built Career Graph from text heuristics — review for accuracy.",
  };
}
