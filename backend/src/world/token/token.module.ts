import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlaceTokenHandler } from './commands/place-token.handler.js';
import { MoveTokenHandler } from './commands/move-token.handler.js';
import { RemoveTokenHandler } from './commands/remove-token.handler.js';
import { LinkLocationTokenHandler } from './commands/link-location-token.handler.js';
import { TOKEN_REPOSITORY } from './token.repository.js';
import { KurrentDbTokenRepository } from '../../infrastructure/world/kurrentdb-token.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    PlaceTokenHandler,
    MoveTokenHandler,
    RemoveTokenHandler,
    LinkLocationTokenHandler,
    {
      provide: TOKEN_REPOSITORY,
      useClass: KurrentDbTokenRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class TokenDomainModule {}
