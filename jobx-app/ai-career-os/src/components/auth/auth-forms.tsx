"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/modules/auth/actions";
import { GoogleContinueButton } from "@/components/auth/google-continue-button";

const initialState: AuthActionState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const googleNext = nextPath?.startsWith("/") ? nextPath : "/app";

  return (
    <div className="flex w-full flex-col gap-4">
      <GoogleContinueButton nextPath={googleNext} />
      <AuthDivider />
      <form action={formAction} className="flex w-full flex-col gap-4">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.error ? <ErrorText message={state.error} /> : null}
        <Submit pending={pending} label="Log in" />
        <p className="text-center text-sm text-[var(--muted)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-white hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <div className="flex w-full flex-col gap-4">
      <GoogleContinueButton nextPath="/onboarding" />
      <AuthDivider />
      <form action={formAction} className="flex w-full flex-col gap-4">
        <Field label="Full name" name="fullName" type="text" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters"
        />
        {state.error ? <ErrorText message={state.error} /> : null}
        {state.success ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--trust-text)]">
            Account created. Check your email to confirm, then{" "}
            <Link href="/login" className="font-medium text-white underline">
              log in
            </Link>
            .
          </p>
        ) : null}
        <Submit pending={pending} label="Create account" />
        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        or
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--trust-text)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="input-field"
      />
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-1 w-full disabled:opacity-60">
      {pending ? "Please wait…" : label}
    </button>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
      {message}
    </p>
  );
}
