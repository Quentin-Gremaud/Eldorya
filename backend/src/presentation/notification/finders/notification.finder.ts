import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  campaignId: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
}

@Injectable()
export class NotificationFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationsResult> {
    const where = {
      userId,
      ...(options?.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          campaignId: true,
          referenceId: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async findOwnerById(
    notificationId: string,
  ): Promise<{ userId: string } | null> {
    return this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
