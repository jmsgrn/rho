# rho

A self-extending coding agent: **everything is a capability over an event bus.**
Budget-enforcing (hard token budgets, not just tracking) and fully auditable
(every action logged).

> Personal / learning build: ρ comes after [π](https://lucumr.pocoo.org/2026/1/31/pi/).
> Tailored to me, and an experiment in whether the harness *itself* can be hackable
> to the core - not a product.

## The idea

Most coding agents are a fixed app you live inside. rho is the opposite shape: a
tiny **kernel** that owns only an event stream and a few registries, and does
*nothing* on its own. Every behavior - the budget enforcer, the audit log, the
tools, the model runtime - is a **capability** registered against that kernel.

Two consequences fall out of that one decision:

- **Encompassing.** A *runtime* is just one kind of capability. Pi first; a Claude
  Code or Codex adapter next - the kernel never changes, you register another
  runtime. rho can wrap whatever's underneath.
- **Self-extending.** Because there are no built-in features - only capabilities -
  you extend rho the way you extend Pi: drop a capability in, and (later) let the
  agent author one at runtime. The openness is the architecture, not a plugin slot
  bolted onto a fixed core.

The two original contributions - **budget enforcement** and a **first-class audit
trail** - become the default governance capabilities, which is exactly what you
want the moment rho is driving more than one runtime.

## Status

**v0.2 - the kernel.** A runnable headless REPL on the capability kernel: audit,
budget, core-tools, and a *stub* runtime all load as capabilities and the
budget+audit pipeline works end to end. The real model runtime is the next step
(deliberately a guided TODO - that's the part worth building by hand).

## Quick start

```sh
bun run rho
# rho - self-extending coding agent (v0.2 kernel)
# rho› :caps
# audit, budget, core-tools, pi-runtime
# rho› hi
# (rho stub) no model wired yet...
#   [budget 28/200000]
# rho› :budget
# rho› :quit
```

Running the scaffold needs only Bun + Node built-ins. `bun install` is for
`bun run typecheck` and for once you start adding Pi.

## How it works

The kernel (`kernel.ts`) holds an `EventBus`, a tool registry, a gate chain, and
one runtime slot. Capabilities wire themselves in at startup via a single
interface:

```ts
interface Capability {
  name: string;
  setup(ctx: CapabilityContext): void | Promise<void>;
}
```

A capability has four things it can do through `ctx`, and nothing else:

- **provide tools** - callables the agent can invoke
- **provide a runtime** - an adapter that drives a backend agent (this is what
  makes rho "encompassing")
- **subscribe** - react to every event on the bus (the audit log; later, a TUI pane)
- **gate** - inspect a pending action and *throw to veto it* (the budget guard
  refuses a model call before it spends anything)

`config.capabilities` selects which load and in what order - *config selects, code
defines*. Disable budget by removing it from the list; add your own by dropping it
in the builtins registry (and, later, into `.rho/capabilities/`).

## Project layout

| path | role |
|---|---|
| `src/kernel.ts` | the kernel: bus + tool/gate/runtime registries; `load` / `guard` / `getRuntime`. No built-in behavior. |
| `src/events.ts` | the `EventBus` - rho's spine; everything emits onto one ordered stream |
| `src/capability.ts` | the `Capability` interface + `Tool` / `Runtime` / `Gate` types |
| `src/capabilities/audit.ts` | ★ append-only JSONL of **every** event (the audit trail) |
| `src/capabilities/budget.ts` | ★ budget **gate** + accounting (enforcement, not just observability) |
| `src/capabilities/core-tools.ts` | registers read / write / bash |
| `src/capabilities/pi-runtime.ts` | the model runtime - **stub today**, Pi next |
| `src/capabilities/index.ts` | the `builtins` registry |
| `src/budget.ts` / `src/tools.ts` | the Budget enforcer + tool implementations |
| `src/agent.ts` | one turn of the loop, expressed on the kernel |
| `src/index.ts` | the headless REPL |

The two ★ capabilities are the original contribution; the runtime leans on Pi.

## Roadmap

- [x] **v0.2 - the kernel.** EventBus + Capability + loader; audit / budget /
  core-tools / stub-runtime as capabilities; headless REPL.
- [ ] **v0.3 - real runtime.** Wrap `pi-ai` (multi-provider completion) +
  `pi-agent-core` (the tool-calling loop) behind the `pi-runtime` capability;
  swap budget's `chars/4` heuristic for a real tokenizer.
- [ ] **v0.4 - encompassing.** A second runtime adapter (e.g. Claude Code) loaded
  alongside Pi, plus an orchestration-policy capability to route / delegate.
- [ ] **v0.5 - self-extending.** Hot-load capabilities from `.rho/capabilities/`
  at runtime; let rho author its own capabilities (the budget/audit gates are what
  make that safe to allow).
- [ ] **v0.6 - visibility.** A TUI (OpenTUI / `pi-tui`) with live multi-pane, so
  subagents are observable rather than fire-and-forget.
- [ ] **later.** Local / air-gapped model provider; a capability lockfile +
  versioning; richer gates (human approval, secret redaction).

## Why it exists

Commercial agents don't tailor to one person, only *display* token budgets instead
of enforcing them, and run too much work out of sight. rho is the personal answer:
mine to shape down to the core, with budgets it actually halts on, a full audit
trail, no hidden work - and an architecture where adding the next idea is just
another capability.

## License

MIT
