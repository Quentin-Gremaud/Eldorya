import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ModifyCharacterByGmCommand } from './modify-character-by-gm.command.js';
import type { CharacterRepository } from '../character.repository.js';
import { CHARACTER_REPOSITORY } from '../character.repository.js';
import { CharacterModification } from '../character-modification.js';
import { UserId } from '../../../shared/user-id.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(ModifyCharacterByGmCommand)
export class ModifyCharacterByGmHandler
  implements ICommandHandler<ModifyCharacterByGmCommand>
{
  private readonly logger = new Logger(ModifyCharacterByGmHandler.name);

  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepository: CharacterRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ModifyCharacterByGmCommand): Promise<void> {
    const character = await this.characterRepository.load(command.characterId);

    const modifications = CharacterModification.create(command.modifications);
    character.modifyByGm(
      UserId.fromString(command.modifiedBy),
      modifications,
      this.clock,
    );

    await this.characterRepository.save(character);

    this.logger.log(
      `CharacterModifiedByGM event persisted for character ${command.characterId}`,
    );
  }
}
