import { randomBytes } from "node:crypto";
import { getPublicAppUrl } from "@/lib/env.public";

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export function isGoogleOAuthConfigured() {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(id && secret && !id.includes("your-") && !secret.includes("your-"));
}

export function getGoogleRedirectUri() {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getPublicAppUrl().replace(/\/$/, "")}/auth/google/callback`;
}

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthorizeUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set in .env");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  id_token?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set in .env");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Google token exchange failed (${response.status}): ${text.slice(0, 240)}`,
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    id_token?: string;
  };

  if (!data.access_token) {
    throw new Error("Google token response missing access_token");
  }

  return {
    access_token: data.access_token,
    id_token: data.id_token,
  };
}

export async function fetchGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Google userinfo failed (${response.status}): ${text.slice(0, 240)}`,
    );
  }

  const data = (await response.json()) as GoogleProfile;
  if (!data.email) {
    throw new Error("Google account did not return an email address.");
  }

  return data;
}
