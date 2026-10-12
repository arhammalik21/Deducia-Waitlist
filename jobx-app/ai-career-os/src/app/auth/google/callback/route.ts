import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";
import { issueSessionForGoogleProfile } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/modules/auth/user-service";

function redirectWithError(requestUrl: string, message: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl),
  );
}

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return redirectWithError(
      request.url,
      "Google OAuth is not configured in .env",
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectWithError(
      request.url,
      `Google denied sign-in (${oauthError})`,
    );
  }

  if (!code || !state) {
    return redirectWithError(request.url, "Missing Google OAuth code.");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  const nextCookie = cookieStore.get("google_oauth_next")?.value;
  const next =
    nextCookie && nextCookie.startsWith("/") ? nextCookie : "/onboarding";

  if (!expectedState || expectedState !== state) {
    return redirectWithError(request.url, "Invalid OAuth state. Try again.");
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(tokens.access_token);

    if (!profile.email_verified) {
      return redirectWithError(
        request.url,
        "Google email is not verified. Use a verified Google account.",
      );
    }

    const sessionIssue = await issueSessionForGoogleProfile(profile);
    if (!sessionIssue.ok) {
      return redirectWithError(request.url, sessionIssue.error);
    }

    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: sessionIssue.tokenHash,
    });

    if (otpError) {
      return redirectWithError(request.url, otpError.message);
    }

    try {
      const user = await ensureAppUser();
      if (
        user?.profile?.onboardingStatus === "COMPLETED" &&
        next === "/onboarding"
      ) {
        const response = NextResponse.redirect(new URL("/app", url.origin));
        clearOAuthCookies(response);
        return response;
      }
    } catch {
      // DB may be offline — still complete OAuth login.
    }

    const response = NextResponse.redirect(new URL(next, url.origin));
    clearOAuthCookies(response);
    return response;
  } catch (error) {
    return redirectWithError(
      request.url,
      error instanceof Error ? error.message : "Google sign-in failed.",
    );
  }
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  response.cookies.set("google_oauth_next", "", { path: "/", maxAge: 0 });
}
