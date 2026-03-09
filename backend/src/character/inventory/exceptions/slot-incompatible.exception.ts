import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SlotIncompatibleException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forItem(
    itemName: string,
    slotType: string,
  ): SlotIncompatibleException {
    return new SlotIncompatibleException(
      `Item '${itemName}' is not compatible with slot '${slotType}'.`,
    );
  }
}
