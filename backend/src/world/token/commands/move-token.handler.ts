import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { MoveTokenCommand } from './move-token.command.js';
import type { TokenRepository } from '../token.repository.js';
import { TOKEN_REPOSITORY } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(MoveTokenCommand)
export class MoveTokenHandler
  implements ICommandHandler<MoveTokenCommand>
{
  private readonly logger = new Logger(MoveTokenHandler.name);

  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: MoveTokenCommand): Promise<void> {
    const aggregate = await this.tokenRepository.load(command.campaignId);

    aggregate.moveToken(
      command.tokenId,
      command.x,
      command.y,
      this.clock,
    );

    await this.tokenRepository.save(aggregate);

    this.logger.log(
      `TokenMoved event persisted for token ${command.tokenId} in campaign ${command.campaignId}`,
    );
  }
}
