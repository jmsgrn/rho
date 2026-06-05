# rho

A personal, tailored terminal coding agent - **budget-enforcing** (hard token
budgets, not just tracking) and **auditable** (every action logged).

> Personal / learning build. Tailored to me, not a product.

## Status

**v0.1 scaffold** - a runnable headless REPL that already demonstrates the
budget + audit pipeline with a *stub* model. The agent loop and the provider are
deliberately left as guided TODOs - that's the part worth building by hand.

## Run

```sh
bun run src/index.ts
# rho› hi
# (rho stub) no model wired yet...
# rho› :budget
# rho› :quit
```

No install needed to *run* the scaffold (Node built-ins + Bun only). `bun install`
is only for typecheck / once you start adding Pi.

## Architecture

| module | role | status |
|---|---|---|
| `src/config.ts` | tailored config: provider, model, budget, audit | done |
| `src/budget.ts` | token tracker **+ enforcer** (`guard()` before the call) | done — ★ differentiator |
| `src/audit.ts` | append-only JSONL log of every event | done — ★ differentiator |
| `src/tools.ts` | read / write / bash (extend me) | basic |
| `src/agent.ts` | the turn loop | stub — wire `pi-agent-core` |
| `src/providers.ts` | the model layer | stub — wrap `pi-ai` |
| `src/index.ts` | headless REPL | done |

The two ★ modules are the original contribution; everything else leans on Pi.

## Build path

1. Read Pi's `pi-agent-core` + `pi-coding-agent` source first (build with the grain).
2. `bun add @mariozechner/pi-ai @mariozechner/pi-agent-core` (verify names on npm).
3. Replace `providers.ts` stub with a real `pi-ai` call.
4. Replace `agent.ts`'s single call with `pi-agent-core`'s tool-calling loop,
   keeping `budget.guard()` + `audit.record()` hooks around each model call.
5. Swap `budget.ts`'s `chars/4` heuristic for a real tokenizer.
6. Add a TUI later (OpenTUI or `pi-tui`) - headless first.

## Why this exists

Commercial agents don't tailor to one person, don't *enforce* token budgets
(only display them), and run too much work out of sight. rho is the personal
answer: mine to shape, with budgets it enforces, a full audit trail, and no
hidden work.

## License

MIT
