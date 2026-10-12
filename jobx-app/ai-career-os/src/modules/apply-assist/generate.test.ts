import { describe, expect, it } from "vitest";
import {
  buildHeuristicApplyAssist,
  parseApplyAssistJson,
  selectTopMatches,
  startOfUtcDay,
} from "@/modules/apply-assist/generate";

describe("parseApplyAssistJson", () => {
  it("parses a complete JSON pack", () => {
    const pack = parseApplyAssistJson(
      JSON.stringify({
        coverLetter: "Dear hiring team…",
        talkingPoints: ["Point A", "Point B"],
        emailSubject: "Pack for Role",
        emailBody: "Body text",
      }),
    );
    expect(pack).toEqual({
      coverLetter: "Dear hiring team…",
      talkingPoints: "Point A\nPoint B",
      emailSubject: "Pack for Role",
      emailBody: "Body text",
    });
  });

  it("returns null when fields are missing", () => {
    expect(parseApplyAssistJson("{}")).toBeNull();
    expect(parseApplyAssistJson("not-json")).toBeNull();
  });
});

describe("buildHeuristicApplyAssist", () => {
  it("builds a usable pack without AI", () => {
    const pack = buildHeuristicApplyAssist({
      fullName: "Ada Lovelace",
      targetRole: "Software Engineer",
      jobTitle: "Backend Engineer",
      company: "Acme",
      location: "Remote",
      matchScore: 0.72,
      overlapHave: ["TypeScript", "PostgreSQL"],
      overlapMissing: ["Kubernetes"],
      resumeSnippet: "Built APIs in TypeScript.",
    });

    expect(pack.coverLetter).toContain("Backend Engineer");
    expect(pack.coverLetter).toContain("Acme");
    expect(pack.talkingPoints).toContain("TypeScript");
    expect(pack.emailSubject).toContain("Acme");
    expect(pack.emailBody).toContain("Cover letter");
  });
});

describe("selectTopMatches", () => {
  it("filters by threshold, sorts desc, and caps limit", () => {
    const top = selectTopMatches(
      [
        { id: "a", overallScore: 0.4 },
        { id: "b", overallScore: 0.9 },
        { id: "c", overallScore: 0.7 },
        { id: "d", overallScore: 0.55 },
        { id: "e", overallScore: 0.8 },
      ],
      0.55,
      3,
    );
    expect(top.map((m) => m.id)).toEqual(["b", "e", "c"]);
  });
});

describe("startOfUtcDay", () => {
  it("zeros time to UTC midnight", () => {
    const d = startOfUtcDay(new Date("2026-10-08T15:30:00.000Z"));
    expect(d.toISOString()).toBe("2026-10-08T00:00:00.000Z");
  });
});
