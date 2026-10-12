"use server";

import { redirect } from "next/navigation";
import {
  completeOnboarding,
  uploadAndParseResume,
} from "@/modules/onboarding/service";
import type { FieldKey, OnboardingDraft } from "@/modules/resume/types";

export type OnboardingActionState = {
  error?: string;
  step?: "resume" | "review";
  resumeDocumentId?: string;
  fileName?: string;
  draft?: OnboardingDraft;
  missing?: FieldKey[];
  confirm?: FieldKey[];
  source?: "ai" | "heuristic";
  warning?: string;
  skills?: string[];
};

export async function parseResumeAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return {
      step: "resume",
      error: "Upload a resume (PDF, DOCX, or TXT) to continue.",
    };
  }

  const result = await uploadAndParseResume(resume);
  if (!result.ok) {
    return { step: "resume", error: result.error };
  }

  return {
    step: "review",
    resumeDocumentId: result.resumeDocumentId,
    fileName: result.fileName,
    draft: result.draft,
    missing: result.missing,
    confirm: result.confirm,
    source: result.source,
    warning: result.warning,
    skills: result.skills,
  };
}

export async function saveOnboardingAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const result = await completeOnboarding({
    fullName: String(formData.get("fullName") ?? ""),
    targetRole: String(formData.get("targetRole") ?? ""),
    geography: String(formData.get("geography") ?? ""),
    workPreference: String(formData.get("workPreference") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
    salaryMin: String(formData.get("salaryMin") ?? ""),
    salaryMax: String(formData.get("salaryMax") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    timeHorizon: String(formData.get("timeHorizon") ?? ""),
    resumeDocumentId: String(formData.get("resumeDocumentId") ?? "") || null,
  });

  if (!result.ok) {
    return {
      step: "review",
      error: result.error,
      resumeDocumentId: String(formData.get("resumeDocumentId") ?? "") || undefined,
      draft: {
        fullName: String(formData.get("fullName") ?? ""),
        targetRole: String(formData.get("targetRole") ?? ""),
        geography: String(formData.get("geography") ?? ""),
        industry: String(formData.get("industry") ?? ""),
        experienceLevel: String(formData.get("experienceLevel") ?? "") as OnboardingDraft["experienceLevel"],
        workPreference: String(formData.get("workPreference") ?? ""),
        salaryMin: String(formData.get("salaryMin") ?? ""),
        salaryMax: String(formData.get("salaryMax") ?? ""),
        timeHorizon: String(formData.get("timeHorizon") ?? ""),
      },
    };
  }

  redirect("/app");
}
