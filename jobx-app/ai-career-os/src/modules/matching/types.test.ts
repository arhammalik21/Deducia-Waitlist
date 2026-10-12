import { describe, expect, it } from "vitest";
import { MATCH_SCORER_VERSION, MATCH_WEIGHTS_V1 } from "@/modules/matching/types";

describe("match scorer contract", () => {
  it("exposes a versioned scorer identity", () => {
    expect(MATCH_SCORER_VERSION).toBe("v1");
  });

  it("keeps dimension weights summing to 1", () => {
    const sum = Object.values(MATCH_WEIGHTS_V1).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
