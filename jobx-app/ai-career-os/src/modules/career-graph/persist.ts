import type { Prisma, ProvenanceType } from "@prisma/client";
import type { CareerGraphExtract } from "@/modules/resume/career-extract";
import { findOrCreateSkill } from "@/modules/career-graph/skills";

function parseLooseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (/^\d{4}$/.test(v)) return new Date(`${v}-01-01T00:00:00.000Z`);
  if (/^\d{4}-\d{2}$/.test(v)) return new Date(`${v}-01T00:00:00.000Z`);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function clearUserCareerGraph(
  db: Prisma.TransactionClient,
  userId: string,
) {
  await db.evidenceSkill.deleteMany({
    where: { evidence: { userId } },
  });
  await db.projectSkill.deleteMany({
    where: { project: { userId } },
  });
  await db.evidence.deleteMany({ where: { userId } });
  await db.userSkill.deleteMany({ where: { userId } });
  await db.achievement.deleteMany({ where: { userId } });
  await db.certification.deleteMany({ where: { userId } });
  await db.project.deleteMany({ where: { userId } });
  await db.experience.deleteMany({ where: { userId } });
  await db.education.deleteMany({ where: { userId } });
}

export async function persistCareerGraph(
  db: Prisma.TransactionClient,
  userId: string,
  graph: CareerGraphExtract,
  options: {
    provenance: ProvenanceType;
    replace?: boolean;
  },
) {
  if (options.replace !== false) {
    await clearUserCareerGraph(db, userId);
  }

  const provenance = options.provenance;
  const confidence = provenance === "MODEL_PREDICTION" ? 0.75 : 0.45;
  const skillIds = new Map<string, string>();

  async function skillIdFor(name: string) {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    if (skillIds.has(key)) return skillIds.get(key)!;
    const skill = await findOrCreateSkill(db, name);
    if (!skill) return null;
    skillIds.set(key, skill.id);
    return skill.id;
  }

  for (const name of graph.skills ?? []) {
    const skillId = await skillIdFor(name);
    if (!skillId) continue;
    await db.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: {
        userId,
        skillId,
        provenance:
          provenance === "MODEL_PREDICTION"
            ? "INFERRED_SKILL"
            : "USER_CLAIM",
        confidence,
        sourceSpan: "skills",
      },
      update: {
        confidence,
        provenance:
          provenance === "MODEL_PREDICTION"
            ? "INFERRED_SKILL"
            : "USER_CLAIM",
      },
    });
  }

  for (const exp of graph.experiences ?? []) {
    if (!exp.company?.trim() || !exp.title?.trim()) continue;
    await db.experience.create({
      data: {
        userId,
        company: exp.company.trim().slice(0, 160),
        title: exp.title.trim().slice(0, 160),
        location: exp.location?.trim() || null,
        startDate: parseLooseDate(exp.startDate),
        endDate: parseLooseDate(exp.endDate),
        isCurrent: Boolean(exp.isCurrent),
        description: exp.description?.trim() || null,
        provenance,
        confidence,
        sourceSpan: `${exp.title} @ ${exp.company}`,
      },
    });

    const evidence = await db.evidence.create({
      data: {
        userId,
        type: "EXPERIENCE",
        title: `${exp.title} at ${exp.company}`,
        description: exp.description?.trim() || null,
        strength: exp.isCurrent ? 0.85 : 0.7,
        freshness: parseLooseDate(exp.endDate) ?? parseLooseDate(exp.startDate),
        verificationStatus: "UNVERIFIED",
        provenance,
        sourceSpan: `${exp.title} @ ${exp.company}`,
        metadata: {
          company: exp.company,
          title: exp.title,
          isCurrent: exp.isCurrent,
        },
      },
    });

    for (const name of exp.skills ?? []) {
      const skillId = await skillIdFor(name);
      if (!skillId) continue;
      await db.userSkill.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: {
          userId,
          skillId,
          provenance: "INFERRED_SKILL",
          confidence: confidence * 0.9,
          sourceSpan: `experience:${exp.company}`,
        },
        update: {},
      });
      await db.evidenceSkill.upsert({
        where: {
          evidenceId_skillId: { evidenceId: evidence.id, skillId },
        },
        create: { evidenceId: evidence.id, skillId },
        update: {},
      });
    }
  }

  for (const edu of graph.education ?? []) {
    if (!edu.institution?.trim()) continue;
    await db.education.create({
      data: {
        userId,
        institution: edu.institution.trim().slice(0, 160),
        degree: edu.degree?.trim() || null,
        fieldOfStudy: edu.fieldOfStudy?.trim() || null,
        startDate: parseLooseDate(edu.startDate),
        endDate: parseLooseDate(edu.endDate),
        description: edu.description?.trim() || null,
        provenance,
        confidence,
        sourceSpan: edu.institution,
      },
    });
  }

  for (const project of graph.projects ?? []) {
    if (!project.name?.trim()) continue;
    const techs = (project.technologies ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 24);

    const created = await db.project.create({
      data: {
        userId,
        name: project.name.trim().slice(0, 160),
        description: project.description?.trim() || null,
        url: project.url?.trim() || null,
        technologies: techs,
        provenance,
        confidence,
        sourceSpan: project.name,
      },
    });

    const evidence = await db.evidence.create({
      data: {
        userId,
        type: "PROJECT",
        title: project.name.trim().slice(0, 160),
        description: project.description?.trim() || null,
        sourceUrl: project.url?.trim() || null,
        strength: 0.65,
        verificationStatus: "UNVERIFIED",
        provenance,
        sourceSpan: project.name,
      },
    });

    for (const name of techs) {
      const skillId = await skillIdFor(name);
      if (!skillId) continue;
      await db.userSkill.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: {
          userId,
          skillId,
          provenance: "INFERRED_SKILL",
          confidence: confidence * 0.85,
          sourceSpan: `project:${project.name}`,
        },
        update: {},
      });
      await db.projectSkill.upsert({
        where: {
          projectId_skillId: { projectId: created.id, skillId },
        },
        create: { projectId: created.id, skillId },
        update: {},
      });
      await db.evidenceSkill.upsert({
        where: {
          evidenceId_skillId: { evidenceId: evidence.id, skillId },
        },
        create: { evidenceId: evidence.id, skillId },
        update: {},
      });
    }
  }

  for (const cert of graph.certifications ?? []) {
    if (!cert.name?.trim()) continue;
    await db.certification.create({
      data: {
        userId,
        name: cert.name.trim().slice(0, 160),
        issuer: cert.issuer?.trim() || null,
        issueDate: parseLooseDate(cert.issueDate),
        credentialUrl: cert.credentialUrl?.trim() || null,
        provenance,
        confidence,
        sourceSpan: cert.name,
      },
    });

    await db.evidence.create({
      data: {
        userId,
        type: "CERTIFICATION",
        title: cert.name.trim().slice(0, 160),
        description: cert.issuer ? `Issued by ${cert.issuer}` : null,
        sourceUrl: cert.credentialUrl?.trim() || null,
        strength: 0.8,
        freshness: parseLooseDate(cert.issueDate),
        verificationStatus: "UNVERIFIED",
        provenance,
        sourceSpan: cert.name,
      },
    });
  }

  for (const achievement of graph.achievements ?? []) {
    if (!achievement.title?.trim()) continue;
    await db.achievement.create({
      data: {
        userId,
        title: achievement.title.trim().slice(0, 160),
        description: achievement.description?.trim() || null,
        metric: achievement.metric?.trim() || null,
        provenance,
        confidence,
        sourceSpan: achievement.title,
      },
    });
  }

  return {
    skillCount: skillIds.size,
    experienceCount: (graph.experiences ?? []).length,
    educationCount: (graph.education ?? []).length,
    projectCount: (graph.projects ?? []).length,
  };
}
