import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import {
  selectTopMatches,
  startOfUtcDay,
} from "@/modules/apply-assist/generate";
import {
  MATCH_DIGEST_LIMIT,
  MATCH_DIGEST_THRESHOLD,
} from "@/modules/apply-assist/types";
import { MATCH_SCORER_VERSION } from "@/modules/matching/types";

export async function sendMatchDigestIfNeeded(userId: string): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { sent: false, reason: "user_missing" };

  const since = startOfUtcDay();
  const already = await prisma.mailNotification.findFirst({
    where: {
      userId,
      kind: "MATCH_DIGEST",
      status: { in: ["SENT", "LOCAL"] },
      createdAt: { gte: since },
    },
  });
  if (already) return { sent: false, reason: "already_sent_today" };

  const matches = await prisma.jobMatch.findMany({
    where: { userId, scorerVersion: MATCH_SCORER_VERSION },
    include: {
      job: { select: { id: true, title: true, company: true, location: true } },
    },
    orderBy: { overallScore: "desc" },
    take: 50,
  });

  const top = selectTopMatches(matches, MATCH_DIGEST_THRESHOLD, MATCH_DIGEST_LIMIT);
  if (top.length === 0) return { sent: false, reason: "no_qualifying_matches" };

  const lines = top.map(
    (m, i) =>
      `${i + 1}. ${m.job.title} @ ${m.job.company}${m.job.location ? ` (${m.job.location})` : ""} — ${Math.round(m.overallScore * 100)}%`,
  );

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const subject = `Your top ${top.length} job matches today`;
  const text = [
    "JobX found strong fits based on your resume and profile:",
    "",
    ...lines,
    "",
    `Open your feed: ${appUrl}/app/jobs`,
    "On any job, use Apply Assist for a cover letter + talking points emailed to you.",
  ].join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
      <p>JobX found strong fits based on your resume and profile:</p>
      <ol>${top
        .map(
          (m) =>
            `<li><a href="${appUrl}/app/jobs/${m.job.id}">${escapeHtml(m.job.title)}</a> at ${escapeHtml(m.job.company)} — <strong>${Math.round(m.overallScore * 100)}%</strong></li>`,
        )
        .join("")}</ol>
      <p><a href="${appUrl}/app/jobs">Open your job feed</a></p>
    </div>
  `;

  const result = await sendMail({
    to: user.email,
    subject,
    text,
    html,
  });

  const status = result.ok
    ? result.provider === "local"
      ? "LOCAL"
      : "SENT"
    : "FAILED";

  await prisma.mailNotification.create({
    data: {
      userId,
      kind: "MATCH_DIGEST",
      toEmail: user.email,
      subject,
      status,
      provider: result.provider,
      payload: {
        matchIds: top.map((m) => m.id),
        jobIds: top.map((m) => m.jobId),
        threshold: MATCH_DIGEST_THRESHOLD,
        mailId: result.id ?? null,
      } as Prisma.InputJsonValue,
      error: result.error ?? null,
    },
  });

  if (!result.ok) return { sent: false, reason: result.error ?? "send_failed" };
  return { sent: true };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
