import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlaceTokenHandler } from './commands/place-token.handler.js';
import { MoveTokenHandler } from './commands/move-token.handler.js';
import { RemoveTokenHandler } from './commands/remove-token.handler.js';
import { TOKEN_REPOSITORY } from './token.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    PlaceTokenHandler,
    MoveTokenHandler,
    RemoveTokenHandler,
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class TokenDomainModule {}
