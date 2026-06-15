import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Capability } from "../capability.ts";

/**
 * Append-only JSONL of EVERY event on the bus - rho's first-class audit trail
 * (the regulated / air-gapped use case needs a defensible record of everything
 * the agent did). Generalized from the original audit.ts: it is now just a
 * subscriber on the bus, so nothing the agent does can skip the record.
 */
export const auditCapability: Capability = {
  name: "audit",
  async setup(ctx) {
    if (!ctx.config.audit.enabled) return;
    const path = ctx.config.audit.path;
    await mkdir(dirname(path), { recursive: true });
    ctx.bus.on(async (event) => {
      await appendFile(path, `${JSON.stringify(event)}\n`, "utf8");
    });
  },
};
