import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class PipelineModeMandatoryException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forPlayer(playerId: string): PipelineModeMandatoryException {
    return new PipelineModeMandatoryException(
      `Cannot propose action: pipeline mode is mandatory and player "${playerId}" has not been pinged by the GM`,
    );
  }
}
