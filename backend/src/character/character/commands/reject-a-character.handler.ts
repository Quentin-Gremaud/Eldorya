import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RejectACharacterCommand } from './reject-a-character.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import { RejectionReason } from '../rejection-reason.js';
import { UserId } from '../../../shared/user-id.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RejectACharacterCommand)
export class RejectACharacterHandler
  implements ICommandHandler<RejectACharacterCommand>
{
  private readonly logger = new Logger(RejectACharacterHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RejectACharacterCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);
    const reason = RejectionReason.fromString(command.reason);

    character.reject(UserId.fromString(command.rejectedBy), reason, this.clock);

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterRejected event persisted for character ${command.characterId}`,
    );
  }
}
