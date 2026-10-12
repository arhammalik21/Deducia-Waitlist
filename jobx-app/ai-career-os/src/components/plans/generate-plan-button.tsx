"use client";

import { useActionState } from "react";
import {
  generatePlanAction,
  type GeneratePlanState,
} from "@/modules/plans/actions";

const initial: GeneratePlanState = {};

export function GeneratePlanButton({
  label = "Generate action plan",
}: {
  label?: string;
}) {
  const [state, action, pending] = useActionState(generatePlanAction, initial);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-60"
        >
          {pending ? "Generating…" : label}
        </button>
      </form>
      {state.error ? (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="max-w-xl text-sm text-[var(--trust-text)]">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
