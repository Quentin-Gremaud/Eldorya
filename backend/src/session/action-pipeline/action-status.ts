const ALLOWED_ACTION_STATUSES = ['pending', 'validated', 'rejected', 'cancelled'] as const;
export type ActionStatusValue = (typeof ALLOWED_ACTION_STATUSES)[number];

export class ActionStatus {
  private constructor(private readonly value: ActionStatusValue) {}

  static fromString(status: string): ActionStatus {
    if (!status || !status.trim()) {
      throw new Error('ActionStatus cannot be empty');
    }
    const trimmed = status.trim().toLowerCase();
    if (!(ALLOWED_ACTION_STATUSES as readonly string[]).includes(trimmed)) {
      throw new Error(
        `Invalid ActionStatus: '${status}'. Must be one of: ${ALLOWED_ACTION_STATUSES.join(', ')}.`,
      );
    }
    return new ActionStatus(trimmed as ActionStatusValue);
  }

  static fromPrimitives(status: string): ActionStatus {
    const trimmed = status.trim().toLowerCase();
    if (!(ALLOWED_ACTION_STATUSES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid action status "${status}"`);
    }
    return new ActionStatus(trimmed as ActionStatusValue);
  }

  static pending(): ActionStatus {
    return new ActionStatus('pending');
  }

  static validated(): ActionStatus {
    return new ActionStatus('validated');
  }

  static rejected(): ActionStatus {
    return new ActionStatus('rejected');
  }

  static cancelled(): ActionStatus {
    return new ActionStatus('cancelled');
  }

  isPending(): boolean {
    return this.value === 'pending';
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActionStatus | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
