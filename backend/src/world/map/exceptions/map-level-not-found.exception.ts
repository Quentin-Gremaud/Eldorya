import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class MapLevelNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forLevel(mapLevelId: string, campaignId: string): MapLevelNotFoundException {
    return new MapLevelNotFoundException(
      `Map level '${mapLevelId}' not found in campaign '${campaignId}'.`,
    );
  }
}
