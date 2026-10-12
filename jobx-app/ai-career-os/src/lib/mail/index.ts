import { env } from "@/lib/env";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  ok: boolean;
  provider: "resend" | "local";
  id?: string;
  error?: string;
};

export function isMailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.MAIL_FROM?.trim());
}

/**
 * Send personal notification mail via Resend when configured.
 * Without keys, logs locally and reports success so product flows keep working.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const key = env.RESEND_API_KEY?.trim();
  const from = env.MAIL_FROM?.trim();

  if (!key || !from) {
    console.info("[mail:local]", {
      to: input.to,
      subject: input.subject,
      textPreview: input.text.slice(0, 240),
    });
    return { ok: true, provider: "local", id: `local_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        provider: "resend",
        error: `Resend ${response.status}: ${body.slice(0, 240) || response.statusText}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { ok: true, provider: "resend", id: data.id };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Mail send failed",
    };
  }
}
