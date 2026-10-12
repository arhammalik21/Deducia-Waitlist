"use server";

import { PlanItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  generateActionPlan,
  requirePlanUser,
  updatePlanItemStatus,
} from "@/modules/plans/service";

export type GeneratePlanState = {
  error?: string;
  success?: string;
};

export async function generatePlanAction(
  _prev: GeneratePlanState,
  _formData: FormData,
): Promise<GeneratePlanState> {
  const user = await requirePlanUser();
  if (!user) return { error: "You must be signed in." };

  const result = await generateActionPlan(user.id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/plan");
  revalidatePath("/app");

  return {
    success:
      result.itemCount === 0
        ? "Plan refreshed — no open gaps to convert right now."
        : `Generated ${result.itemCount} prioritized action${result.itemCount === 1 ? "" : "s"}.`,
  };
}

export type PlanItemState = {
  error?: string;
};

export async function updatePlanItemAction(
  _prev: PlanItemState,
  formData: FormData,
): Promise<PlanItemState> {
  const user = await requirePlanUser();
  if (!user) return { error: "You must be signed in." };

  const itemId = String(formData.get("itemId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const allowed = new Set(Object.values(PlanItemStatus));
  if (!itemId || !allowed.has(statusRaw as PlanItemStatus)) {
    return { error: "Invalid plan item update." };
  }

  const result = await updatePlanItemStatus(
    user.id,
    itemId,
    statusRaw as PlanItemStatus,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/plan");
  revalidatePath("/app");
  return {};
}
