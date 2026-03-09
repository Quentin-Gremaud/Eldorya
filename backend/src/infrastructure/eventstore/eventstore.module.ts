import { Global, Module } from '@nestjs/common';
import { KurrentDbService } from './kurrentdb.service';

@Global()
@Module({
  providers: [KurrentDbService],
  exports: [KurrentDbService],
})
export class EventStoreModule {}
