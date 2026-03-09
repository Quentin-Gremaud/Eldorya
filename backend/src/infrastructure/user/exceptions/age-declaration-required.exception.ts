import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class AgeDeclarationRequiredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): AgeDeclarationRequiredException {
    return new AgeDeclarationRequiredException(
      'Age declaration is required. User must confirm they are 16 years or older.',
    );
  }
}
