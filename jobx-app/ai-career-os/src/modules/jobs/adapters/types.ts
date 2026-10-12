/**
 * Job source adapter interface.
 * Seed/fixture source in Milestone 4; additional sources plug in here.
 */

export type RawJobPayload = {
  externalId: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  applicationUrl?: string;
  postedAt?: string;
  /** Optional hints the source already knows — normalizer may override. */
  workMode?: "REMOTE" | "HYBRID" | "ONSITE" | "FLEXIBLE";
  employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERNSHIP"
    | "TEMPORARY";
  seniority?: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  raw: Record<string, unknown>;
};

export interface JobSourceAdapter {
  readonly sourceName: string;
  fetchJobs(): Promise<RawJobPayload[]>;
}
