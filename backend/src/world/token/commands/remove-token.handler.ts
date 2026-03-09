import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RemoveTokenCommand } from './remove-token.command.js';
import type { TokenRepository } from '../token.repository.js';
import { TOKEN_REPOSITORY } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RemoveTokenCommand)
export class RemoveTokenHandler
  implements ICommandHandler<RemoveTokenCommand>
{
  private readonly logger = new Logger(RemoveTokenHandler.name);

  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RemoveTokenCommand): Promise<void> {
    const aggregate = await this.tokenRepository.load(command.campaignId);

    aggregate.removeToken(
      command.tokenId,
      this.clock,
    );

    await this.tokenRepository.save(aggregate);

    this.logger.log(
      `TokenRemoved event persisted for token ${command.tokenId} in campaign ${command.campaignId}`,
    );
  }
}
