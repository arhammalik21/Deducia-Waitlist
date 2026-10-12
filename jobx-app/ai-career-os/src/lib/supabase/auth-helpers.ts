import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GoogleProfile } from "@/lib/google-oauth";

export function isAuthRateLimitError(message: string) {
  return /rate limit|over_email_send_rate_limit/i.test(message);
}

function getServiceRoleAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || serviceKey.includes("your-")) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function friendlyAuthError(message: string) {
  if (isAuthRateLimitError(message)) {
    return "Too many signup emails were sent. Wait a few minutes and try again, or log in if you already created an account. For local development, disable Confirm email in Supabase Auth settings.";
  }
  if (/already registered|already been registered|user already exists/i.test(message)) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirm your email before logging in, or disable Confirm email in Supabase for local development.";
  }
  return message;
}

/**
 * Dev-only: create a confirmed user without sending email (requires service role key).
 */
export async function createConfirmedUserWithoutEmail(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  const admin = getServiceRoleAdmin();
  if (!admin) {
    return { ok: false as const, reason: "missing_service_role" as const };
  }

  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: input.fullName ? { full_name: input.fullName } : undefined,
  });

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return { ok: true as const, existed: true as const };
    }
    return { ok: false as const, reason: "create_failed" as const, message: error.message };
  }

  return { ok: true as const, existed: false as const };
}

/**
 * Create / update a Supabase user from a Google profile, then return a
 * token_hash the browser client can verify into a real session.
 * Uses the service role — does NOT require the Supabase Google provider.
 */
export async function issueSessionForGoogleProfile(profile: GoogleProfile): Promise<
  | { ok: true; tokenHash: string }
  | { ok: false; error: string }
> {
  const admin = getServiceRoleAdmin();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required for Google sign-in (add it to .env).",
    };
  }

  const email = profile.email.trim().toLowerCase();
  const metadata = {
    full_name: profile.name || email.split("@")[0],
    name: profile.name || undefined,
    avatar_url: profile.picture || undefined,
    provider: "google",
    google_sub: profile.sub,
    email_verified: profile.email_verified,
  };

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (createError && !/already|registered|exists/i.test(createError.message)) {
    return { ok: false, error: createError.message };
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData.properties?.hashed_token) {
    return {
      ok: false,
      error: linkError?.message || "Could not create a sign-in session.",
    };
  }

  return { ok: true, tokenHash: linkData.properties.hashed_token };
}
