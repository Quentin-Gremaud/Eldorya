import { Controller, Get } from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { NotificationFinder } from '../finders/notification.finder.js';
import {
  NotificationItemDto,
  NotificationsResponseDto,
} from '../dto/notification.dto.js';

@Controller('notifications')
export class GetNotificationsController {
  constructor(private readonly finder: NotificationFinder) {}

  @Get()
  async handle(
    @AuthUserId() userId: string,
  ): Promise<{ data: NotificationsResponseDto }> {
    const result = await this.finder.findByUserId(userId);

    const notifications = result.notifications.map(
      (n) => new NotificationItemDto(n),
    );

    return {
      data: new NotificationsResponseDto({
        notifications,
        unreadCount: result.unreadCount,
      }),
    };
  }
}
