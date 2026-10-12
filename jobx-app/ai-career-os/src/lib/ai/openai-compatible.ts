import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
} from "@/lib/ai/provider";

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly defaultModel: string,
    private readonly strongModel: string,
  ) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const model =
      request.model === "strong" ? this.strongModel : this.defaultModel;
    const started = Date.now();

    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: request.temperature ?? 0.1,
          messages: request.messages,
          ...(request.json
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `AI request failed (${response.status}): ${body.slice(0, 240) || response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    return {
      content,
      model: data.model ?? model,
      promptVersion: request.promptVersion,
      tokenIn: data.usage?.prompt_tokens,
      tokenOut: data.usage?.completion_tokens,
      latencyMs: Date.now() - started,
    };
  }
}
