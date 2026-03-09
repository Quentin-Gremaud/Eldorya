import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateACharacterHandler } from './commands/create-a-character.handler.js';
import { ApproveACharacterHandler } from './commands/approve-a-character.handler.js';
import { RejectACharacterHandler } from './commands/reject-a-character.handler.js';
import { ModifyCharacterByGmHandler } from './commands/modify-character-by-gm.handler.js';
import { RequestCharacterModificationHandler } from './commands/request-character-modification.handler.js';
import { ApproveCharacterModificationHandler } from './commands/approve-character-modification.handler.js';
import { RejectCharacterModificationHandler } from './commands/reject-character-modification.handler.js';
import { KurrentDbCharacterRepository } from '../../infrastructure/character/kurrentdb-character.repository.js';
import { PrismaCharacterExistenceChecker } from '../../infrastructure/character/prisma-character-existence-checker.js';
import { CHARACTER_REPOSITORY } from './character.repository.js';
import { CHARACTER_EXISTENCE_CHECKER } from './character-existence-checker.port.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateACharacterHandler,
    ApproveACharacterHandler,
    RejectACharacterHandler,
    ModifyCharacterByGmHandler,
    RequestCharacterModificationHandler,
    ApproveCharacterModificationHandler,
    RejectCharacterModificationHandler,
    {
      provide: CHARACTER_REPOSITORY,
      useClass: KurrentDbCharacterRepository,
    },
    {
      provide: CHARACTER_EXISTENCE_CHECKER,
      useClass: PrismaCharacterExistenceChecker,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class CharacterDomainModule {}
