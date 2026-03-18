import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../infrastructure/auth/auth.module.js';
import { SessionGateway } from './session.gateway.js';
import { InventoryNotificationSubscriber } from './inventory-notification.subscriber.js';
import { FogEventSubscriber } from './fog-event.subscriber.js';
import { SessionEventSubscriber } from './session-event.subscriber.js';
import { ActionEventSubscriber } from './action-event.subscriber.js';
import { RoomManagerService } from './services/room-manager.service.js';
import { SessionPresentationModule } from '../presentation/session/session-presentation.module.js';

@Module({
  imports: [AuthModule, SessionPresentationModule, CqrsModule],
  providers: [
    SessionGateway,
    RoomManagerService,
    InventoryNotificationSubscriber,
    FogEventSubscriber,
    SessionEventSubscriber,
    ActionEventSubscriber,
  ],
  exports: [SessionGateway, RoomManagerService],
})
export class GatewayModule {}
