/** Thrown when a request would exceed the session token ceiling. */
export class BudgetExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly max: number,
    public readonly attempted: number,
  ) {
    super(`token budget exceeded: ${used} + ${attempted} would pass the ${max} ceiling`);
    this.name = "BudgetExceededError";
  }
}

export interface BudgetStatus {
  used: number;
  max: number;
  remaining: number;
  shouldCompact: boolean;
}

/**
 * Tracks AND enforces a session token budget.
 *
 * This is the part most tools skip: they *observe* token usage but can't *stop*
 * a request. `guard()` refuses before the call; `shouldCompact` signals when to
 * summarize/prune. Closing the "observability vs enforcement" gap is rho's wedge.
 */
export class Budget {
  private used = 0;

  constructor(
    private readonly maxTokens: number,
    private readonly compactAt: number,
  ) {}

  /** Cheap heuristic until a real tokenizer is wired (~4 chars/token). */
  estimate(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /** Throws if sending `text` would cross the ceiling. Call BEFORE the request. */
  guard(text: string): void {
    const next = this.estimate(text);
    if (this.used + next > this.maxTokens) {
      throw new BudgetExceededError(this.used, this.maxTokens, next);
    }
  }

  /** Record tokens actually consumed. */
  add(text: string): number {
    this.used += this.estimate(text);
    return this.used;
  }

  status(): BudgetStatus {
    return {
      used: this.used,
      max: this.maxTokens,
      remaining: Math.max(0, this.maxTokens - this.used),
      shouldCompact: this.used >= this.compactAt,
    };
  }
}
