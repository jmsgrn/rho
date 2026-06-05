import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface AuditEvent {
  ts: string;
  kind: string;
  data?: unknown;
}

/**
 * Append-only structured audit log: every prompt, tool call, and budget event
 * lands here as one JSON object per line - replayable and reviewable. This is a
 * first-class concern in rho, not an afterthought (the air-gapped/regulated use
 * case needs a defensible record of everything the agent did).
 */
export class AuditLog {
  constructor(
    private readonly path: string,
    private readonly enabled: boolean,
  ) {}

  async record(kind: string, data?: unknown): Promise<void> {
    if (!this.enabled) return;
    const event: AuditEvent = { ts: new Date().toISOString(), kind, data };
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, `${JSON.stringify(event)}\n`, "utf8");
  }
}
