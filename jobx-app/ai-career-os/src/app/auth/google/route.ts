import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizeUrl,
  createOAuthState,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent(
            "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
          ),
        request.url,
      ),
    );
  }

  const url = new URL(request.url);
  const nextParam = url.searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/onboarding";

  const state = createOAuthState();
  const authorizeUrl = buildGoogleAuthorizeUrl(state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("google_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
