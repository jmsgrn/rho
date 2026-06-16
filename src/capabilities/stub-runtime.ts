import type { Capability, Runtime } from "../capability.ts";

/**
 * An offline stub runtime — no model, no API key, no network. Useful for
 * developing capabilities, CI, and demos, and as a live demonstration of the
 * capability swap: point config.capabilities at "stub-runtime" instead of
 * "pi-runtime" and everything else (budget, audit, tools) is unchanged.
 */
const stubRuntime: Runtime = {
  name: "stub",
  async complete(req) {
    const last = req.messages.at(-1)?.content ?? "";
    return { text: `(rho stub) no model wired — you said: "${last}"` };
  },
};

export const stubRuntimeCapability: Capability = {
  name: "stub-runtime",
  setup(ctx) {
    ctx.registerRuntime(stubRuntime);
  },
};
