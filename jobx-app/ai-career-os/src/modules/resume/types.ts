export type ExperienceLevelValue =
  | "INTERN"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "LEAD"
  | "EXECUTIVE"
  | "";

export type OnboardingDraft = {
  fullName: string;
  targetRole: string;
  geography: string;
  industry: string;
  experienceLevel: ExperienceLevelValue;
  workPreference: string;
  salaryMin: string;
  salaryMax: string;
  timeHorizon: string;
};

export type FieldKey = keyof OnboardingDraft;
