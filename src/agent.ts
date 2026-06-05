import type { AuditLog } from "./audit.ts";
import type { Budget } from "./budget.ts";
import type { RhoConfig } from "./config.ts";
import { complete, type Message } from "./providers.ts";

export interface TurnContext {
  config: RhoConfig;
  budget: Budget;
  audit: AuditLog;
  history: Message[];
}

export interface Turn {
  reply: string;
}

/**
 * One turn of the agent loop. v0.1 flow:
 *   budget.guard()  ->  audit  ->  model call (stub)  ->  account tokens  -> audit
 *
 * NEXT STEP: replace the single `complete()` call with pi-agent-core's
 * tool-calling loop (LLM -> tool calls -> execute via tools.ts -> feed results
 * back -> repeat until done), keeping the `budget.guard()` + `audit.record()`
 * hooks wrapped around EACH model call. That keeps enforcement + audit intact
 * no matter how many tool round-trips a task takes.
 */
export async function runTurn(input: string, ctx: TurnContext): Promise<Turn> {
  const { config, budget, audit, history } = ctx;

  // Enforce the budget BEFORE spending anything (the differentiator).
  budget.guard(input);
  budget.add(input);
  await audit.record("user_input", { input, budget: budget.status() });

  history.push({ role: "user", content: input });

  const result = await complete(config, {
    system: "You are rho, a personal coding agent.",
    messages: history,
  });

  budget.add(result.text);
  history.push({ role: "assistant", content: result.text });
  await audit.record("assistant_reply", {
    tokens: budget.estimate(result.text),
    budget: budget.status(),
  });

  return { reply: result.text };
}
