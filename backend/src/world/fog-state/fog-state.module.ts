import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InitializeFogStateHandler } from './commands/initialize-fog-state.handler.js';
import { RevealFogZoneHandler } from './commands/reveal-fog-zone.handler.js';
import { HideFogZoneHandler } from './commands/hide-fog-zone.handler.js';
import { KurrentDbFogStateRepository } from '../../infrastructure/world/kurrentdb-fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from './fog-state.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    InitializeFogStateHandler,
    RevealFogZoneHandler,
    HideFogZoneHandler,
    {
      provide: FOG_STATE_REPOSITORY,
      useClass: KurrentDbFogStateRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class FogStateDomainModule {}
