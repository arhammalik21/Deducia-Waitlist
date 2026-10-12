import { GapPriority, GapType } from "@prisma/client";
import { prisma } from "@/lib/db";

export type MatchGapSignal = {
  jobId: string;
  overall: number;
  missingRequired: Array<{ skillId: string; name: string }>;
  weakSkills: string[];
};

/**
 * Rebuild OPEN diagnostic gaps from the latest match run.
 * Aggregates skill demand across jobs; keeps one row per skill gap type.
 */
export async function diagnoseGapsFromMatches(
  userId: string,
  args: {
    targetRoleTitle: string | null;
    userSkillNames: string[];
    matchRows: MatchGapSignal[];
  },
): Promise<number> {
  // Clear prior system-generated open gaps for a clean rebuild
  await prisma.skillGap.deleteMany({
    where: {
      userId,
      status: "OPEN",
    },
  });

  const skillDemand = new Map<
    string,
    { skillId: string; name: string; jobIds: Set<string> }
  >();

  const evidenceWeak = new Map<string, Set<string>>();

  for (const row of args.matchRows) {
    // Focus on jobs that are otherwise somewhat viable
    if (row.overall < 0.25) continue;

    for (const miss of row.missingRequired) {
      const key = miss.skillId;
      const entry = skillDemand.get(key) ?? {
        skillId: miss.skillId,
        name: miss.name,
        jobIds: new Set<string>(),
      };
      entry.jobIds.add(row.jobId);
      skillDemand.set(key, entry);
    }

    for (const weak of row.weakSkills) {
      const set = evidenceWeak.get(weak) ?? new Set<string>();
      set.add(row.jobId);
      evidenceWeak.set(weak, set);
    }
  }

  let created = 0;
  const creates: Parameters<typeof prisma.skillGap.create>[0]["data"][] = [];

  const sortedSkills = [...skillDemand.values()].sort(
    (a, b) => b.jobIds.size - a.jobIds.size,
  );

  for (const skill of sortedSkills.slice(0, 25)) {
    const count = skill.jobIds.size;
    const priority =
      count >= 4
        ? GapPriority.HIGH
        : count >= 2
          ? GapPriority.MEDIUM
          : GapPriority.LOW;

    creates.push({
      userId,
      skillId: skill.skillId,
      jobId: [...skill.jobIds][0],
      gapType: GapType.SKILL,
      title: `Build ${skill.name}`,
      description: `${count} matched opportunity${count === 1 ? "" : "ies"} list ${skill.name} as required, and it is missing from your Career Graph.`,
      whyItMatters: `Closing this skill gap increases fit on ${count} active role${count === 1 ? "" : "s"} in your feed.`,
      priority,
      relatedJobCount: count,
      suggestedAction: `Add a project, course outcome, or work evidence that demonstrates ${skill.name}, then rebuild your Career Graph.`,
      status: "OPEN",
    });
  }

  for (const [name, jobIds] of evidenceWeak) {
    if (jobIds.size === 0) continue;
    const skill = await prisma.skill.findFirst({
      where: { canonicalName: { equals: name, mode: "insensitive" } },
    });
    creates.push({
      userId,
      skillId: skill?.id ?? null,
      jobId: [...jobIds][0],
      gapType: GapType.EVIDENCE,
      title: `Prove ${name}`,
      description: `You list ${name}, but opportunities that need it do not see supporting evidence on your graph.`,
      whyItMatters:
        "Evidence strength is scored separately from claimed skills — unverified skills lower match confidence.",
      priority: jobIds.size >= 3 ? GapPriority.HIGH : GapPriority.MEDIUM,
      relatedJobCount: jobIds.size,
      suggestedAction: `Link a project, certification, or experience bullet that clearly demonstrates ${name}.`,
      status: "OPEN",
    });
  }

  if (args.targetRoleTitle) {
    const top = [...args.matchRows].sort((a, b) => b.overall - a.overall)[0];
    const strongCount = args.matchRows.filter((m) => m.overall >= 0.55).length;
    if (strongCount === 0) {
      creates.push({
        userId,
        skillId: null,
        jobId: top?.jobId ?? null,
        gapType: GapType.POSITIONING,
        title: `Reposition toward ${args.targetRoleTitle}`,
        description: `No active opportunities currently score ≥55% for your profile against the target “${args.targetRoleTitle}”.`,
        whyItMatters:
          "Positioning gaps often mean title/seniority/skills framing — not only missing tools.",
        priority: GapPriority.HIGH,
        relatedJobCount: args.matchRows.length,
        suggestedAction:
          "Tighten your target title, highlight transferable evidence, or close the highest-demand skill gaps first.",
        status: "OPEN",
      });
    } else if (args.userSkillNames.length < 3) {
      creates.push({
        userId,
        skillId: null,
        jobId: top?.jobId ?? null,
        gapType: GapType.POSITIONING,
        title: "Thin skill graph for your target",
        description:
          "Your Career Graph has few skills extracted, which limits match confidence even when roles look relevant.",
        whyItMatters:
          "Matching quality depends on a populated skill and evidence graph from your resume.",
        priority: GapPriority.MEDIUM,
        relatedJobCount: strongCount,
        suggestedAction:
          "Rebuild the Career Graph from your resume (or add skills manually later) so matches can differentiate.",
        status: "OPEN",
      });
    }
  }

  for (const data of creates) {
    await prisma.skillGap.create({ data });
    created += 1;
  }

  return created;
}

export async function listGapsForUser(userId: string) {
  return prisma.skillGap.findMany({
    where: { userId, status: "OPEN" },
    include: {
      skill: true,
      job: { select: { id: true, title: true, company: true } },
    },
    orderBy: [{ priority: "asc" }, { relatedJobCount: "desc" }],
  });
}

/** Prisma orders enums alphabetically by default for priority — map explicitly. */
export function gapPriorityRank(priority: GapPriority) {
  if (priority === GapPriority.HIGH) return 0;
  if (priority === GapPriority.MEDIUM) return 1;
  return 2;
}
