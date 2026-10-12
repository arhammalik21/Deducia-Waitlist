"use server";

import { revalidatePath } from "next/cache";
import { ensureAppUser } from "@/modules/auth/user-service";
import { emailApplyAssistPack } from "@/modules/apply-assist/notify";
import {
  generateApplyAssist,
  getLatestApplyAssist,
} from "@/modules/apply-assist/service";

export type ApplyAssistActionState = {
  error?: string;
  ok?: boolean;
  usedAi?: boolean;
  provider?: string;
  message?: string;
};

export async function generateApplyAssistAction(
  _prev: ApplyAssistActionState,
  formData: FormData,
): Promise<ApplyAssistActionState> {
  const user = await ensureAppUser();
  if (!user) return { error: "Sign in required." };

  const jobId = String(formData.get("jobId") ?? "").trim();
  if (!jobId) return { error: "Missing job." };

  try {
    const { usedAi } = await generateApplyAssist(user.id, jobId);
    revalidatePath(`/app/jobs/${jobId}`);
    return {
      ok: true,
      usedAi,
      message: usedAi
        ? "Apply pack generated with AI from your resume."
        : "Apply pack generated from your resume and match data.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not generate apply pack.",
    };
  }
}

export async function emailApplyAssistAction(
  _prev: ApplyAssistActionState,
  formData: FormData,
): Promise<ApplyAssistActionState> {
  const user = await ensureAppUser();
  if (!user) return { error: "Sign in required." };

  const jobId = String(formData.get("jobId") ?? "").trim();
  if (!jobId) return { error: "Missing job." };

  try {
    let assist = await getLatestApplyAssist(user.id, jobId);
    if (!assist) {
      await generateApplyAssist(user.id, jobId);
    }

    const result = await emailApplyAssistPack(user.id, jobId);
    revalidatePath(`/app/jobs/${jobId}`);

    if (!result.ok) {
      return { error: result.error };
    }

    return {
      ok: true,
      provider: result.provider,
      message:
        result.provider === "local"
          ? `Pack saved and logged locally (mail keys not set). Check ${user.email} once Resend is configured.`
          : `Apply pack emailed to ${user.email}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not email apply pack.",
    };
  }
}
