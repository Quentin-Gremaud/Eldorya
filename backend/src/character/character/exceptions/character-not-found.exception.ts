import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CharacterNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(characterId: string): CharacterNotFoundException {
    return new CharacterNotFoundException(
      `Character not found: '${characterId}'.`,
    );
  }
}
