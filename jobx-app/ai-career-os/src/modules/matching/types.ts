/**
 * Match scorer version contract.
 * Scores are computed in deterministic code only (Milestone 5).
 */

export const MATCH_SCORER_VERSION = "v1" as const;

export type MatchDimensionScores = {
  skills: number;
  experience: number;
  education: number;
  location: number;
  evidence: number;
};

export type MatchScoreResult = {
  scorerVersion: typeof MATCH_SCORER_VERSION;
  overall: number;
  dimensions: MatchDimensionScores;
  breakdown: Record<string, unknown>;
  explanation: string;
};

/** Placeholder weights — finalized with the scorer in Milestone 5. */
export const MATCH_WEIGHTS_V1 = {
  skills: 0.4,
  experience: 0.2,
  education: 0.1,
  location: 0.1,
  evidence: 0.2,
} as const;
