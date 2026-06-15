import { Budget } from "../budget.ts";
import type { Capability } from "../capability.ts";

/**
 * Budget enforcement as a capability: a GATE that refuses a model call which
 * would cross the session ceiling (enforcement, not just observability - the
 * wedge), plus accounting that publishes a `budget` event after every change so
 * the UI and the audit log can react. Wraps the unchanged Budget class.
 */
export const budgetCapability: Capability = {
  name: "budget",
  async setup(ctx) {
    const budget = new Budget(
      ctx.config.budget.maxTokensPerSession,
      ctx.config.budget.compactAtTokens,
    );

    // Refuse BEFORE spending (called via kernel.guard before each model call).
    ctx.registerGate((req) => {
      if (req.kind === "model_call" && typeof req.text === "string") {
        budget.guard(req.text);
      }
    });

    // Account tokens as they are actually consumed, then publish status.
    ctx.bus.on(async (event) => {
      if (event.kind === "user_input") {
        budget.add((event.data as { input: string }).input);
      } else if (event.kind === "assistant_reply") {
        budget.add((event.data as { text: string }).text);
      } else {
        return;
      }
      await ctx.bus.emit("budget", budget.status());
    });

    await ctx.bus.emit("budget", budget.status()); // initial status
  },
};
