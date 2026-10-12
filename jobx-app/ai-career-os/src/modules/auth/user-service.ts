import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

function toDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /Authentication failed|Can't reach database|P1000|P1001|ECONNREFUSED|database server/i.test(
      message,
    )
  ) {
    return new DatabaseUnavailableError(
      "The app database is not reachable. Open Docker Desktop, run docker compose up -d, then npm run db:migrate. DATABASE_URL should use localhost:5433 with user/password career.",
    );
  }
  return error instanceof Error ? error : new Error(message);
}

/**
 * Ensures a local User + Profile row exists for the authenticated Supabase user.
 * Call after login/signup and from protected layouts.
 */
export async function ensureAppUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: { profile: true },
    });

    const metaName =
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      null;

    if (existing) {
      if (
        metaName &&
        (!existing.profile?.fullName ||
          existing.profile.fullName === existing.email.split("@")[0])
      ) {
        await prisma.profile.update({
          where: { userId: existing.id },
          data: { fullName: metaName },
        });
        return prisma.user.findUniqueOrThrow({
          where: { id: existing.id },
          include: { profile: true },
        });
      }
      return existing;
    }

    return await prisma.user.create({
      data: {
        supabaseAuthId: authUser.id,
        email: authUser.email,
        profile: {
          create: {
            fullName: metaName || authUser.email.split("@")[0],
            onboardingStatus: "NOT_STARTED",
          },
        },
      },
      include: { profile: true },
    });
  } catch (error) {
    throw toDbError(error);
  }
}

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: { profile: true },
    });
  } catch (error) {
    throw toDbError(error);
  }
}
