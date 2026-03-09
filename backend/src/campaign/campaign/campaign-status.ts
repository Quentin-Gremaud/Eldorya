import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidCampaignStatusException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static unknownValue(value: string): InvalidCampaignStatusException {
    return new InvalidCampaignStatusException(
      `Unknown campaign status: "${value}". Allowed values: active, archived, readonly.`,
    );
  }
}

export class CampaignStatus {
  private static readonly ACTIVE_VALUE = 'active';
  private static readonly ARCHIVED_VALUE = 'archived';
  private static readonly READONLY_VALUE = 'readonly';

  private static readonly ALLOWED_VALUES = [
    CampaignStatus.ACTIVE_VALUE,
    CampaignStatus.ARCHIVED_VALUE,
    CampaignStatus.READONLY_VALUE,
  ];

  private constructor(private readonly value: string) {}

  static active(): CampaignStatus {
    return new CampaignStatus(CampaignStatus.ACTIVE_VALUE);
  }

  static archived(): CampaignStatus {
    return new CampaignStatus(CampaignStatus.ARCHIVED_VALUE);
  }

  static readonly(): CampaignStatus {
    return new CampaignStatus(CampaignStatus.READONLY_VALUE);
  }

  static fromString(value: string): CampaignStatus {
    if (!CampaignStatus.ALLOWED_VALUES.includes(value)) {
      throw InvalidCampaignStatusException.unknownValue(value);
    }
    return new CampaignStatus(value);
  }

  isActive(): boolean {
    return this.value === CampaignStatus.ACTIVE_VALUE;
  }

  isArchived(): boolean {
    return this.value === CampaignStatus.ARCHIVED_VALUE;
  }

  isReadonly(): boolean {
    return this.value === CampaignStatus.READONLY_VALUE;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CampaignStatus | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
