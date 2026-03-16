const ALLOWED_STATUSES = ['active', 'ended'] as const;
export type SessionStatusValue = (typeof ALLOWED_STATUSES)[number];

export class SessionStatus {
  private constructor(private readonly value: SessionStatusValue) {}

  static fromString(status: string): SessionStatus {
    if (!status || !status.trim()) {
      throw new Error('SessionStatus cannot be empty');
    }
    const trimmed = status.trim().toLowerCase();
    if (!(ALLOWED_STATUSES as readonly string[]).includes(trimmed)) {
      throw new Error(
        `Invalid SessionStatus: '${status}'. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`,
      );
    }
    return new SessionStatus(trimmed as SessionStatusValue);
  }

  static fromPrimitives(status: string): SessionStatus {
    const trimmed = status.trim().toLowerCase();
    if (!(ALLOWED_STATUSES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid session status "${status}"`);
    }
    return new SessionStatus(trimmed as SessionStatusValue);
  }

  static active(): SessionStatus {
    return new SessionStatus('active');
  }

  static ended(): SessionStatus {
    return new SessionStatus('ended');
  }

  isActive(): boolean {
    return this.value === 'active';
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionStatus | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
