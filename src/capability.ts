import type { RhoConfig } from "./config.ts";
import type { EventBus } from "./events.ts";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system: string;
  messages: Message[];
}

export interface CompletionResult {
  text: string;
  /** Real provider token usage, when the runtime reports it (the stub doesn't). */
  usage?: { input: number; output: number; totalTokens: number };
}

/**
 * A backend that actually produces model output. Pi today; Claude Code / Codex
 * adapters later - the kernel never changes, you just register another runtime.
 * Registering more than one is how rho becomes "encompassing."
 */
export interface Runtime {
  name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

/** A callable the agent can invoke. */
export interface Tool {
  name: string;
  description: string;
  run(input: string): Promise<string>;
}

/**
 * A pending action a gate may inspect and veto (throw to halt). The budget gate
 * uses this to refuse a model call BEFORE it spends anything - rho's wedge.
 */
export interface GateRequest {
  kind: string;
  /** Text payload to weigh (e.g. the prompt, for budget estimation). */
  text?: string;
  data?: unknown;
}

export type Gate = (req: GateRequest) => void | Promise<void>;

/**
 * What a capability receives at setup: the bus, the config, and the only
 * extension points there are. A capability wires itself in through these.
 */
export interface CapabilityContext {
  config: RhoConfig;
  bus: EventBus;
  registerTool(tool: Tool): void;
  registerGate(gate: Gate): void;
  registerRuntime(runtime: Runtime): void;
}

/**
 * The ONE extension unit. Budget, audit, tools, the Pi runtime - every behavior
 * in rho is a capability registered against the kernel at startup (and, later,
 * hot-loaded at runtime). The kernel owns only the bus + the registries; it has
 * no built-in features. That is the "self-extending from the core" bar - the
 * thing a managed platform can't retrofit without becoming one.
 */
export interface Capability {
  name: string;
  setup(ctx: CapabilityContext): void | Promise<void>;
}
