import { Module } from '@nestjs/common';
import { GetNotificationsController } from './controllers/get-notifications.controller.js';
import { MarkNotificationReadController } from './controllers/mark-notification-read.controller.js';
import { NotificationFinder } from './finders/notification.finder.js';

@Module({
  controllers: [GetNotificationsController, MarkNotificationReadController],
  providers: [NotificationFinder],
})
export class NotificationPresentationModule {}
