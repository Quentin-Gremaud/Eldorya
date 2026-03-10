import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { PlaceTokenCommand } from './place-token.command.js';
import type { TokenRepository } from '../token.repository.js';
import { TOKEN_REPOSITORY } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(PlaceTokenCommand)
export class PlaceTokenHandler
  implements ICommandHandler<PlaceTokenCommand>
{
  private readonly logger = new Logger(PlaceTokenHandler.name);

  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: PlaceTokenCommand): Promise<void> {
    const aggregate = await this.tokenRepository.load(command.campaignId);

    aggregate.placeToken(
      command.tokenId,
      command.mapLevelId,
      command.x,
      command.y,
      command.tokenType,
      command.label,
      this.clock,
    );

    if (aggregate.isNew()) {
      await this.tokenRepository.saveNew(aggregate);
    } else {
      await this.tokenRepository.save(aggregate);
    }

    this.logger.log(
      `TokenPlaced event persisted for token ${command.tokenId} in campaign ${command.campaignId}`,
    );
  }
}
