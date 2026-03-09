import { AgeDeclarationRequiredException } from './exceptions/age-declaration-required.exception.js';

export class AgeDeclaration {
  private constructor(
    private readonly declared: boolean,
    private readonly timestamp: Date,
  ) {}

  static create(declared: boolean, timestamp: Date): AgeDeclaration {
    if (!declared) {
      throw AgeDeclarationRequiredException.create();
    }
    return new AgeDeclaration(declared, timestamp);
  }

  isDeclared(): boolean {
    return this.declared;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }
}
