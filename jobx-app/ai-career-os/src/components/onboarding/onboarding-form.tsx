"use client";

import { useActionState, useState } from "react";
import {
  parseResumeAction,
  saveOnboardingAction,
  type OnboardingActionState,
} from "@/modules/onboarding/actions";
import type { FieldKey, OnboardingDraft } from "@/modules/resume/types";

const WORK_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
  { value: "FLEXIBLE", label: "Flexible" },
] as const;

const LEVEL_OPTIONS = [
  { value: "INTERN", label: "Intern" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid-level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
  { value: "EXECUTIVE", label: "Executive" },
] as const;

const HORIZON_OPTIONS = [
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "12 months", label: "12 months" },
  { value: "2+ years", label: "2+ years" },
] as const;

const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: "Full name",
  targetRole: "Target role",
  geography: "Geography",
  industry: "Industry",
  experienceLevel: "Experience level",
  workPreference: "Work preference",
  salaryMin: "Salary min",
  salaryMax: "Salary max",
  timeHorizon: "Time horizon",
};

export function OnboardingForm({
  defaults,
}: {
  defaults?: {
    fullName?: string | null;
    targetRole?: string | null;
    geography?: string | null;
    workPreference?: string | null;
    experienceLevel?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    industry?: string | null;
    timeHorizon?: string | null;
  };
}) {
  const [manual, setManual] = useState(false);
  const [parseState, parseAction, parsePending] = useActionState(
    parseResumeAction,
    { step: "resume" } satisfies OnboardingActionState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveOnboardingAction,
    {} satisfies OnboardingActionState,
  );

  const reviewState =
    parseState.step === "review"
      ? parseState
      : saveState.step === "review"
        ? saveState
        : null;

  if (reviewState?.draft || (manual && !reviewState)) {
    const draft: OnboardingDraft =
      reviewState?.draft ??
      ({
        fullName: defaults?.fullName ?? "",
        targetRole: defaults?.targetRole ?? "",
        geography: defaults?.geography ?? "",
        industry: defaults?.industry ?? "",
        experienceLevel:
          (defaults?.experienceLevel as OnboardingDraft["experienceLevel"]) ??
          "",
        workPreference: defaults?.workPreference ?? "FLEXIBLE",
        salaryMin: defaults?.salaryMin?.toString() ?? "",
        salaryMax: defaults?.salaryMax?.toString() ?? "",
        timeHorizon: "6 months",
      } satisfies OnboardingDraft);

    const missing = new Set<FieldKey>(
      reviewState?.missing ??
        (["fullName", "targetRole", "geography", "experienceLevel", "workPreference"] as FieldKey[]).filter(
          (k) => !String(draft[k] ?? "").trim(),
        ),
    );

    return (
      <form action={saveAction} className="flex flex-col gap-6">
        {reviewState?.resumeDocumentId ? (
          <input
            type="hidden"
            name="resumeDocumentId"
            value={reviewState.resumeDocumentId}
          />
        ) : null}

        <section className="panel p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[26px] tracking-tight text-white">
                Review your details
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {reviewState?.fileName
                  ? `From ${reviewState.fileName}. Confirm what we found and fill anything missing.`
                  : "Enter the details we need to build your career profile."}
              </p>
            </div>
            {reviewState?.source ? (
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--trust-text)]">
                {reviewState.source === "ai" ? "AI extracted" : "Text extracted"}
              </span>
            ) : null}
          </div>

          {reviewState?.warning ? (
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--trust-text)]">
              {reviewState.warning}
            </p>
          ) : null}

          {missing.size > 0 ? (
            <p className="mt-4 text-sm text-[#f0c674]">
              Still needed:{" "}
              {[...missing].map((k) => FIELD_LABELS[k]).join(", ")}
            </p>
          ) : (
            <p className="mt-4 text-sm text-[var(--trust-text)]">
              We filled what we could. Preferences like work mode and salary
              still need a quick check.
            </p>
          )}

          {reviewState?.skills && reviewState.skills.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Skills detected
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--trust-text)]">
                {reviewState.skills.slice(0, 18).join(" · ")}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="fullName"
              required
              defaultValue={draft.fullName}
              missing={missing.has("fullName")}
              className="sm:col-span-2"
            />
            <Field
              label="Target role"
              name="targetRole"
              required
              placeholder="e.g. Backend Engineer"
              defaultValue={draft.targetRole}
              missing={missing.has("targetRole")}
              className="sm:col-span-2"
            />
            <Field
              label="Geography"
              name="geography"
              required
              placeholder="City, country, or region"
              defaultValue={draft.geography}
              missing={missing.has("geography")}
            />
            <Field
              label="Industry"
              name="industry"
              placeholder="e.g. Fintech, Healthcare"
              defaultValue={draft.industry}
              missing={missing.has("industry")}
            />
            <SelectField
              label="Work preference"
              name="workPreference"
              required
              options={WORK_OPTIONS}
              defaultValue={draft.workPreference || "FLEXIBLE"}
              missing={missing.has("workPreference")}
              hint="Usually not on a resume — choose what you want."
            />
            <SelectField
              label="Experience level"
              name="experienceLevel"
              required
              options={LEVEL_OPTIONS}
              defaultValue={draft.experienceLevel || ""}
              missing={missing.has("experienceLevel")}
              includeEmpty
            />
            <Field
              label="Salary min"
              name="salaryMin"
              type="number"
              placeholder="Optional"
              defaultValue={draft.salaryMin}
              hint="Optional preference"
            />
            <Field
              label="Salary max"
              name="salaryMax"
              type="number"
              placeholder="Optional"
              defaultValue={draft.salaryMax}
            />
            <SelectField
              label="Time horizon"
              name="timeHorizon"
              options={HORIZON_OPTIONS}
              defaultValue={draft.timeHorizon || "6 months"}
              className="sm:col-span-2"
              hint="How soon do you want to land this role?"
            />
          </div>
        </section>

        {saveState.error ? (
          <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
            {saveState.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="btn-primary disabled:opacity-60"
          >
            {savePending ? "Saving…" : "Save and continue"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setManual(false);
              window.location.reload();
            }}
          >
            Upload a different resume
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={parseAction} className="flex flex-col gap-6">
      <section className="panel p-6 sm:p-7">
        <h2 className="font-display text-[26px] tracking-tight text-white">
          Upload your resume
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          We&apos;ll extract your name, target role, location, and experience
          level, then ask only for what&apos;s missing.
        </p>
        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#d6d4d5]">Resume file</span>
          <input
            name="resume"
            type="file"
            required
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-sm file:font-medium file:text-black"
          />
          <span className="text-xs text-[var(--muted)]">
            PDF, DOCX, or TXT · max 8MB
          </span>
        </label>
      </section>

      {parseState.error ? (
        <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {parseState.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={parsePending}
          className="btn-primary disabled:opacity-60"
        >
          {parsePending ? "Reading resume…" : "Extract details"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setManual(true)}
        >
          Continue without resume
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  className,
  missing,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  missing?: boolean;
  hint?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-[#d6d4d5]">
        {label}
        {missing ? (
          <span className="rounded-full bg-[#f0c674]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f0c674]">
            Needed
          </span>
        ) : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`input-field ${missing ? "border-[#f0c674]/55" : ""}`}
      />
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
  defaultValue,
  className,
  missing,
  hint,
  includeEmpty,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
  className?: string;
  missing?: boolean;
  hint?: string;
  includeEmpty?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-[#d6d4d5]">
        {label}
        {missing ? (
          <span className="rounded-full bg-[#f0c674]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f0c674]">
            Needed
          </span>
        ) : null}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={`input-field ${missing ? "border-[#f0c674]/55" : ""}`}
      >
        {includeEmpty ? (
          <option value="" disabled>
            Select level
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}
