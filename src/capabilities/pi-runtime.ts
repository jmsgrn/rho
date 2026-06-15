import type {
  Capability,
  CompletionRequest,
  CompletionResult,
  Runtime,
} from "../capability.ts";

/**
 * The first runtime capability. v0.1 STUB - no model wired yet.
 *
 * NEXT STEP: wrap `pi-ai` (@mariozechner/pi-ai) for real multi-provider
 * completion and `pi-agent-core` for the tool-calling loop. Budget enforcement +
 * the audit trail stay intact because the turn loop runs `kernel.guard()` and
 * emits onto the bus around each model call - no matter how many tool
 * round-trips a task takes. Adding a Claude Code / Codex adapter later is just
 * another Runtime; the kernel and every other capability stay unchanged. That is
 * the "encompassing" half of the thesis.
 */
const stubRuntime: Runtime = {
  name: "pi-stub",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const last = req.messages.at(-1)?.content ?? "";
    return {
      text:
        `(rho stub) no model wired yet - you said: "${last}"\n` +
        `→ next: implement the Pi runtime on top of pi-ai / pi-agent-core.`,
    };
  },
};

export const piRuntimeCapability: Capability = {
  name: "pi-runtime",
  setup(ctx) {
    ctx.registerRuntime(stubRuntime);
  },
};
