import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CharacterNotApprovedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(characterId: string): CharacterNotApprovedException {
    return new CharacterNotApprovedException(
      `Character "${characterId}" is not in approved status and cannot be directly modified by GM.`,
    );
  }
}
