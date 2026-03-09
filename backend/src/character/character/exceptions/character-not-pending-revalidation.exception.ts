import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CharacterNotPendingRevalidationException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(characterId: string): CharacterNotPendingRevalidationException {
    return new CharacterNotPendingRevalidationException(
      `Character "${characterId}" is not in pending-revalidation status.`,
    );
  }
}
