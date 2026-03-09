import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class DuplicateMapLevelNameException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forName(name: string, parentId: string | null): DuplicateMapLevelNameException {
    const parentDesc = parentId ? `under parent '${parentId}'` : 'at root level';
    return new DuplicateMapLevelNameException(
      `A map level named '${name}' already exists ${parentDesc}.`,
    );
  }
}
