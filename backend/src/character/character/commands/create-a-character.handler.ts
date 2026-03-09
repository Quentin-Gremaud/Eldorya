import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateACharacterCommand } from './create-a-character.command.js';
import { Character } from '../character.aggregate.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import type { CharacterExistenceChecker } from '../character-existence-checker.port.js';
import { CHARACTER_EXISTENCE_CHECKER } from '../character-existence-checker.port.js';
import { UserId } from '../../../shared/user-id.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(CreateACharacterCommand)
export class CreateACharacterHandler
  implements ICommandHandler<CreateACharacterCommand>
{
  private readonly logger = new Logger(CreateACharacterHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CHARACTER_EXISTENCE_CHECKER)
    private readonly characterExistenceChecker: CharacterExistenceChecker,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateACharacterCommand): Promise<void> {
    const character = await Character.create(
      {
        id: command.id,
        userId: command.userId,
        campaignId: command.campaignId,
        name: command.name,
        race: command.race,
        characterClass: command.characterClass,
        background: command.background,
        stats: command.stats,
        spells: command.spells,
      },
      this.characterExistenceChecker,
      this.clock,
    );

    if (command.isGm) {
      character.approve(UserId.fromString(command.userId), this.clock);
    }

    await this.characterRepository.saveNew(character);

    this.logger.log(
      `CharacterCreated event persisted for character ${command.id}${command.isGm ? ' (auto-approved as GM)' : ''}`,
    );
  }
}
