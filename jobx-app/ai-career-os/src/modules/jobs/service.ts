import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import { ingestSeedJobs, type IngestResult } from "@/modules/jobs/ingest";
import { computeFeedRelevance } from "@/modules/jobs/relevance";
import { MATCH_SCORER_VERSION } from "@/modules/matching/types";

export type JobListFilters = {
  q?: string;
  workMode?: string;
  seniority?: string;
  employmentType?: string;
  sort?: "relevance" | "recent";
};

export async function listOpportunities(
  userId: string | null,
  filters: JobListFilters = {},
) {
  const and: Prisma.JobWhereInput[] = [{ status: "ACTIVE" }];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (
    filters.workMode === "REMOTE" ||
    filters.workMode === "HYBRID" ||
    filters.workMode === "ONSITE" ||
    filters.workMode === "FLEXIBLE"
  ) {
    and.push({ workMode: filters.workMode });
  }

  if (
    filters.seniority === "INTERN" ||
    filters.seniority === "JUNIOR" ||
    filters.seniority === "MID" ||
    filters.seniority === "SENIOR" ||
    filters.seniority === "LEAD" ||
    filters.seniority === "EXECUTIVE"
  ) {
    and.push({ seniority: filters.seniority });
  }

  if (
    filters.employmentType === "FULL_TIME" ||
    filters.employmentType === "PART_TIME" ||
    filters.employmentType === "CONTRACT" ||
    filters.employmentType === "INTERNSHIP" ||
    filters.employmentType === "TEMPORARY"
  ) {
    and.push({ employmentType: filters.employmentType });
  }

  const jobs = await prisma.job.findMany({
    where: { AND: and },
    include: {
      jobSkills: {
        include: { skill: true },
        orderBy: { importance: "asc" },
      },
    },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const [total, freshCount, profile, primaryRole, userSkills, matches] =
    await Promise.all([
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.job.count({ where: { status: "ACTIVE", freshness: "FRESH" } }),
      userId
        ? prisma.profile.findUnique({ where: { userId } })
        : Promise.resolve(null),
      userId
        ? prisma.targetRole.findFirst({
            where: { userId, isPrimary: true },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve(null),
      userId
        ? prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
          })
        : Promise.resolve([]),
      userId
        ? prisma.jobMatch.findMany({
            where: { userId, scorerVersion: MATCH_SCORER_VERSION },
            select: {
              jobId: true,
              overallScore: true,
              skillsScore: true,
              explanation: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const ownedNames = userSkills.map((s) => s.skill.canonicalName);
  const matchByJob = new Map(matches.map((m) => [m.jobId, m]));

  const ranked = jobs.map((job) => {
    const required = job.jobSkills
      .filter((s) => s.importance === "REQUIRED")
      .map((s) => s.skill.canonicalName);
    const preferred = job.jobSkills
      .filter((s) => s.importance === "PREFERRED")
      .map((s) => s.skill.canonicalName);

    const relevance = computeFeedRelevance({
      jobTitle: job.title,
      jobSeniority: job.seniority,
      jobWorkMode: job.workMode,
      jobLocation: job.location,
      requiredSkills: required,
      preferredSkills: preferred,
      userSkills: ownedNames,
      targetRoleTitle: primaryRole?.title ?? null,
      targetSeniority: primaryRole?.seniority ?? null,
      userWorkPreference: profile?.workPreference ?? null,
      userGeography: profile?.geography ?? null,
    });

    const match = matchByJob.get(job.id) ?? null;

    return { ...job, relevance, match };
  });

  const sort = filters.sort === "recent" ? "recent" : "relevance";
  if (sort === "relevance") {
    ranked.sort((a, b) => {
      const aScore = a.match?.overallScore ?? a.relevance.score / 100;
      const bScore = b.match?.overallScore ?? b.relevance.score / 100;
      if (bScore !== aScore) return bScore - aScore;
      const aTime = a.postedAt?.getTime() ?? 0;
      const bTime = b.postedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }

  return {
    jobs: ranked,
    total,
    freshCount,
    sort,
    targetRoleTitle: primaryRole?.title ?? null,
    userSkillCount: ownedNames.length,
    matchCount: matches.length,
    scorerVersion: MATCH_SCORER_VERSION,
  };
}

export async function getOpportunity(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      jobSkills: {
        include: { skill: true },
        orderBy: [{ importance: "asc" }, { confidence: "desc" }],
      },
    },
  });
}

export async function getOpportunityFeedMeta() {
  const [total, rawCount, lastRaw] = await Promise.all([
    prisma.job.count({ where: { status: "ACTIVE" } }),
    prisma.jobRaw.count(),
    prisma.jobRaw.findFirst({ orderBy: { fetchedAt: "desc" } }),
  ]);

  return {
    total,
    rawCount,
    lastFetchedAt: lastRaw?.fetchedAt ?? null,
    lastSource: lastRaw?.source ?? null,
  };
}

export async function runSeedIngest(): Promise<IngestResult> {
  return ingestSeedJobs();
}

export async function getUserSkillOverlap(userId: string, jobId: string) {
  const [userSkills, jobSkills] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
    prisma.jobSkill.findMany({
      where: { jobId },
      include: { skill: true },
    }),
  ]);

  const owned = new Set(
    userSkills.map((s) => s.skill.canonicalName.toLowerCase()),
  );

  const have = jobSkills.filter((js) =>
    owned.has(js.skill.canonicalName.toLowerCase()),
  );
  const missing = jobSkills.filter(
    (js) => !owned.has(js.skill.canonicalName.toLowerCase()),
  );

  return { have, missing, ownedCount: userSkills.length };
}

export async function requireJobsUser() {
  return ensureAppUser();
}
