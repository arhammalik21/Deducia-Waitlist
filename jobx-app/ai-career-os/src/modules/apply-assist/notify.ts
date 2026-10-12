import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getLatestApplyAssist } from "@/modules/apply-assist/service";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function emailApplyAssistPack(userId: string, jobId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  let assist = await getLatestApplyAssist(userId, jobId);
  if (!assist) {
    throw new Error("Generate an apply pack before emailing.");
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  const text = [
    assist.emailBody,
    "",
    job?.applicationUrl ? `Application link: ${job.applicationUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
      <p>Your JobX apply pack for <strong>${escapeHtml(job?.title ?? "this role")}</strong>${job?.company ? ` at <strong>${escapeHtml(job.company)}</strong>` : ""}.</p>
      <h2>Cover letter</h2>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(assist.coverLetter)}</pre>
      <h2>Talking points</h2>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(assist.talkingPoints)}</pre>
      ${job?.applicationUrl ? `<p><a href="${escapeHtml(job.applicationUrl)}">Open application link</a></p>` : ""}
    </div>
  `;

  const result = await sendMail({
    to: user.email,
    subject: assist.emailSubject,
    text,
    html,
  });

  const status = result.ok
    ? result.provider === "local"
      ? "LOCAL"
      : "SENT"
    : "FAILED";

  const notification = await prisma.mailNotification.create({
    data: {
      userId,
      kind: "APPLY_ASSIST",
      toEmail: user.email,
      subject: assist.emailSubject,
      status,
      provider: result.provider,
      payload: {
        jobId,
        assistId: assist.id,
        mailId: result.id ?? null,
      } as Prisma.InputJsonValue,
      error: result.error ?? null,
    },
  });

  if (!result.ok) {
    return { ok: false as const, notification, error: result.error ?? "Send failed" };
  }

  assist = await prisma.applicationAssist.update({
    where: { id: assist.id },
    data: { emailedAt: new Date() },
  });

  return {
    ok: true as const,
    notification,
    assist,
    provider: result.provider,
  };
}
