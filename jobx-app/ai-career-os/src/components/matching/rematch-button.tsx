"use client";

import { useActionState } from "react";
import {
  rematchAction,
  type RematchState,
} from "@/modules/matching/actions";

const initial: RematchState = {};

export function RematchButton({
  label = "Run match scoring",
}: {
  label?: string;
}) {
  const [state, action, pending] = useActionState(rematchAction, initial);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-60"
        >
          {pending ? "Scoring…" : label}
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
