import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class ParentMapLevelNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forLevel(parentId: string, campaignId: string): ParentMapLevelNotFoundException {
    return new ParentMapLevelNotFoundException(
      `Parent map level '${parentId}' not found in campaign '${campaignId}'.`,
    );
  }
}
