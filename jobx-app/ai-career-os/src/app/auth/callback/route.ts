import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/modules/auth/user-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/onboarding";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_missing_code", url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        url.origin,
      ),
    );
  }

  try {
    const user = await ensureAppUser();
    if (user?.profile?.onboardingStatus === "COMPLETED" && next === "/onboarding") {
      return NextResponse.redirect(new URL("/app", url.origin));
    }
  } catch {
    // DB may be offline — still allow the OAuth session through.
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
