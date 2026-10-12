import type { ProvenanceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/modules/auth/user-service";
import { persistCareerGraph } from "@/modules/career-graph/persist";
import { extractCareerGraph } from "@/modules/resume/career-extract";
import {
  parseResumeProfile,
  toOnboardingDraft,
} from "@/modules/resume/parse-profile";

export async function getCareerProfile(userId: string) {
  const [
    profile,
    experiences,
    education,
    projects,
    certifications,
    achievements,
    userSkills,
    evidence,
    primaryRole,
    latestResume,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.experience.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    }),
    prisma.education.findMany({
      where: { userId },
      orderBy: { endDate: "desc" },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        projectSkills: { include: { skill: true } },
      },
    }),
    prisma.certification.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" },
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.evidence.findMany({
      where: { userId },
      include: {
        evidenceSkills: { include: { skill: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.targetRole.findFirst({
      where: { userId, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resumeDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        parseStatus: true,
        extractedText: true,
      },
    }),
  ]);

  return {
    profile,
    experiences,
    education,
    projects,
    certifications,
    achievements,
    userSkills,
    evidence,
    primaryRole,
    latestResume,
    counts: {
      experiences: experiences.length,
      education: education.length,
      projects: projects.length,
      skills: userSkills.length,
      evidence: evidence.length,
      certifications: certifications.length,
    },
  };
}

export type GraphNode = {
  id: string;
  kind: "person" | "skill" | "experience" | "project" | "evidence" | "education";
  label: string;
  sublabel?: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "has_skill" | "supports" | "worked" | "built" | "studied";
};

export async function getCareerGraphView(userId: string) {
  const data = await getCareerProfile(userId);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const personId = `person:${userId}`;
  nodes.push({
    id: personId,
    kind: "person",
    label: data.profile?.fullName || "You",
    sublabel: data.primaryRole?.title || data.profile?.headline || undefined,
  });

  for (const us of data.userSkills.slice(0, 40)) {
    const id = `skill:${us.skillId}`;
    nodes.push({
      id,
      kind: "skill",
      label: us.skill.canonicalName,
      sublabel: us.skill.category || undefined,
    });
    edges.push({
      id: `has:${us.id}`,
      from: personId,
      to: id,
      kind: "has_skill",
    });
  }

  for (const exp of data.experiences.slice(0, 12)) {
    const id = `experience:${exp.id}`;
    nodes.push({
      id,
      kind: "experience",
      label: exp.title,
      sublabel: exp.company,
    });
    edges.push({
      id: `worked:${exp.id}`,
      from: personId,
      to: id,
      kind: "worked",
    });
  }

  for (const project of data.projects.slice(0, 12)) {
    const id = `project:${project.id}`;
    nodes.push({
      id,
      kind: "project",
      label: project.name,
      sublabel: project.technologies.slice(0, 3).join(", ") || undefined,
    });
    edges.push({
      id: `built:${project.id}`,
      from: personId,
      to: id,
      kind: "built",
    });

    for (const ps of project.projectSkills) {
      const skillNode = `skill:${ps.skillId}`;
      if (nodes.some((n) => n.id === skillNode)) {
        edges.push({
          id: `supports-project:${ps.id}`,
          from: id,
          to: skillNode,
          kind: "supports",
        });
      }
    }
  }

  for (const edu of data.education.slice(0, 8)) {
    const id = `education:${edu.id}`;
    nodes.push({
      id,
      kind: "education",
      label: edu.institution,
      sublabel: [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ") || undefined,
    });
    edges.push({
      id: `studied:${edu.id}`,
      from: personId,
      to: id,
      kind: "studied",
    });
  }

  for (const ev of data.evidence.slice(0, 20)) {
    const id = `evidence:${ev.id}`;
    // Skip duplicate experience/project titles already shown as nodes when possible
    if (
      (ev.type === "EXPERIENCE" &&
        data.experiences.some((e) => ev.title.includes(e.company))) ||
      (ev.type === "PROJECT" &&
        data.projects.some((p) => p.name === ev.title))
    ) {
      for (const es of ev.evidenceSkills) {
        const skillNode = `skill:${es.skillId}`;
        const source =
          ev.type === "PROJECT"
            ? data.projects.find((p) => p.name === ev.title)
            : null;
        const fromId = source
          ? `project:${source.id}`
          : data.experiences.find((e) => ev.title.includes(e.company))
            ? `experience:${data.experiences.find((e) => ev.title.includes(e.company))!.id}`
            : null;
        if (fromId && nodes.some((n) => n.id === skillNode)) {
          edges.push({
            id: `supports-ev:${es.id}`,
            from: fromId,
            to: skillNode,
            kind: "supports",
          });
        }
      }
      continue;
    }

    nodes.push({
      id,
      kind: "evidence",
      label: ev.title,
      sublabel: ev.type,
    });
    edges.push({
      id: `ev-link:${ev.id}`,
      from: personId,
      to: id,
      kind: "supports",
    });
    for (const es of ev.evidenceSkills) {
      const skillNode = `skill:${es.skillId}`;
      if (nodes.some((n) => n.id === skillNode)) {
        edges.push({
          id: `supports-ev:${es.id}`,
          from: id,
          to: skillNode,
          kind: "supports",
        });
      }
    }
  }

  return { ...data, nodes, edges };
}

export async function rebuildCareerGraphFromResume(userId: string): Promise<
  | { ok: true; warning?: string; source: "ai" | "heuristic"; counts: Record<string, number> }
  | { ok: false; error: string }
> {
  const resume = await prisma.resumeDocument.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!resume) {
    return {
      ok: false,
      error: "No resume on file. Upload one in onboarding first.",
    };
  }

  if (!resume.extractedText?.trim()) {
    return {
      ok: false,
      error:
        "Resume has no extractable text. Re-upload a PDF/DOCX/TXT with a text layer.",
    };
  }

  const extracted = await extractCareerGraph(resume.extractedText);
  const provenance: ProvenanceType =
    extracted.source === "ai" ? "MODEL_PREDICTION" : "USER_CLAIM";

  const counts = await prisma.$transaction(async (tx) => {
    const result = await persistCareerGraph(tx, userId, extracted.graph, {
      provenance,
      replace: true,
    });

    await tx.resumeDocument.update({
      where: { id: resume.id },
      data: {
        parseStatus: "PARSED",
        parseError: null,
        parsedPayload: {
          ...extracted.graph,
          source: extracted.source,
          warning: extracted.warning ?? null,
        },
      },
    });

    return result;
  });

  return {
    ok: true,
    warning: extracted.warning,
    source: extracted.source,
    counts: {
      skills: counts.skillCount,
      experiences: counts.experienceCount,
      education: counts.educationCount,
      projects: counts.projectCount,
    },
  };
}

/** Used during onboarding resume upload — also returns onboarding draft fields. */
export async function buildGraphFromText(
  userId: string,
  text: string,
  resumeDocumentId: string,
) {
  const extracted = await extractCareerGraph(text);
  const provenance: ProvenanceType =
    extracted.source === "ai" ? "MODEL_PREDICTION" : "USER_CLAIM";

  await prisma.$transaction(async (tx) => {
    await persistCareerGraph(tx, userId, extracted.graph, {
      provenance,
      replace: true,
    });
    await tx.resumeDocument.update({
      where: { id: resumeDocumentId },
      data: {
        parseStatus: text.trim() ? "PARSED" : "FAILED",
        parsedPayload: {
          ...extracted.graph,
          source: extracted.source,
          warning: extracted.warning ?? null,
        },
      },
    });
  });

  const onboardingBase = await parseResumeProfile(text);
  // Prefer richer graph fields for onboarding draft
  const draft = toOnboardingDraft(extracted.graph, {
    fullName: onboardingBase.profile.fullName ?? "",
  });

  return {
    ...extracted,
    draft,
    profile: extracted.graph,
  };
}

export async function getTargetRoleAnalysis(userId: string) {
  const [role, userSkills] = await Promise.all([
    prisma.targetRole.findFirst({
      where: { userId, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
  ]);

  const owned = new Set(
    userSkills.map((s) => s.skill.canonicalName.toLowerCase()),
  );

  // Lightweight role skill hints from title keywords until Milestone 5 matching
  const suggested = suggestSkillsForRole(role?.title ?? "");
  const have = suggested.filter((s) => owned.has(s.toLowerCase()));
  const missing = suggested.filter((s) => !owned.has(s.toLowerCase()));

  return {
    role,
    userSkills,
    suggested,
    have,
    missing,
  };
}

function suggestSkillsForRole(title: string): string[] {
  const t = title.toLowerCase();
  const base = ["Communication", "Problem Solving"];
  if (/front|react|ui/.test(t)) {
    return [...base, "JavaScript", "TypeScript", "React", "CSS", "HTML"];
  }
  if (/back|api|server/.test(t)) {
    return [...base, "TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Docker"];
  }
  if (/full/.test(t)) {
    return [
      ...base,
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "System Design",
    ];
  }
  if (/data|ml|ai/.test(t)) {
    return [...base, "Python", "SQL", "Machine Learning", "Pandas", "Statistics"];
  }
  if (/devops|sre|cloud/.test(t)) {
    return [...base, "AWS", "Docker", "Kubernetes", "CI/CD", "Linux"];
  }
  if (/product/.test(t)) {
    return [...base, "Roadmapping", "User Research", "Analytics", "SQL"];
  }
  return [...base, "Domain Knowledge", "Collaboration"];
}

export async function requireCareerUser() {
  const user = await ensureAppUser();
  if (!user) return null;
  return user;
}
