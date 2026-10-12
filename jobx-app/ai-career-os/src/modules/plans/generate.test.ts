import { describe, expect, it } from "vitest";
import { buildPlanItems } from "@/modules/plans/generate";

describe("buildPlanItems", () => {
  it("ranks high-impact skill gaps ahead of low positioning gaps", () => {
    const items = buildPlanItems(
      [
        {
          id: "1",
          gapType: "POSITIONING",
          title: "Reposition",
          description: "Thin graph",
          whyItMatters: "Matters",
          suggestedAction: "Tighten title",
          priority: "LOW",
          relatedJobCount: 1,
          skillId: null,
          skillName: null,
        },
        {
          id: "2",
          gapType: "SKILL",
          title: "Build TypeScript",
          description: "Missing TS",
          whyItMatters: "Many jobs",
          suggestedAction: "Build a TypeScript API project",
          priority: "HIGH",
          relatedJobCount: 5,
          skillId: "s1",
          skillName: "TypeScript",
        },
      ],
      "Backend Engineer",
    );

    expect(items[0]?.title).toContain("TypeScript");
    expect(items[0]?.priority).toBe(1);
    expect(items[0]?.relatedJobCount).toBe(5);
  });
});
