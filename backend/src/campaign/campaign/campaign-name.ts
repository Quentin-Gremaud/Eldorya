import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidCampaignNameException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidCampaignNameException {
    return new InvalidCampaignNameException(
      'Campaign name cannot be empty.',
    );
  }

  static tooLong(maxLength: number): InvalidCampaignNameException {
    return new InvalidCampaignNameException(
      `Campaign name cannot exceed ${maxLength} characters.`,
    );
  }
}

export class CampaignName {
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static fromString(name: string): CampaignName {
    if (!name || !name.trim()) {
      throw InvalidCampaignNameException.empty();
    }
    const trimmed = name.trim();
    if (trimmed.length > CampaignName.MAX_LENGTH) {
      throw InvalidCampaignNameException.tooLong(CampaignName.MAX_LENGTH);
    }
    return new CampaignName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CampaignName | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
