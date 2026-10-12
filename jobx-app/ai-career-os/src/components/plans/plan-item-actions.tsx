"use client";

import { useActionState } from "react";
import {
  updatePlanItemAction,
  type PlanItemState,
} from "@/modules/plans/actions";

const initial: PlanItemState = {};

export function PlanItemActions({
  itemId,
  status,
}: {
  itemId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(updatePlanItemAction, initial);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "IN_PROGRESS" && status !== "COMPLETED" ? (
          <form action={action}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <button
              type="submit"
              disabled={pending}
              className="btn-ghost disabled:opacity-60"
            >
              Start
            </button>
          </form>
        ) : null}
        {status !== "COMPLETED" ? (
          <form action={action}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="status" value="COMPLETED" />
            <button
              type="submit"
              disabled={pending}
              className="btn-primary disabled:opacity-60"
            >
              Mark done
            </button>
          </form>
        ) : null}
        {status === "COMPLETED" || status === "IN_PROGRESS" ? (
          <form action={action}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="status" value="PENDING" />
            <button
              type="submit"
              disabled={pending}
              className="btn-ghost disabled:opacity-60"
            >
              Reset
            </button>
          </form>
        ) : null}
        {status !== "DISMISSED" && status !== "COMPLETED" ? (
          <form action={action}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="status" value="DISMISSED" />
            <button
              type="submit"
              disabled={pending}
              className="text-sm text-[var(--muted)] hover:text-white disabled:opacity-60"
            >
              Dismiss
            </button>
          </form>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      ) : null}
    </div>
  );
}
