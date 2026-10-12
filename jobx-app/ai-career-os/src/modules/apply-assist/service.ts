import type { Prisma } from "@prisma/client";
import { getAiProvider, isAiConfigured } from "@/lib/ai";
import { prisma } from "@/lib/db";
import {
  buildHeuristicApplyAssist,
  parseApplyAssistJson,
} from "@/modules/apply-assist/generate";
import type { ApplyAssistPack } from "@/modules/apply-assist/types";
import { MATCH_SCORER_VERSION } from "@/modules/matching/types";

export async function getLatestApplyAssist(userId: string, jobId: string) {
  return prisma.applicationAssist.findFirst({
    where: { userId, jobId },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateApplyAssist(
  userId: string,
  jobId: string,
): Promise<{ assist: Awaited<ReturnType<typeof getLatestApplyAssist>>; usedAi: boolean }> {
  const [user, job, match, resume, overlapSkills] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        targetRoles: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobSkills: { include: { skill: true }, orderBy: { importance: "asc" } },
      },
    }),
    prisma.jobMatch.findUnique({
      where: {
        userId_jobId_scorerVersion: {
          userId,
          jobId,
          scorerVersion: MATCH_SCORER_VERSION,
        },
      },
    }),
    prisma.resumeDocument.findFirst({
      where: { userId, parseStatus: { in: ["PARSED", "UPLOADED", "EXTRACTING"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
  ]);

  if (!user || !job) {
    throw new Error("User or job not found.");
  }

  const userSkillIds = new Set(overlapSkills.map((s) => s.skillId));
  const have = job.jobSkills
    .filter((js) => userSkillIds.has(js.skillId))
    .map((js) => js.skill.canonicalName);
  const missing = job.jobSkills
    .filter((js) => !userSkillIds.has(js.skillId))
    .map((js) => js.skill.canonicalName);

  const fullName =
    user.profile?.fullName?.trim() || user.email.split("@")[0] || "Candidate";
  const targetRole = user.targetRoles[0]?.title ?? null;
  const resumeText = resume?.extractedText?.trim() ?? "";
  const resumeSnippet = resumeText.slice(0, 1200);

  let pack: ApplyAssistPack;
  let usedAi = false;
  let aiRunId: string | null = null;

  if (isAiConfigured() && resumeText) {
    try {
      const provider = getAiProvider();
      const result = await provider.complete({
        purpose: "apply_assist",
        model: "default",
        temperature: 0.4,
        json: true,
        promptVersion: "apply_assist_v1",
        messages: [
          {
            role: "system",
            content:
              "You help candidates prepare job applications. Return JSON only with keys: coverLetter (string), talkingPoints (string or string[]), emailSubject (string), emailBody (string). Be specific, honest, and concise. Do not invent employers or degrees not present in the resume.",
          },
          {
            role: "user",
            content: JSON.stringify({
              candidate: {
                fullName,
                targetRole,
                geography: user.profile?.geography ?? null,
                experienceLevel: user.profile?.experienceLevel ?? null,
              },
              job: {
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description.slice(0, 2500),
                skills: job.jobSkills.map((js) => ({
                  name: js.skill.canonicalName,
                  importance: js.importance,
                })),
              },
              match: match
                ? {
                    overallScore: match.overallScore,
                    explanation: match.explanation,
                  }
                : null,
              overlap: { have, missing },
              resumeExcerpt: resumeSnippet,
            }),
          },
        ],
      });

      const parsed = parseApplyAssistJson(result.content);
      if (!parsed) {
        throw new Error("AI returned incomplete apply-assist JSON.");
      }
      pack = parsed;
      usedAi = true;

      const aiRun = await prisma.aiRun.create({
        data: {
          userId,
          purpose: "apply_assist",
          model: result.model,
          promptVersion: result.promptVersion ?? "apply_assist_v1",
          inputRef: {
            jobId,
            resumeDocumentId: resume?.id ?? null,
          } as Prisma.InputJsonValue,
          output: pack as unknown as Prisma.InputJsonValue,
          tokenIn: result.tokenIn,
          tokenOut: result.tokenOut,
          latencyMs: result.latencyMs,
          status: "SUCCEEDED",
        },
      });
      aiRunId = aiRun.id;
    } catch {
      pack = buildHeuristicApplyAssist({
        fullName,
        targetRole,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        matchScore: match?.overallScore ?? null,
        overlapHave: have,
        overlapMissing: missing,
        resumeSnippet,
      });
    }
  } else {
    pack = buildHeuristicApplyAssist({
      fullName,
      targetRole,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      matchScore: match?.overallScore ?? null,
      overlapHave: have,
      overlapMissing: missing,
      resumeSnippet,
    });
  }

  const assist = await prisma.applicationAssist.create({
    data: {
      userId,
      jobId,
      coverLetter: pack.coverLetter,
      talkingPoints: pack.talkingPoints,
      emailSubject: pack.emailSubject,
      emailBody: pack.emailBody,
      aiRunId,
    },
  });

  return { assist, usedAi };
}
