import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RequestCharacterModificationCommand } from './request-character-modification.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RequestCharacterModificationCommand)
export class RequestCharacterModificationHandler
  implements ICommandHandler<RequestCharacterModificationCommand>
{
  private readonly logger = new Logger(RequestCharacterModificationHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RequestCharacterModificationCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);

    character.requestModification(
      command.playerId,
      command.campaignId,
      command.proposedChanges,
      command.reason,
      this.clock,
    );

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterModificationRequested event persisted for character ${command.characterId}`,
    );
  }
}
