import { createHash } from "node:crypto";
import { JobFreshness, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { findOrCreateSkill } from "@/modules/career-graph/skills";
import type { JobSourceAdapter } from "@/modules/jobs/adapters/types";
import { SeedJobAdapter } from "@/modules/jobs/adapters/seed-adapter";
import { normalizeJob } from "@/modules/jobs/normalize";

export type IngestResult = {
  source: string;
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  staleMarked: number;
  failed: number;
  errors: string[];
};

function contentHash(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function freshnessFor(postedAt: Date | null): JobFreshness {
  if (!postedAt) return JobFreshness.FRESH;
  const ageDays =
    (Date.now() - postedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 60) return JobFreshness.EXPIRED;
  if (ageDays > 30) return JobFreshness.STALE;
  return JobFreshness.FRESH;
}

async function upsertNormalizedJob(
  tx: Prisma.TransactionClient,
  args: {
    source: string;
    externalId: string;
    rawPayload: Record<string, unknown>;
    hash: string;
    jobRawId: string;
  },
) {
  const normalized = normalizeJob({
    externalId: args.externalId,
    title: String(args.rawPayload.title ?? ""),
    company: String(args.rawPayload.company ?? ""),
    location: args.rawPayload.location
      ? String(args.rawPayload.location)
      : undefined,
    description: String(args.rawPayload.description ?? ""),
    applicationUrl: args.rawPayload.applicationUrl
      ? String(args.rawPayload.applicationUrl)
      : undefined,
    postedAt: args.rawPayload.postedAt
      ? String(args.rawPayload.postedAt)
      : undefined,
    workMode: args.rawPayload.workMode as never,
    employmentType: args.rawPayload.employmentType as never,
    seniority: args.rawPayload.seniority as never,
    salaryMin:
      typeof args.rawPayload.salaryMin === "number"
        ? args.rawPayload.salaryMin
        : undefined,
    salaryMax:
      typeof args.rawPayload.salaryMax === "number"
        ? args.rawPayload.salaryMax
        : undefined,
    salaryCurrency: args.rawPayload.salaryCurrency
      ? String(args.rawPayload.salaryCurrency)
      : undefined,
    requiredSkills: Array.isArray(args.rawPayload.requiredSkills)
      ? (args.rawPayload.requiredSkills as string[])
      : undefined,
    preferredSkills: Array.isArray(args.rawPayload.preferredSkills)
      ? (args.rawPayload.preferredSkills as string[])
      : undefined,
    raw: args.rawPayload,
  });

  const existing = await tx.job.findUnique({
    where: { jobRawId: args.jobRawId },
    select: { id: true },
  });

  const jobData = {
    title: normalized.title,
    company: normalized.company,
    location: normalized.location,
    workMode: normalized.workMode,
    employmentType: normalized.employmentType,
    seniority: normalized.seniority,
    salaryMin: normalized.salaryMin,
    salaryMax: normalized.salaryMax,
    salaryCurrency: normalized.salaryCurrency,
    description: normalized.description,
    experienceRequirements: normalized.experienceRequirements,
    educationRequirements: normalized.educationRequirements,
    applicationUrl: normalized.applicationUrl,
    source: args.source,
    freshness: freshnessFor(normalized.postedAt),
    postedAt: normalized.postedAt,
    normalizedAt: new Date(),
    status: "ACTIVE",
  };

  const job = existing
    ? await tx.job.update({
        where: { id: existing.id },
        data: jobData,
      })
    : await tx.job.create({
        data: {
          ...jobData,
          jobRawId: args.jobRawId,
        },
      });

  await tx.jobSkill.deleteMany({ where: { jobId: job.id } });

  for (const mention of normalized.skills) {
    const skill = await findOrCreateSkill(tx, mention.name);
    if (!skill) continue;
    await tx.jobSkill.upsert({
      where: {
        jobId_skillId_importance: {
          jobId: job.id,
          skillId: skill.id,
          importance: mention.importance,
        },
      },
      create: {
        jobId: job.id,
        skillId: skill.id,
        importance: mention.importance,
        rawMention: mention.rawMention,
        confidence: mention.confidence,
      },
      update: {
        rawMention: mention.rawMention,
        confidence: mention.confidence,
      },
    });
  }

  return { jobId: job.id, created: !existing };
}

export async function ingestFromAdapter(
  adapter: JobSourceAdapter,
): Promise<IngestResult> {
  const result: IngestResult = {
    source: adapter.sourceName,
    fetched: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    staleMarked: 0,
    failed: 0,
    errors: [],
  };

  const jobs = await adapter.fetchJobs();
  result.fetched = jobs.length;
  const seenExternalIds = new Set<string>();

  for (const raw of jobs) {
    seenExternalIds.add(raw.externalId);
    try {
      const rawPayload = {
        ...raw.raw,
        externalId: raw.externalId,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        description: raw.description,
        applicationUrl: raw.applicationUrl,
        postedAt: raw.postedAt,
        workMode: raw.workMode,
        employmentType: raw.employmentType,
        seniority: raw.seniority,
        salaryMin: raw.salaryMin,
        salaryMax: raw.salaryMax,
        salaryCurrency: raw.salaryCurrency,
        requiredSkills: raw.requiredSkills,
        preferredSkills: raw.preferredSkills,
      };
      const hash = contentHash(rawPayload);

      await prisma.$transaction(async (tx) => {
        const existingRaw = await tx.jobRaw.findUnique({
          where: {
            source_externalId: {
              source: adapter.sourceName,
              externalId: raw.externalId,
            },
          },
        });

        if (existingRaw && existingRaw.contentHash === hash) {
          // Touch fetchedAt so freshness hygiene knows the listing is still live.
          await tx.jobRaw.update({
            where: { id: existingRaw.id },
            data: { fetchedAt: new Date() },
          });
          if (existingRaw) {
            await tx.job.updateMany({
              where: { jobRawId: existingRaw.id },
              data: {
                freshness: freshnessFor(
                  raw.postedAt ? new Date(raw.postedAt) : null,
                ),
                status: "ACTIVE",
              },
            });
          }
          result.unchanged += 1;
          return;
        }

        const jobRaw = existingRaw
          ? await tx.jobRaw.update({
              where: { id: existingRaw.id },
              data: {
                rawPayload,
                contentHash: hash,
                fetchedAt: new Date(),
              },
            })
          : await tx.jobRaw.create({
              data: {
                source: adapter.sourceName,
                externalId: raw.externalId,
                rawPayload,
                contentHash: hash,
              },
            });

        const upserted = await upsertNormalizedJob(tx, {
          source: adapter.sourceName,
          externalId: raw.externalId,
          rawPayload,
          hash,
          jobRawId: jobRaw.id,
        });

        if (upserted.created) result.created += 1;
        else result.updated += 1;
      });
    } catch (error) {
      result.failed += 1;
      result.errors.push(
        `${raw.externalId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  // Listings from this source that were not in the latest fetch → STALE.
  if (seenExternalIds.size > 0) {
    const liveRaws = await prisma.jobRaw.findMany({
      where: {
        source: adapter.sourceName,
        externalId: { in: [...seenExternalIds] },
      },
      select: { id: true },
    });
    const liveRawIds = liveRaws.map((r) => r.id);
    const stale = await prisma.job.updateMany({
      where: {
        source: adapter.sourceName,
        status: "ACTIVE",
        OR: [
          { jobRawId: null },
          ...(liveRawIds.length
            ? [{ jobRawId: { notIn: liveRawIds } }]
            : []),
        ],
      },
      data: { freshness: JobFreshness.STALE },
    });
    result.staleMarked = stale.count;
  }

  return result;
}

export async function ingestSeedJobs(): Promise<IngestResult> {
  return ingestFromAdapter(new SeedJobAdapter());
}
