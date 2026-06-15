import type { Message } from "./capability.ts";
import type { Kernel } from "./kernel.ts";

/**
 * One turn of the agent loop, expressed on the kernel:
 *   guard (gates, incl. budget) -> emit user_input -> runtime.complete
 *   -> emit assistant_reply
 *
 * Every step that spends or acts goes through the kernel, so budget enforcement
 * and the audit trail are automatic.
 *
 * NEXT STEP: the Pi runtime (pi-runtime capability) will own the real
 * tool-calling loop (model -> tool calls -> execute via registered tools -> feed
 * results back -> repeat). The guard + emit wrappers stay around each model call,
 * so enforcement + audit hold no matter how many round-trips a task takes.
 */
export async function runTurn(
  kernel: Kernel,
  input: string,
  history: Message[],
): Promise<string> {
  // Enforce gates BEFORE spending anything (the budget veto lives here).
  await kernel.guard({ kind: "model_call", text: input });
  await kernel.bus.emit("user_input", { input });
  history.push({ role: "user", content: input });

  const result = await kernel.getRuntime().complete({
    system: "You are rho, a personal coding agent.",
    messages: history,
  });

  history.push({ role: "assistant", content: result.text });
  await kernel.bus.emit("assistant_reply", { text: result.text });
  return result.text;
}
