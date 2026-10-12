import { describe, expect, it } from "vitest";
import { computeFeedRelevance } from "@/modules/jobs/relevance";

describe("computeFeedRelevance", () => {
  it("scores higher when required skills overlap", () => {
    const low = computeFeedRelevance({
      jobTitle: "Backend Engineer",
      jobSeniority: "MID",
      jobWorkMode: "REMOTE",
      jobLocation: "Remote",
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL"],
      preferredSkills: ["Docker"],
      userSkills: ["Python"],
      targetRoleTitle: "Backend Engineer",
      targetSeniority: "MID",
      userWorkPreference: "REMOTE",
      userGeography: null,
    });

    const high = computeFeedRelevance({
      jobTitle: "Backend Engineer",
      jobSeniority: "MID",
      jobWorkMode: "REMOTE",
      jobLocation: "Remote",
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL"],
      preferredSkills: ["Docker"],
      userSkills: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
      targetRoleTitle: "Backend Engineer",
      targetSeniority: "MID",
      userWorkPreference: "REMOTE",
      userGeography: null,
    });

    expect(high.score).toBeGreaterThan(low.score);
    expect(high.matchedRequired).toBe(3);
    expect(high.titleBoost).toBe(true);
  });
});
