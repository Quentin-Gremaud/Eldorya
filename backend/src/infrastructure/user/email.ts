import { DomainException } from '../../shared/exceptions/domain.exception.js';

class InvalidEmailException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static withValue(value: string): InvalidEmailException {
    return new InvalidEmailException(`Invalid email address: "${value}"`);
  }
}

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw InvalidEmailException.withValue(email);
    }
    return new Email(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
