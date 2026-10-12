import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import { MATCH_SCORER_VERSION } from "@/modules/matching/types";
import { scoreJobMatch } from "@/modules/matching/scorer";
import { diagnoseGapsFromMatches } from "@/modules/gaps/diagnose";

export type MatchRunResult = {
  scored: number;
  gapsCreated: number;
  scorerVersion: string;
};

async function loadUserMatchContext(userId: string) {
  const [profile, primaryRole, userSkills, educationCount, experienceCount, evidenced] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.targetRole.findFirst({
        where: { userId, isPrimary: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
      }),
      prisma.education.count({ where: { userId } }),
      prisma.experience.count({ where: { userId } }),
      prisma.evidenceSkill.findMany({
        where: { evidence: { userId } },
        select: { skillId: true },
      }),
    ]);

  const evidencedIds = new Set(evidenced.map((e) => e.skillId));

  return {
    profile,
    primaryRole,
    educationCount,
    experienceCount,
    userSkills: userSkills.map((us) => ({
      skillId: us.skillId,
      name: us.skill.canonicalName,
      hasEvidence: evidencedIds.has(us.skillId),
    })),
  };
}

export async function runMatchingForUser(userId: string): Promise<MatchRunResult> {
  const ctx = await loadUserMatchContext(userId);
  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: {
      jobSkills: { include: { skill: true } },
    },
    take: 200,
  });

  const matchRows: Array<{
    jobId: string;
    overall: number;
    missingRequired: Array<{ skillId: string; name: string }>;
    weakSkills: string[];
  }> = [];

  await prisma.$transaction(async (tx) => {
    for (const job of jobs) {
      const result = scoreJobMatch({
        job: {
          id: job.id,
          title: job.title,
          location: job.location,
          workMode: job.workMode,
          seniority: job.seniority,
          educationRequirements: job.educationRequirements,
          experienceRequirements: job.experienceRequirements,
        },
        jobSkills: job.jobSkills.map((js) => ({
          skillId: js.skillId,
          name: js.skill.canonicalName,
          importance: js.importance,
        })),
        user: {
          geography: ctx.profile?.geography ?? null,
          workPreference: ctx.profile?.workPreference ?? null,
          experienceLevel: ctx.profile?.experienceLevel ?? null,
          educationCount: ctx.educationCount,
          experienceCount: ctx.experienceCount,
          targetRoleTitle: ctx.primaryRole?.title ?? null,
        },
        userSkills: ctx.userSkills,
      });

      const skillsBreakdown = result.breakdown.skills as {
        missingRequired: Array<{ skillId: string; name: string }>;
      };
      const evidenceBreakdown = result.breakdown.evidence as {
        weakSkills: string[];
      };

      await tx.jobMatch.upsert({
        where: {
          userId_jobId_scorerVersion: {
            userId,
            jobId: job.id,
            scorerVersion: MATCH_SCORER_VERSION,
          },
        },
        create: {
          userId,
          jobId: job.id,
          scorerVersion: MATCH_SCORER_VERSION,
          overallScore: result.overall,
          skillsScore: result.dimensions.skills,
          experienceScore: result.dimensions.experience,
          educationScore: result.dimensions.education,
          locationScore: result.dimensions.location,
          evidenceScore: result.dimensions.evidence,
          explanation: result.explanation,
          scoreBreakdown: result.breakdown as Prisma.InputJsonValue,
        },
        update: {
          overallScore: result.overall,
          skillsScore: result.dimensions.skills,
          experienceScore: result.dimensions.experience,
          educationScore: result.dimensions.education,
          locationScore: result.dimensions.location,
          evidenceScore: result.dimensions.evidence,
          explanation: result.explanation,
          scoreBreakdown: result.breakdown as Prisma.InputJsonValue,
        },
      });

      matchRows.push({
        jobId: job.id,
        overall: result.overall,
        missingRequired: skillsBreakdown.missingRequired ?? [],
        weakSkills: evidenceBreakdown.weakSkills ?? [],
      });
    }
  });

  const gapsCreated = await diagnoseGapsFromMatches(userId, {
    targetRoleTitle: ctx.primaryRole?.title ?? null,
    userSkillNames: ctx.userSkills.map((s) => s.name),
    matchRows,
  });

  try {
    const { sendMatchDigestIfNeeded } = await import(
      "@/modules/apply-assist/alerts"
    );
    await sendMatchDigestIfNeeded(userId);
  } catch (error) {
    console.warn(
      "[match-digest]",
      error instanceof Error ? error.message : error,
    );
  }

  return {
    scored: jobs.length,
    gapsCreated,
    scorerVersion: MATCH_SCORER_VERSION,
  };
}

export async function listMatchesForUser(userId: string) {
  return prisma.jobMatch.findMany({
    where: { userId, scorerVersion: MATCH_SCORER_VERSION },
    include: {
      job: {
        include: {
          jobSkills: {
            include: { skill: true },
            orderBy: { importance: "asc" },
          },
        },
      },
    },
    orderBy: { overallScore: "desc" },
    take: 100,
  });
}

export async function getMatchForJob(userId: string, jobId: string) {
  return prisma.jobMatch.findUnique({
    where: {
      userId_jobId_scorerVersion: {
        userId,
        jobId,
        scorerVersion: MATCH_SCORER_VERSION,
      },
    },
  });
}

export async function requireMatchingUser() {
  return ensureAppUser();
}
