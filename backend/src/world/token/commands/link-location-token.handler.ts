import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { LinkLocationTokenCommand } from './link-location-token.command.js';
import type { TokenRepository } from '../token.repository.js';
import { TOKEN_REPOSITORY } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(LinkLocationTokenCommand)
export class LinkLocationTokenHandler
  implements ICommandHandler<LinkLocationTokenCommand>
{
  private readonly logger = new Logger(LinkLocationTokenHandler.name);

  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: LinkLocationTokenCommand): Promise<void> {
    const aggregate = await this.tokenRepository.load(command.campaignId);

    aggregate.linkToMapLevel(
      command.tokenId,
      command.destinationMapLevelId,
      this.clock,
    );

    await this.tokenRepository.save(aggregate);

    this.logger.log(
      `LocationTokenLinked event persisted for token ${command.tokenId} in campaign ${command.campaignId}`,
    );
  }
}
