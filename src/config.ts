import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Provider = "anthropic" | "openai" | "google" | "local";

export interface RhoConfig {
  provider: Provider;
  model: string;
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
  model: "claude-opus-4-8",
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
