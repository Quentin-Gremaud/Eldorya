import { Module } from '@nestjs/common';
import { AuthModule } from '../infrastructure/auth/auth.module.js';
import { SessionGateway } from './session.gateway.js';
import { InventoryNotificationSubscriber } from './inventory-notification.subscriber.js';
import { FogEventSubscriber } from './fog-event.subscriber.js';

@Module({
  imports: [AuthModule],
  providers: [SessionGateway, InventoryNotificationSubscriber, FogEventSubscriber],
  exports: [SessionGateway],
})
export class GatewayModule {}
