import type { ApplyAssistDraftJson, ApplyAssistPack } from "@/modules/apply-assist/types";

export function parseApplyAssistJson(raw: string): ApplyAssistPack | null {
  try {
    const parsed = JSON.parse(raw) as ApplyAssistDraftJson;
    const coverLetter = String(parsed.coverLetter ?? "").trim();
    const talkingPoints = Array.isArray(parsed.talkingPoints)
      ? parsed.talkingPoints.map((p) => String(p).trim()).filter(Boolean).join("\n")
      : String(parsed.talkingPoints ?? "").trim();
    const emailSubject = String(parsed.emailSubject ?? "").trim();
    const emailBody = String(parsed.emailBody ?? "").trim();

    if (!coverLetter || !talkingPoints || !emailSubject || !emailBody) {
      return null;
    }

    return { coverLetter, talkingPoints, emailSubject, emailBody };
  } catch {
    return null;
  }
}

export function buildHeuristicApplyAssist(input: {
  fullName: string;
  targetRole: string | null;
  jobTitle: string;
  company: string;
  location: string | null;
  matchScore: number | null;
  overlapHave: string[];
  overlapMissing: string[];
  resumeSnippet: string;
}): ApplyAssistPack {
  const name = input.fullName || "Candidate";
  const role = input.targetRole || input.jobTitle;
  const scorePct =
    input.matchScore != null ? `${Math.round(input.matchScore * 100)}%` : null;

  const strengths =
    input.overlapHave.length > 0
      ? input.overlapHave.slice(0, 6).join(", ")
      : "relevant experience from my resume";

  const gaps =
    input.overlapMissing.length > 0
      ? input.overlapMissing.slice(0, 4).join(", ")
      : "a few stretch areas I am actively closing";

  const coverLetter = [
    `Dear ${input.company} Hiring Team,`,
    "",
    `I am writing to apply for the ${input.jobTitle} role${input.location ? ` in ${input.location}` : ""}. I am targeting ${role} opportunities and believe my background is a strong fit${scorePct ? ` (JobX match ${scorePct})` : ""}.`,
    "",
    `My strongest overlapping skills for this role include ${strengths}. I can quickly contribute while continuing to close gaps around ${gaps}.`,
    "",
    input.resumeSnippet
      ? `From my resume: ${input.resumeSnippet.slice(0, 280).replace(/\s+/g, " ").trim()}…`
      : "I would welcome the chance to share how my recent work maps to your requirements.",
    "",
    "Thank you for your consideration.",
    "",
    `Sincerely,\n${name}`,
  ].join("\n");

  const talkingPoints = [
    `• Pitch: ${name} for ${input.jobTitle} at ${input.company}`,
    `• Strengths to lead with: ${strengths}`,
    `• Gaps to address honestly: ${gaps}`,
    scorePct ? `• Match signal: ${scorePct} overall JobMatch` : "• Match signal: not scored yet",
    "• Ask: walk through one project that proves the top required skill",
  ].join("\n");

  const emailSubject = `Application pack: ${input.jobTitle} at ${input.company}`;
  const emailBody = [
    `Your JobX apply pack for ${input.jobTitle} at ${input.company}.`,
    "",
    "— Cover letter —",
    coverLetter,
    "",
    "— Talking points —",
    talkingPoints,
  ].join("\n");

  return { coverLetter, talkingPoints, emailSubject, emailBody };
}

export function selectTopMatches<T extends { overallScore: number }>(
  matches: T[],
  threshold: number,
  limit: number,
): T[] {
  return [...matches]
    .filter((m) => m.overallScore >= threshold)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
