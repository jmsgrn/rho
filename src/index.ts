#!/usr/bin/env bun
import * as readline from "node:readline/promises";
import { runTurn } from "./agent.ts";
import { BudgetExceededError, type BudgetStatus } from "./budget.ts";
import { builtins } from "./capabilities/index.ts";
import type { Message } from "./capability.ts";
import { loadConfig } from "./config.ts";
import { Kernel } from "./kernel.ts";

const BANNER = `rho - self-extending coding agent (v0.2 kernel)
':help' for commands, ':quit' to exit
`;

async function main(): Promise<void> {
  const config = await loadConfig();
  const kernel = new Kernel(config);
  const history: Message[] = [];

  // Display state, fed by the bus - budget is just another capability now.
  let budget: BudgetStatus | undefined;
  kernel.bus.on((event) => {
    if (event.kind === "budget") budget = event.data as BudgetStatus;
  });

  // config selects which capabilities load; the kernel itself does nothing.
  const selected = config.capabilities.map((name) => {
    const capability = builtins[name];
    if (!capability) throw new Error(`unknown capability: ${name}`);
    return capability;
  });
  await kernel.load(selected);

  await kernel.bus.emit("session_start", { config });
  process.stdout.write(BANNER);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt("rho› ");
  rl.prompt();

  // `for await` handles both an interactive TTY and piped input (ends on EOF).
  for await (const raw of rl) {
    const line = raw.trim();
    if (line === ":quit" || line === ":q") break;
    if (!line) {
      rl.prompt();
      continue;
    }
    if (line === ":help") {
      console.log(":caps     list loaded capabilities\n:budget   show token budget\n:quit     exit");
      rl.prompt();
      continue;
    }
    if (line === ":caps") {
      console.log(config.capabilities.join(", "));
      rl.prompt();
      continue;
    }
    if (line === ":budget") {
      console.log(
        budget
          ? `${budget.used}/${budget.max} (remaining ${budget.remaining})${budget.shouldCompact ? " · COMPACT SUGGESTED" : ""}`
          : "budget capability not loaded",
      );
      rl.prompt();
      continue;
    }

    try {
      const reply = await runTurn(kernel, line, history);
      console.log(reply);
      if (budget) {
        console.log(`  [budget ${budget.used}/${budget.max}${budget.shouldCompact ? " · COMPACT SUGGESTED" : ""}]`);
      }
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        console.error(`✋ ${err.message}`);
        await kernel.bus.emit("budget_blocked", { message: err.message });
      } else {
        console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    rl.prompt();
  }

  rl.close();
  await kernel.bus.emit("session_end", { budget });
}

await main();
