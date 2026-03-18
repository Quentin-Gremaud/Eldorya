import { InvalidActionProposalException } from './exceptions/invalid-action-proposal.exception.js';

const ALLOWED_ACTION_TYPES = ['move', 'attack', 'interact', 'free-text'] as const;
export type ActionTypeValue = (typeof ALLOWED_ACTION_TYPES)[number];

export class ActionType {
  private constructor(private readonly value: ActionTypeValue) {}

  static fromString(type: string): ActionType {
    if (!type || !type.trim()) {
      throw InvalidActionProposalException.forReason('ActionType cannot be empty');
    }
    const trimmed = type.trim().toLowerCase();
    if (!(ALLOWED_ACTION_TYPES as readonly string[]).includes(trimmed)) {
      throw InvalidActionProposalException.forReason(
        `Invalid ActionType: '${type}'. Must be one of: ${ALLOWED_ACTION_TYPES.join(', ')}.`,
      );
    }
    return new ActionType(trimmed as ActionTypeValue);
  }

  static fromPrimitives(type: string): ActionType {
    const trimmed = type.trim().toLowerCase();
    if (!(ALLOWED_ACTION_TYPES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid action type "${type}"`);
    }
    return new ActionType(trimmed as ActionTypeValue);
  }

  static move(): ActionType {
    return new ActionType('move');
  }

  static attack(): ActionType {
    return new ActionType('attack');
  }

  static interact(): ActionType {
    return new ActionType('interact');
  }

  static freeText(): ActionType {
    return new ActionType('free-text');
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActionType | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
