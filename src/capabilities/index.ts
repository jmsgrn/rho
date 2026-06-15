import type { Capability } from "../capability.ts";
import { auditCapability } from "./audit.ts";
import { budgetCapability } from "./budget.ts";
import { coreToolsCapability } from "./core-tools.ts";
import { piRuntimeCapability } from "./pi-runtime.ts";

/**
 * Built-in capabilities, keyed by name. `config.capabilities` selects which load
 * and in what order (config selects, code defines). Later, code modules dropped
 * in `.rho/capabilities/` join this set at runtime - that is the self-extension.
 */
export const builtins: Record<string, Capability> = {
  audit: auditCapability,
  budget: budgetCapability,
  "core-tools": coreToolsCapability,
  "pi-runtime": piRuntimeCapability,
};
