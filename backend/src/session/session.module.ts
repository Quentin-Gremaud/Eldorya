import { Module } from '@nestjs/common';
import { SessionSessionModule } from './session/session.module.js';

@Module({
  imports: [SessionSessionModule],
})
export class SessionModule {}
