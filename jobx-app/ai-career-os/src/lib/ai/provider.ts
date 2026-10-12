/**
 * AI provider abstraction.
 * Numeric match scores must NEVER come from the LLM — only explanations.
 * Implemented fully in Milestone 2+ (extraction / explanation / plans).
 */

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiCompletionRequest = {
  purpose: string;
  messages: AiMessage[];
  model?: "default" | "strong";
  temperature?: number;
  promptVersion?: string;
  /** When true, request JSON object output from compatible providers. */
  json?: boolean;
};

export type AiCompletionResult = {
  content: string;
  model: string;
  promptVersion?: string;
  tokenIn?: number;
  tokenOut?: number;
  latencyMs: number;
};

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export class NotConfiguredAiProvider implements AiProvider {
  async complete(): Promise<AiCompletionResult> {
    throw new Error(
      "AI provider is not configured. Set AI_API_KEY in your environment.",
    );
  }
}
