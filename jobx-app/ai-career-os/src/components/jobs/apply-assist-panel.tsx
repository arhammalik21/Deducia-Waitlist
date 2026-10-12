"use client";

import { useActionState } from "react";
import {
  emailApplyAssistAction,
  generateApplyAssistAction,
  type ApplyAssistActionState,
} from "@/modules/apply-assist/actions";

export type ApplyAssistSnapshot = {
  id: string;
  coverLetter: string;
  talkingPoints: string;
  emailSubject: string;
  emailedAt: string | null;
  createdAt: string;
} | null;

const initial: ApplyAssistActionState = {};

export function ApplyAssistPanel({
  jobId,
  userEmail,
  initialAssist,
}: {
  jobId: string;
  userEmail: string;
  initialAssist: ApplyAssistSnapshot;
}) {
  const [genState, genAction, genPending] = useActionState(
    generateApplyAssistAction,
    initial,
  );
  const [mailState, mailAction, mailPending] = useActionState(
    emailApplyAssistAction,
    initial,
  );

  const message = genState.message || mailState.message;
  const error = genState.error || mailState.error;
  const hasDraft = Boolean(initialAssist);

  return (
    <section className="panel mt-8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Apply Assist
          </p>
          <h2 className="mt-2 font-display text-[26px] tracking-tight text-white">
            Resume + AI for this job
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Generate a cover letter and talking points from your resume and
            match score, then email the pack to {userEmail}.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <form action={genAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <button
            type="submit"
            disabled={genPending || mailPending}
            className="btn-primary disabled:opacity-60"
          >
            {genPending ? "Generating…" : hasDraft ? "Regenerate pack" : "Generate pack"}
          </button>
        </form>
        <form action={mailAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <button
            type="submit"
            disabled={genPending || mailPending}
            className="btn-ghost disabled:opacity-60"
          >
            {mailPending ? "Sending…" : "Email me this pack"}
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-[var(--trust-text)]">{message}</p>
      ) : null}

      {initialAssist ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Cover letter
              </p>
              {initialAssist.emailedAt ? (
                <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--trust-text)]">
                  Emailed {new Date(initialAssist.emailedAt).toLocaleString()}
                </span>
              ) : (
                <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
                  Draft only
                </span>
              )}
            </div>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#d6d4d5]">
              {initialAssist.coverLetter}
            </pre>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Talking points
            </p>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#d6d4d5]">
              {initialAssist.talkingPoints}
            </pre>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[var(--muted)]">
          No pack yet. Generate one to preview here, then email it to yourself.
        </p>
      )}
    </section>
  );
}
