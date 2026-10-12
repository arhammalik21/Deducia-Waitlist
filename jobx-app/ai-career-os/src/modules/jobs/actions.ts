"use server";

import { revalidatePath } from "next/cache";
import { runSeedIngest } from "@/modules/jobs/service";
import { ensureAppUser } from "@/modules/auth/user-service";

export type IngestJobsState = {
  error?: string;
  success?: string;
};

export async function ingestSeedJobsAction(
  _prev: IngestJobsState,
  _formData: FormData,
): Promise<IngestJobsState> {
  const user = await ensureAppUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  try {
    const result = await runSeedIngest();
    revalidatePath("/app/jobs");
    revalidatePath("/app");

    if (result.failed > 0 && result.created + result.updated === 0) {
      return {
        error: `Ingest failed for all jobs. ${result.errors[0] ?? ""}`,
      };
    }

    return {
      success: `Ingested from ${result.source}: ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged${
        result.staleMarked ? `, ${result.staleMarked} marked stale` : ""
      }${result.failed ? `, ${result.failed} failed` : ""}.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not ingest jobs. Check the database connection.",
    };
  }
}
