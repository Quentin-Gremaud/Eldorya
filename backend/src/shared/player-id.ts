export class PlayerId {
  private constructor(private readonly value: string) {}

  static fromString(id: string): PlayerId {
    if (!id || id.trim().length === 0) {
      throw new Error('PlayerId cannot be empty');
    }
    return new PlayerId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }
}
