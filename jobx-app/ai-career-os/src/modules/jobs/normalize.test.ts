import { describe, expect, it } from "vitest";
import { normalizeJob } from "@/modules/jobs/normalize";

describe("normalizeJob", () => {
  it("maps hints and extracts required vs preferred skills", () => {
    const job = normalizeJob({
      externalId: "t1",
      title: "Senior Backend Engineer",
      company: "Acme",
      location: "Remote — US",
      description: `Required:
- TypeScript and Node.js
- PostgreSQL

Nice to have:
- Docker
- AWS`,
      workMode: "REMOTE",
      seniority: "SENIOR",
      requiredSkills: ["TypeScript", "Node.js"],
      preferredSkills: ["Docker"],
      raw: {},
    });

    expect(job.seniority).toBe("SENIOR");
    expect(job.workMode).toBe("REMOTE");
    expect(job.skills.some((s) => s.name === "TypeScript" && s.importance === "REQUIRED")).toBe(
      true,
    );
    expect(job.skills.some((s) => s.name === "Docker" && s.importance === "PREFERRED")).toBe(
      true,
    );
  });

  it("infers contract employment and lead seniority from text", () => {
    const job = normalizeJob({
      externalId: "t2",
      title: "Lead React Developer",
      company: "Agency",
      description: "Contract role building React apps. Hourly billing.",
      raw: {},
    });

    expect(job.seniority).toBe("LEAD");
    expect(job.employmentType).toBe("CONTRACT");
  });
});
