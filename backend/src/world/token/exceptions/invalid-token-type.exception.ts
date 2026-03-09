import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidTokenTypeException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidTokenTypeException {
    return new InvalidTokenTypeException('TokenType cannot be empty');
  }

  static invalidValue(type: string): InvalidTokenTypeException {
    return new InvalidTokenTypeException(
      `Invalid TokenType: '${type}'. Must be one of: player, npc, monster.`,
    );
  }
}
