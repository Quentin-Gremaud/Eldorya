export abstract class DomainException extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
