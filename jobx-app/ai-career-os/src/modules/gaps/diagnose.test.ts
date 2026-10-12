import { describe, expect, it } from "vitest";
import { gapPriorityRank } from "@/modules/gaps/diagnose";

describe("gapPriorityRank", () => {
  it("orders HIGH before MEDIUM before LOW", () => {
    expect(gapPriorityRank("HIGH")).toBeLessThan(gapPriorityRank("MEDIUM"));
    expect(gapPriorityRank("MEDIUM")).toBeLessThan(gapPriorityRank("LOW"));
  });
});
