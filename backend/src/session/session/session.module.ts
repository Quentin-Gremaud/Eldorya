import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StartSessionHandler } from './commands/start-session.handler.js';
import { ChangeSessionModeHandler } from './commands/change-session-mode.handler.js';
import { SESSION_REPOSITORY } from './session.repository.js';
import { KurrentDbSessionRepository } from '../../infrastructure/session/kurrentdb-session.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    StartSessionHandler,
    ChangeSessionModeHandler,
    {
      provide: SESSION_REPOSITORY,
      useClass: KurrentDbSessionRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class SessionSessionModule {}
