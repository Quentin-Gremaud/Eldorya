import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidCampaignDescriptionException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static tooLong(maxLength: number): InvalidCampaignDescriptionException {
    return new InvalidCampaignDescriptionException(
      `Campaign description cannot exceed ${maxLength} characters.`,
    );
  }
}

export class CampaignDescription {
  private static readonly MAX_LENGTH = 500;

  private constructor(private readonly value: string) {}

  static fromString(description: string): CampaignDescription {
    if (description == null) {
      return CampaignDescription.empty();
    }
    const trimmed = description.trim();
    if (trimmed.length > CampaignDescription.MAX_LENGTH) {
      throw InvalidCampaignDescriptionException.tooLong(
        CampaignDescription.MAX_LENGTH,
      );
    }
    return new CampaignDescription(trimmed);
  }

  static empty(): CampaignDescription {
    return new CampaignDescription('');
  }

  toString(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === '';
  }

  equals(other: CampaignDescription | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
