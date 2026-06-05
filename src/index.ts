#!/usr/bin/env bun
import * as readline from "node:readline/promises";
import { runTurn } from "./agent.ts";
import { AuditLog } from "./audit.ts";
import { Budget, BudgetExceededError } from "./budget.ts";
import { loadConfig } from "./config.ts";
import type { Message } from "./providers.ts";

const BANNER = `rho - personal coding agent (v0.1 scaffold)
':help' for commands, ':quit' to exit
`;

async function main(): Promise<void> {
  const config = await loadConfig();
  const audit = new AuditLog(config.audit.path, config.audit.enabled);
  const budget = new Budget(
    config.budget.maxTokensPerSession,
    config.budget.compactAtTokens,
  );
  const history: Message[] = [];

  await audit.record("session_start", { config });
  process.stdout.write(BANNER);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt("rho› ");
  rl.prompt();

  // `for await` over the interface handles both an interactive TTY and piped
  // input (ends cleanly on EOF), unlike awaiting question() in a loop.
  for await (const raw of rl) {
    const line = raw.trim();
    if (line === ":quit" || line === ":q") break;
    if (!line) {
      rl.prompt();
      continue;
    }
    if (line === ":help") {
      console.log(":budget   show token budget\n:quit     exit");
      rl.prompt();
      continue;
    }
    if (line === ":budget") {
      console.log(budget.status());
      rl.prompt();
      continue;
    }

    try {
      const { reply } = await runTurn(line, { config, budget, audit, history });
      console.log(reply);
      const s = budget.status();
      console.log(`  [budget ${s.used}/${s.max}${s.shouldCompact ? " · COMPACT SUGGESTED" : ""}]`);
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        console.error(`✋ ${err.message}`);
        await audit.record("budget_blocked", { message: err.message });
      } else {
        console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    rl.prompt();
  }

  rl.close();
  await audit.record("session_end", { budget: budget.status() });
}

await main();
