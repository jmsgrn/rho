import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Provider = "anthropic" | "openai" | "google" | "local";

export interface RhoConfig {
  provider: Provider;
  model: string;
  /**
   * Capabilities to load at startup, in order. The kernel has no built-in
   * behavior - budget, audit, tools, and the runtime are ALL capabilities.
   * Drop one to disable it; add your own (later: from `.rho/capabilities/`).
   */
  capabilities: string[];
  budget: {
    /** Hard ceiling - rho refuses a request that would exceed this. */
    maxTokensPerSession: number;
    /** Soft threshold - rho suggests compaction once usage crosses this. */
    compactAtTokens: number;
  };
  audit: {
    enabled: boolean;
    /** Append-only JSONL log path, relative to cwd. */
    path: string;
  };
}

export const defaultConfig: RhoConfig = {
  provider: "anthropic",
  // Model id must exist in pi-ai's registry for the chosen provider. pi-ai
  // 0.73.1's newest Opus is claude-opus-4-7 (bump pi-ai for newer). Override in
  // rho.config.json, or switch to "stub-runtime" to run with no model at all.
  model: "claude-opus-4-5",
  capabilities: ["audit", "budget", "core-tools", "pi-runtime"],
  budget: { maxTokensPerSession: 200_000, compactAtTokens: 150_000 },
  audit: { enabled: true, path: ".rho/audit.jsonl" },
};

/** Load ./rho.config.json (if present) merged over the defaults. */
export async function loadConfig(cwd = process.cwd()): Promise<RhoConfig> {
  try {
    const raw = await readFile(join(cwd, "rho.config.json"), "utf8");
    const user = JSON.parse(raw) as Partial<RhoConfig>;
    return {
      ...defaultConfig,
      ...user,
      budget: { ...defaultConfig.budget, ...user.budget },
      audit: { ...defaultConfig.audit, ...user.audit },
    };
  } catch {
    return defaultConfig;
  }
}
