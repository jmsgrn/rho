import { completeSimple, getModels } from "@mariozechner/pi-ai";
import type { Message as PiMessage, Usage as PiUsage } from "@mariozechner/pi-ai";
import type { Capability, Runtime } from "../capability.ts";

const ZERO_USAGE: PiUsage = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

/**
 * The real Pi runtime: one completion via pi-ai's unified, multi-provider API
 * (Anthropic / OpenAI / Google). API keys are auto-detected from the environment
 * (ANTHROPIC_API_KEY, OPENAI_API_KEY, ...). Returns the assistant text plus the
 * provider's real token usage. No key / offline? Swap in the `stub-runtime`
 * capability via config.capabilities.
 *
 * NEXT: replace completeSimple with pi-agent-core's Agent so the model can call
 * rho's registered tools in a loop, and stream its events onto the bus.
 */
export const piRuntimeCapability: Capability = {
  name: "pi-runtime",
  setup(ctx) {
    const { provider, model: modelId } = ctx.config;
    if (provider === "local") {
      throw new Error(
        "pi-runtime: 'local' provider isn't wired yet (roadmap) — use a cloud provider or the stub-runtime capability.",
      );
    }

    // config.model is a runtime string, so resolve it from pi-ai's registry
    // (getModel() is keyed on literal model ids and won't take a plain string).
    const model = getModels(provider).find((m) => m.id === modelId);
    if (!model) {
      throw new Error(
        `pi-runtime: model "${modelId}" not in pi-ai's registry for provider "${provider}".`,
      );
    }

    const runtime: Runtime = {
      name: `pi:${provider}/${modelId}`,
      async complete(req) {
        // rho's neutral {role,content} history → pi-ai messages. Replayed
        // assistant turns are reconstructed as minimal text AssistantMessages.
        const messages: PiMessage[] = req.messages.map((m): PiMessage =>
          m.role === "user"
            ? { role: "user", content: m.content, timestamp: Date.now() }
            : {
                role: "assistant",
                content: [{ type: "text", text: m.content }],
                api: model.api,
                provider: model.provider,
                model: model.id,
                usage: ZERO_USAGE,
                stopReason: "stop",
                timestamp: Date.now(),
              },
        );

        const result = await completeSimple(model, {
          systemPrompt: req.system,
          messages,
        });

        const text = result.content
          .flatMap((block) => (block.type === "text" ? [block.text] : []))
          .join("");

        return {
          text,
          usage: {
            input: result.usage.input,
            output: result.usage.output,
            totalTokens: result.usage.totalTokens,
          },
        };
      },
    };

    ctx.registerRuntime(runtime);
  },
};
