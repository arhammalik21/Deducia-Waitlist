import type { PrismaClient, Prisma } from "@prisma/client";

type SkillDb = PrismaClient | Prisma.TransactionClient;

export function normalizeSkillName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function skillKey(name: string): string {
  return normalizeSkillName(name).toLowerCase();
}

/**
 * Find or create a canonical Skill row. Uses exact canonicalName match,
 * then alias match, otherwise creates a new skill.
 */
export async function findOrCreateSkill(db: SkillDb, rawName: string) {
  const canonicalName = normalizeSkillName(rawName);
  if (!canonicalName) return null;

  const existing = await db.skill.findUnique({
    where: { canonicalName },
  });
  if (existing) return existing;

  const alias = await db.skillAlias.findUnique({
    where: { alias: skillKey(canonicalName) },
    include: { skill: true },
  });
  if (alias) return alias.skill;

  try {
    const skill = await db.skill.create({
      data: {
        canonicalName,
        category: guessCategory(canonicalName),
        aliases: {
          create: { alias: skillKey(canonicalName) },
        },
      },
    });
    return skill;
  } catch {
    // Race on unique — re-read
    return (
      (await db.skill.findUnique({ where: { canonicalName } })) ??
      (
        await db.skillAlias.findUnique({
          where: { alias: skillKey(canonicalName) },
          include: { skill: true },
        })
      )?.skill ??
      null
    );
  }
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (
    /python|javascript|typescript|java|go|rust|c\+\+|ruby|php|sql|kotlin|swift/.test(
      n,
    )
  ) {
    return "language";
  }
  if (/react|next|vue|angular|node|django|flask|spring|\.net|rails/.test(n)) {
    return "framework";
  }
  if (/aws|gcp|azure|docker|kubernetes|terraform|ci\/cd|devops/.test(n)) {
    return "platform";
  }
  if (/postgres|mysql|mongodb|redis|elasticsearch|dynamodb/.test(n)) {
    return "data";
  }
  if (/lead|manage|communicat|stakeholder|agile|scrum/.test(n)) {
    return "soft";
  }
  return "general";
}
