import { describe, expect, it } from "vitest";
import { scoreJobMatch } from "@/modules/matching/scorer";

describe("scoreJobMatch", () => {
  it("scores higher when required skills and evidence align", () => {
    const weak = scoreJobMatch({
      job: {
        id: "j1",
        title: "Backend Engineer",
        location: "Remote",
        workMode: "REMOTE",
        seniority: "MID",
        educationRequirements: null,
        experienceRequirements: null,
      },
      jobSkills: [
        { skillId: "s1", name: "TypeScript", importance: "REQUIRED" },
        { skillId: "s2", name: "PostgreSQL", importance: "REQUIRED" },
      ],
      user: {
        geography: null,
        workPreference: "REMOTE",
        experienceLevel: "JUNIOR",
        educationCount: 0,
        experienceCount: 0,
        targetRoleTitle: "Backend Engineer",
      },
      userSkills: [],
    });

    const strong = scoreJobMatch({
      job: {
        id: "j1",
        title: "Backend Engineer",
        location: "Remote",
        workMode: "REMOTE",
        seniority: "MID",
        educationRequirements: null,
        experienceRequirements: null,
      },
      jobSkills: [
        { skillId: "s1", name: "TypeScript", importance: "REQUIRED" },
        { skillId: "s2", name: "PostgreSQL", importance: "REQUIRED" },
      ],
      user: {
        geography: "Remote",
        workPreference: "REMOTE",
        experienceLevel: "MID",
        educationCount: 1,
        experienceCount: 2,
        targetRoleTitle: "Backend Engineer",
      },
      userSkills: [
        { skillId: "s1", name: "TypeScript", hasEvidence: true },
        { skillId: "s2", name: "PostgreSQL", hasEvidence: true },
      ],
    });

    expect(strong.overall).toBeGreaterThan(weak.overall);
    expect(strong.dimensions.skills).toBeGreaterThanOrEqual(0.85);
    expect(strong.scorerVersion).toBe("v1");
  });

  it("never invents scores outside 0–1", () => {
    const result = scoreJobMatch({
      job: {
        id: "j2",
        title: "Lead",
        location: null,
        workMode: null,
        seniority: "LEAD",
        educationRequirements: "PhD required",
        experienceRequirements: "10+ years",
      },
      jobSkills: [],
      user: {
        geography: null,
        workPreference: null,
        experienceLevel: "INTERN",
        educationCount: 0,
        experienceCount: 0,
        targetRoleTitle: null,
      },
      userSkills: [],
    });

    for (const v of Object.values(result.dimensions)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(1);
  });
});
