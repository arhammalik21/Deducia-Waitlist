"use server";

import { revalidatePath } from "next/cache";
import {
  rebuildCareerGraphFromResume,
  requireCareerUser,
} from "@/modules/career-graph/service";

export type RebuildGraphState = {
  error?: string;
  success?: string;
};

export async function rebuildCareerGraphAction(
  _prev: RebuildGraphState,
  _formData: FormData,
): Promise<RebuildGraphState> {
  const user = await requireCareerUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await rebuildCareerGraphFromResume(user.id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/graph");
  revalidatePath("/app/target-role");
  revalidatePath("/app");

  const parts = Object.entries(result.counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}`);

  return {
    success: `Career Graph rebuilt (${result.source})${
      parts.length ? `: ${parts.join(", ")}` : ""
    }.${result.warning ? ` ${result.warning}` : ""}`,
  };
}
