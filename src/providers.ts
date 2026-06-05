import type { RhoConfig } from "./config.ts";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system: string;
  messages: Message[];
}

export interface CompletionResult {
  text: string;
}

/**
 * The model layer. v0.1 STUB.
 *
 * NEXT STEP: wrap `pi-ai` (@mariozechner/pi-ai), which already normalizes
 * Anthropic / OpenAI / Google / local models behind one interface - don't
 * re-implement provider quirks. Roughly:
 *
 *   import { complete as piComplete } from "@mariozechner/pi-ai";
 *   const res = await piComplete({ model: config.model, system, messages });
 *   return { text: res.text };
 */
export async function complete(
  _config: RhoConfig,
  req: CompletionRequest,
): Promise<CompletionResult> {
  const last = req.messages.at(-1)?.content ?? "";
  return {
    text:
      `(rho stub) no model wired yet - you said: "${last}"\n` +
      `→ next: implement providers.ts on top of pi-ai.`,
  };
}
