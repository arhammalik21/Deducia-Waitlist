import { env } from "@/lib/env";
import { OpenAiCompatibleProvider } from "@/lib/ai/openai-compatible";
import {
  NotConfiguredAiProvider,
  type AiProvider,
} from "@/lib/ai/provider";

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  const key = env.AI_API_KEY?.trim();
  if (!key) {
    cached = new NotConfiguredAiProvider();
    return cached;
  }

  cached = new OpenAiCompatibleProvider(
    env.AI_BASE_URL,
    key,
    env.AI_MODEL_DEFAULT,
    env.AI_MODEL_STRONG,
  );
  return cached;
}

export function isAiConfigured(): boolean {
  return Boolean(env.AI_API_KEY?.trim());
}
