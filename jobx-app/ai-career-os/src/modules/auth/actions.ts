"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createConfirmedUserWithoutEmail,
  friendlyAuthError,
  isAuthRateLimitError,
} from "@/lib/supabase/auth-helpers";
import { ensureAppUser } from "@/modules/auth/user-service";
import { isSupabaseConfigured } from "@/lib/env.public";

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

async function completeAuthSession(nextPath: string) {
  try {
    await ensureAppUser();
  } catch {
    // DB may be offline during early setup — auth still succeeds.
  }
  redirect(nextPath.startsWith("/") ? nextPath : "/app");
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  // Local/dev: create a confirmed user without sending email when service role is available.
  // This avoids Supabase's free-tier email rate limit during development.
  if (process.env.NODE_ENV !== "production") {
    const created = await createConfirmedUserWithoutEmail({
      email,
      password,
      fullName: fullName || undefined,
    });

    if (created.ok) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError) {
        await completeAuthSession("/onboarding");
      }
      // Fall through to normal signUp if sign-in failed for an unexpected reason.
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || undefined },
    },
  });

  if (error) {
    if (isAuthRateLimitError(error.message)) {
      // Prior attempt may have created the account — try logging in.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError) {
        await completeAuthSession("/onboarding");
      }
    }

    return { error: friendlyAuthError(error.message) };
  }

  // Email confirmation enabled: no session yet.
  if (!data.session) {
    return {
      success: true,
      error: undefined,
    };
  }

  if (data.user) {
    await completeAuthSession("/onboarding");
  }

  redirect("/onboarding");
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  const next = String(formData.get("next") ?? "/app");
  await completeAuthSession(next);
  return {};
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
