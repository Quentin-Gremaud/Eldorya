import { createHash } from 'crypto';
import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidInvitationTokenException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidInvitationTokenException {
    return new InvalidInvitationTokenException(
      'Invitation token cannot be empty or whitespace-only.',
    );
  }

  static tooShort(minLength: number): InvalidInvitationTokenException {
    return new InvalidInvitationTokenException(
      `Invitation token must be at least ${minLength} characters.`,
    );
  }
}

export class InvitationToken {
  private static readonly MIN_TOKEN_LENGTH = 16;
  private readonly hashedValue: string;

  private constructor(hash: string) {
    this.hashedValue = hash;
  }

  static fromRawToken(token: string): InvitationToken {
    if (!token || !token.trim()) {
      throw InvalidInvitationTokenException.empty();
    }
    if (token.length < InvitationToken.MIN_TOKEN_LENGTH) {
      throw InvalidInvitationTokenException.tooShort(
        InvitationToken.MIN_TOKEN_LENGTH,
      );
    }
    const hash = createHash('sha256').update(token).digest('hex');
    return new InvitationToken(hash);
  }

  hash(): string {
    return this.hashedValue;
  }

  equals(other: InvitationToken): boolean {
    return this.hashedValue === other.hashedValue;
  }
}
