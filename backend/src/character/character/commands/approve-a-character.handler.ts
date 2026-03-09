import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ApproveACharacterCommand } from './approve-a-character.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import { UserId } from '../../../shared/user-id.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(ApproveACharacterCommand)
export class ApproveACharacterHandler
  implements ICommandHandler<ApproveACharacterCommand>
{
  private readonly logger = new Logger(ApproveACharacterHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ApproveACharacterCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);

    character.approve(UserId.fromString(command.approvedBy), this.clock);

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterApproved event persisted for character ${command.characterId}`,
    );
  }
}
