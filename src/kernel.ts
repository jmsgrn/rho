import type {
  Capability,
  CapabilityContext,
  Gate,
  GateRequest,
  Runtime,
  Tool,
} from "./capability.ts";
import type { RhoConfig } from "./config.ts";
import { EventBus } from "./events.ts";

/**
 * The kernel: a bus, a tool registry, a gate chain, and one runtime slot - and
 * nothing else. Capabilities register into it via setup(); `guard()` runs the
 * gate chain (any gate may throw to halt the action) and `getRuntime()` returns
 * whatever a runtime-capability provided. No behavior lives here, on purpose.
 */
export class Kernel {
  readonly bus = new EventBus();
  readonly tools = new Map<string, Tool>();
  private readonly gates: Gate[] = [];
  private runtime?: Runtime;

  constructor(readonly config: RhoConfig) {}

  private context(): CapabilityContext {
    return {
      config: this.config,
      bus: this.bus,
      registerTool: (tool) => {
        this.tools.set(tool.name, tool);
      },
      registerGate: (gate) => {
        this.gates.push(gate);
      },
      registerRuntime: (runtime) => {
        this.runtime = runtime;
      },
    };
  }

  /** Load capabilities in order; each wires itself in through setup(). */
  async load(capabilities: Capability[]): Promise<void> {
    const ctx = this.context();
    for (const capability of capabilities) {
      await capability.setup(ctx);
      await this.bus.emit("capability_loaded", { name: capability.name });
    }
  }

  /** Run every gate against a pending action. A gate throws to veto it. */
  async guard(req: GateRequest): Promise<void> {
    for (const gate of this.gates) await gate(req);
  }

  /** The active runtime, or throw if no runtime capability was loaded. */
  getRuntime(): Runtime {
    if (!this.runtime) throw new Error("no runtime capability loaded");
    return this.runtime;
  }
}
