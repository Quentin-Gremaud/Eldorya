import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SlotAlreadyOccupiedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forSlot(slotType: string): SlotAlreadyOccupiedException {
    return new SlotAlreadyOccupiedException(
      `Equipment slot '${slotType}' is already occupied.`,
    );
  }
}
