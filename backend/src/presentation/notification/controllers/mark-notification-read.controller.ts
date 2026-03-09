import {
  Controller,
  Patch,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { NotificationFinder } from '../finders/notification.finder.js';

@Controller('notifications')
export class MarkNotificationReadController {
  constructor(private readonly notificationFinder: NotificationFinder) {}

  @Patch(':notificationId/read')
  @HttpCode(204)
  async handle(
    @Param('notificationId', new ParseUUIDPipe()) notificationId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const notification =
      await this.notificationFinder.findOwnerById(notificationId);

    if (!notification) throw new NotFoundException();
    if (notification.userId !== userId) throw new ForbiddenException();

    await this.notificationFinder.markAsRead(notificationId);
  }
}
