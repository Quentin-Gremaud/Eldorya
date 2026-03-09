import { Module } from '@nestjs/common';
import { MapDomainModule } from './map/map.module.js';
import { TokenDomainModule } from './token/token.module.js';
import { TOKEN_REPOSITORY } from './token/token.repository.js';
import { KurrentDbTokenRepository } from '../infrastructure/world/kurrentdb-token.repository.js';

@Module({
  imports: [MapDomainModule, TokenDomainModule],
  providers: [
    {
      provide: TOKEN_REPOSITORY,
      useClass: KurrentDbTokenRepository,
    },
  ],
})
export class WorldModule {}
