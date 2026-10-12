"use client";

import { useActionState } from "react";
import {
  rebuildCareerGraphAction,
  type RebuildGraphState,
} from "@/modules/career-graph/actions";

const initial: RebuildGraphState = {};

export function RebuildGraphButton({
  label = "Rebuild from resume",
}: {
  label?: string;
}) {
  const [state, action, pending] = useActionState(
    rebuildCareerGraphAction,
    initial,
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button type="submit" disabled={pending} className="btn-ghost disabled:opacity-60">
          {pending ? "Building…" : label}
        </button>
      </form>
      {state.error ? (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="max-w-xl text-sm text-[var(--trust-text)]">{state.success}</p>
      ) : null}
    </div>
  );
}
