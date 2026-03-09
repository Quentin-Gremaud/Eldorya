import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class ItemNotFoundInInventoryException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forItem(itemId: string): ItemNotFoundInInventoryException {
    return new ItemNotFoundInInventoryException(
      `Item '${itemId}' not found in inventory.`,
    );
  }
}
