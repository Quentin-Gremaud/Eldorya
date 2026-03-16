import { SameModeTransitionException } from './exceptions/same-mode-transition.exception.js';

const ALLOWED_MODES = ['preparation', 'live'] as const;
export type SessionModeValue = (typeof ALLOWED_MODES)[number];

export class SessionMode {
  private constructor(private readonly value: SessionModeValue) {}

  static fromString(mode: string): SessionMode {
    if (!mode || !mode.trim()) {
      throw new Error('SessionMode cannot be empty');
    }
    const trimmed = mode.trim().toLowerCase();
    if (!(ALLOWED_MODES as readonly string[]).includes(trimmed)) {
      throw new Error(
        `Invalid SessionMode: '${mode}'. Must be one of: ${ALLOWED_MODES.join(', ')}.`,
      );
    }
    return new SessionMode(trimmed as SessionModeValue);
  }

  static fromPrimitives(mode: string): SessionMode {
    const trimmed = mode.trim().toLowerCase();
    if (!(ALLOWED_MODES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid session mode "${mode}"`);
    }
    return new SessionMode(trimmed as SessionModeValue);
  }

  static preparation(): SessionMode {
    return new SessionMode('preparation');
  }

  static live(): SessionMode {
    return new SessionMode('live');
  }

  ensureDifferentFrom(other: SessionMode): void {
    if (this.value === other.value) {
      throw SameModeTransitionException.forMode(this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionMode | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
