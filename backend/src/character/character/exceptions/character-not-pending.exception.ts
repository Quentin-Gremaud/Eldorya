import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CharacterNotPendingException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(characterId: string): CharacterNotPendingException {
    return new CharacterNotPendingException(
      `Character "${characterId}" is not in pending status and cannot be approved or rejected.`,
    );
  }
}
