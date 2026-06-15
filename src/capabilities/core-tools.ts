import type { Capability } from "../capability.ts";
import { tools } from "../tools.ts";

/**
 * Registers the built-in read/write/bash tools. They are a capability like any
 * other - drop or replace them by editing config.capabilities, or ship more
 * tools as a separate capability.
 */
export const coreToolsCapability: Capability = {
  name: "core-tools",
  setup(ctx) {
    for (const tool of Object.values(tools)) ctx.registerTool(tool);
  },
};
