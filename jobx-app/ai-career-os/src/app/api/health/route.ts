import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database: "up" | "down" = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const ok = database === "up";

  return NextResponse.json(
    {
      ok,
      service: "jobx",
      milestone: 7,
      database,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
