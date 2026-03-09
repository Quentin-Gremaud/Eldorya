import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RejectCharacterModificationCommand } from './reject-character-modification.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import { UserId } from '../../../shared/user-id.js';
import { RejectionReason } from '../rejection-reason.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RejectCharacterModificationCommand)
export class RejectCharacterModificationHandler
  implements ICommandHandler<RejectCharacterModificationCommand>
{
  private readonly logger = new Logger(RejectCharacterModificationHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RejectCharacterModificationCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);

    character.rejectModification(
      UserId.fromString(command.rejectedBy),
      RejectionReason.fromString(command.reason),
      command.campaignId,
      this.clock,
    );

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterModificationRejected event persisted for character ${command.characterId}`,
    );
  }
}
