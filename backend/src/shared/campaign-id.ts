export class CampaignId {
  private constructor(private readonly value: string) {}

  static fromString(id: string): CampaignId {
    if (!id || id.trim().length === 0) {
      throw new Error('CampaignId cannot be empty');
    }
    return new CampaignId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CampaignId): boolean {
    return this.value === other.value;
  }
}
