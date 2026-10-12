"use client";

import { useActionState } from "react";
import {
  ingestSeedJobsAction,
  type IngestJobsState,
} from "@/modules/jobs/actions";

const initial: IngestJobsState = {};

export function IngestJobsButton({
  label = "Load opportunity feed",
}: {
  label?: string;
}) {
  const [state, action, pending] = useActionState(
    ingestSeedJobsAction,
    initial,
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-60"
        >
          {pending ? "Ingesting…" : label}
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
