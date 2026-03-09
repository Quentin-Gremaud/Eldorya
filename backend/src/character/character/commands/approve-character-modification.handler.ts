import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ApproveCharacterModificationCommand } from './approve-character-modification.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import { UserId } from '../../../shared/user-id.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(ApproveCharacterModificationCommand)
export class ApproveCharacterModificationHandler
  implements ICommandHandler<ApproveCharacterModificationCommand>
{
  private readonly logger = new Logger(ApproveCharacterModificationHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ApproveCharacterModificationCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);

    character.approveModification(
      UserId.fromString(command.approvedBy),
      command.campaignId,
      this.clock,
    );

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterModificationApproved event persisted for character ${command.characterId}`,
    );
  }
}
