import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CharacterAlreadyExistsException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(
    campaignId: string,
    userId: string,
  ): CharacterAlreadyExistsException {
    return new CharacterAlreadyExistsException(
      'A character already exists for this player in this campaign.',
    );
  }
}
