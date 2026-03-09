export class NotificationItemDto {
  id: string;
  type: string;
  title: string;
  content: string;
  campaignId: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;

  constructor(data: {
    id: string;
    type: string;
    title: string;
    content: string;
    campaignId: string | null;
    referenceId: string | null;
    isRead: boolean;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.content = data.content;
    this.campaignId = data.campaignId;
    this.referenceId = data.referenceId;
    this.isRead = data.isRead;
    this.createdAt = data.createdAt.toISOString();
  }
}

export class NotificationsResponseDto {
  notifications: NotificationItemDto[];
  unreadCount: number;

  constructor(data: {
    notifications: NotificationItemDto[];
    unreadCount: number;
  }) {
    this.notifications = data.notifications;
    this.unreadCount = data.unreadCount;
  }
}
