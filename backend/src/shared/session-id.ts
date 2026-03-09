export class SessionId {
  private constructor(private readonly value: string) {}

  static fromString(id: string): SessionId {
    if (!id || id.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
    return new SessionId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
