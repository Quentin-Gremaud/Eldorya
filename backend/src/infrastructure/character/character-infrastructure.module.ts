import { Module } from '@nestjs/common';
import { KurrentDbCharacterRepository } from './kurrentdb-character.repository.js';
import { PrismaCharacterExistenceChecker } from './prisma-character-existence-checker.js';
import { CHARACTER_REPOSITORY } from '../../character/character/character.repository.js';
import { CHARACTER_EXISTENCE_CHECKER } from '../../character/character/character-existence-checker.port.js';

@Module({
  providers: [
    {
      provide: CHARACTER_REPOSITORY,
      useClass: KurrentDbCharacterRepository,
    },
    {
      provide: CHARACTER_EXISTENCE_CHECKER,
      useClass: PrismaCharacterExistenceChecker,
    },
  ],
  exports: [CHARACTER_REPOSITORY, CHARACTER_EXISTENCE_CHECKER],
})
export class CharacterInfrastructureModule {}
