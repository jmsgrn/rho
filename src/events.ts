/**
 * The event bus is rho's spine: every runtime, tool, and (later) subagent emits
 * onto one ordered stream, and capabilities subscribe to it. The append-only
 * audit log is just the first subscriber; a TUI pane is another. Generalized
 * from the original audit.ts so record/visibility are never bolted on after.
 */
export interface RhoEvent {
  ts: string;
  kind: string;
  data?: unknown;
}

export type Listener = (event: RhoEvent) => void | Promise<void>;

export class EventBus {
  private readonly listeners = new Set<Listener>();

  /** Subscribe to every event. Returns an unsubscribe function. */
  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Emit an event to all subscribers, in subscription order. */
  async emit(kind: string, data?: unknown): Promise<RhoEvent> {
    const event: RhoEvent = { ts: new Date().toISOString(), kind, data };
    for (const listener of this.listeners) await listener(event);
    return event;
  }
}
