import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateMapLevelHandler } from './commands/create-map-level.handler.js';
import { RenameMapLevelHandler } from './commands/rename-map-level.handler.js';
import { SetMapBackgroundHandler } from './commands/set-map-background.handler.js';
import { KurrentDbMapRepository } from '../../infrastructure/world/kurrentdb-map.repository.js';
import { MAP_REPOSITORY } from './map.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateMapLevelHandler,
    RenameMapLevelHandler,
    SetMapBackgroundHandler,
    {
      provide: MAP_REPOSITORY,
      useClass: KurrentDbMapRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class MapDomainModule {}
