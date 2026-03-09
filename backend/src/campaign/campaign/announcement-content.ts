import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidAnnouncementContentException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidAnnouncementContentException {
    return new InvalidAnnouncementContentException(
      'Announcement content cannot be empty.',
    );
  }

  static tooLong(maxLength: number): InvalidAnnouncementContentException {
    return new InvalidAnnouncementContentException(
      `Announcement content cannot exceed ${maxLength} characters.`,
    );
  }
}

export class AnnouncementContent {
  private static readonly MAX_LENGTH = 2000;
  private static readonly HTML_TAG_REGEX = /<[^>]*>?/g;

  private constructor(private readonly value: string) {}

  static fromString(raw: string): AnnouncementContent {
    if (!raw || !raw.trim()) {
      throw InvalidAnnouncementContentException.empty();
    }

    let sanitized = raw;
    let previous: string;
    do {
      previous = sanitized;
      sanitized = sanitized.replace(AnnouncementContent.HTML_TAG_REGEX, '');
    } while (sanitized !== previous);
    sanitized = sanitized.trim();

    if (!sanitized) {
      throw InvalidAnnouncementContentException.empty();
    }

    if (sanitized.length > AnnouncementContent.MAX_LENGTH) {
      throw InvalidAnnouncementContentException.tooLong(
        AnnouncementContent.MAX_LENGTH,
      );
    }

    return new AnnouncementContent(sanitized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AnnouncementContent | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.toString();
  }
}
