import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ExperienceLevel,
  type Prisma,
  WorkPreference,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import { persistCareerGraph } from "@/modules/career-graph/persist";
import { extractResumeText } from "@/modules/resume/extract-text";
import { extractCareerGraph } from "@/modules/resume/career-extract";
import { reviewHints, toOnboardingDraft } from "@/modules/resume/parse-profile";
import type { FieldKey, OnboardingDraft } from "@/modules/resume/types";
import type { ProvenanceType } from "@prisma/client";

const WORK_PREFERENCES = new Set(Object.values(WorkPreference));
const EXPERIENCE_LEVELS = new Set(Object.values(ExperienceLevel));

export type OnboardingInput = {
  fullName: string;
  targetRole: string;
  geography: string;
  workPreference: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  industry: string;
  timeHorizon: string;
  resumeDocumentId?: string | null;
};

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export type ParseResumeResult =
  | {
      ok: true;
      resumeDocumentId: string;
      fileName: string;
      draft: OnboardingDraft;
      missing: FieldKey[];
      confirm: FieldKey[];
      source: "ai" | "heuristic";
      warning?: string;
      skills: string[];
    }
  | { ok: false; error: string };

function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function uploadAndParseResume(
  file: File,
): Promise<ParseResumeResult> {
  const user = await ensureAppUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to continue." };
  }

  if (!file || file.size === 0) {
    return { ok: false, error: "Choose a resume file to upload." };
  }

  try {
    const stored = await storeResume(prisma, user.id, file);
    const extracted = await extractCareerGraph(stored.extractedText ?? "");
    const draft = toOnboardingDraft(extracted.graph, {
      fullName: user.profile?.fullName ?? "",
      geography: user.profile?.geography ?? "",
      experienceLevel: user.profile?.experienceLevel ?? "",
      workPreference: user.profile?.workPreference ?? "FLEXIBLE",
      industry: user.profile?.industryPreference ?? "",
    });
    const { missing, confirm } = reviewHints(draft);
    const provenance: ProvenanceType =
      extracted.source === "ai" ? "MODEL_PREDICTION" : "USER_CLAIM";

    await prisma.$transaction(async (tx) => {
      if (stored.extractedText?.trim()) {
        await persistCareerGraph(tx, user.id, extracted.graph, {
          provenance,
          replace: true,
        });
      }

      await tx.resumeDocument.update({
        where: { id: stored.id },
        data: {
          parseStatus: stored.extractedText ? "PARSED" : "FAILED",
          parseError: stored.extractedText
            ? null
            : "No extractable text layer found",
          parsedPayload: {
            ...extracted.graph,
            source: extracted.source,
            warning: extracted.warning ?? null,
          },
        },
      });

      await tx.profile.update({
        where: { userId: user.id },
        data: {
          onboardingStatus: "IN_PROGRESS",
          fullName: draft.fullName || user.profile?.fullName,
          headline: extracted.graph.summary?.slice(0, 200) || undefined,
        },
      });
    });

    return {
      ok: true,
      resumeDocumentId: stored.id,
      fileName: stored.fileName,
      draft,
      missing,
      confirm,
      source: extracted.source,
      warning: extracted.warning,
      skills: extracted.graph.skills ?? [],
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not read that resume. Try PDF, DOCX, or TXT.",
    };
  }
}

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const user = await ensureAppUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to continue." };
  }

  const fullName = input.fullName.trim();
  const targetRole = input.targetRole.trim();
  const geography = input.geography.trim();
  const industry = input.industry.trim();
  const timeHorizon = input.timeHorizon.trim();

  if (!fullName) {
    return { ok: false, error: "Full name is required." };
  }

  if (!targetRole) {
    return { ok: false, error: "Target role is required." };
  }

  if (!WORK_PREFERENCES.has(input.workPreference as WorkPreference)) {
    return { ok: false, error: "Select a valid work preference." };
  }

  if (!EXPERIENCE_LEVELS.has(input.experienceLevel as ExperienceLevel)) {
    return { ok: false, error: "Select a valid experience level." };
  }

  const salaryMin = parseOptionalInt(input.salaryMin);
  const salaryMax = parseOptionalInt(input.salaryMax);
  if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
    return { ok: false, error: "Minimum salary cannot exceed maximum salary." };
  }

  const workPreference = input.workPreference as WorkPreference;
  const experienceLevel = input.experienceLevel as ExperienceLevel;

  try {
    await prisma.$transaction(async (tx) => {
      if (input.resumeDocumentId) {
        const owned = await tx.resumeDocument.findFirst({
          where: { id: input.resumeDocumentId, userId: user.id },
          select: { id: true },
        });
        if (!owned) {
          throw new Error("Resume upload not found. Please upload again.");
        }
      }

      await tx.profile.update({
        where: { userId: user.id },
        data: {
          fullName,
          geography: geography || null,
          location: geography || null,
          workPreference,
          experienceLevel,
          salaryTargetMin: salaryMin,
          salaryTargetMax: salaryMax,
          industryPreference: industry || null,
          onboardingStatus: "COMPLETED",
        },
      });

      await tx.targetRole.updateMany({
        where: { userId: user.id, isPrimary: true },
        data: { isPrimary: false },
      });

      const role = await tx.targetRole.create({
        data: {
          userId: user.id,
          title: targetRole,
          seniority: experienceLevel,
          industry: industry || null,
          isPrimary: true,
        },
      });

      await tx.careerGoal.create({
        data: {
          userId: user.id,
          targetRoleId: role.id,
          description: `Reach ${targetRole}${industry ? ` in ${industry}` : ""}${
            timeHorizon ? ` within ${timeHorizon}` : ""
          }.`,
          timeHorizon: timeHorizon || null,
          status: "ACTIVE",
        },
      });
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save onboarding. Please try again.",
    };
  }

  return { ok: true };
}

async function storeResume(
  db: Prisma.TransactionClient | typeof prisma,
  userId: string,
  file: File,
) {
  const allowed = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]);

  if (!allowed.has(file.type) && !/\.(pdf|docx?|txt)$/i.test(file.name)) {
    throw new Error("Resume must be a PDF, DOCX, or TXT file.");
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Resume must be 8MB or smaller.");
  }

  const uploadRoot =
    process.env.RESUME_UPLOAD_DIR?.trim() || "./storage/resumes";
  const userDir = path.join(uploadRoot, userId);
  await mkdir(userDir, { recursive: true });

  const safeName = file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const storedName = `${Date.now()}-${safeName}`;
  const storagePath = path.join(userDir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, bytes);

  let extractedText: string | null = null;
  let parseStatus: "UPLOADED" | "EXTRACTING" | "PARSED" | "FAILED" =
    "EXTRACTING";
  let parseError: string | null = null;

  try {
    const extracted = await extractResumeText(
      bytes,
      file.name,
      file.type || "application/octet-stream",
    );
    extractedText = extracted.text || null;
    parseStatus = extractedText ? "PARSED" : "FAILED";
    if (!extractedText) {
      parseError = "No extractable text layer found";
    }
  } catch (error) {
    parseStatus = "FAILED";
    parseError =
      error instanceof Error ? error.message : "Failed to extract resume text";
  }

  const row = await db.resumeDocument.create({
    data: {
      userId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      storagePath,
      fileSizeBytes: file.size,
      extractedText,
      parseStatus,
      parseError,
      sourceProvenance: "USER_UPLOAD",
    },
  });

  return row;
}

export async function getOnboardingState() {
  const user = await ensureAppUser();
  if (!user) return null;

  const [primaryRole, latestResume] = await Promise.all([
    prisma.targetRole.findFirst({
      where: { userId: user.id, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resumeDocument.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        parseStatus: true,
        parsedPayload: true,
      },
    }),
  ]);

  return {
    user,
    profile: user.profile,
    primaryRole,
    latestResume,
  };
}
