"use server";

import { revalidatePath } from "next/cache";
import {
  requireMatchingUser,
  runMatchingForUser,
} from "@/modules/matching/service";

export type RematchState = {
  error?: string;
  success?: string;
};

export async function rematchAction(
  _prev: RematchState,
  _formData: FormData,
): Promise<RematchState> {
  const user = await requireMatchingUser();
  if (!user) return { error: "You must be signed in." };

  try {
    const result = await runMatchingForUser(user.id);
    revalidatePath("/app/jobs");
    revalidatePath("/app/gaps");
    revalidatePath("/app");

    return {
      success: `Scored ${result.scored} jobs (${result.scorerVersion}) and opened ${result.gapsCreated} gaps.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not run matching. Try again.",
    };
  }
}
