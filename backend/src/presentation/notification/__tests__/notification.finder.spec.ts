import { Test, TestingModule } from '@nestjs/testing';
import { NotificationFinder } from '../finders/notification.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('NotificationFinder', () => {
  let finder: NotificationFinder;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationFinder,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    finder = module.get(NotificationFinder);
  });

  it('should return notifications for user', async () => {
    const notifications = [
      {
        id: 'n-1',
        type: 'campaign_announcement',
        title: 'Title',
        content: 'Content',
        campaignId: 'c-1',
        referenceId: 'ref-1',
        isRead: false,
        createdAt: new Date(),
      },
    ];
    prisma.notification.findMany.mockResolvedValue(notifications);
    prisma.notification.count.mockResolvedValue(1);

    const result = await finder.findByUserId('user-1');

    expect(result.notifications).toHaveLength(1);
    expect(result.unreadCount).toBe(1);
  });

  it('should filter unread only when option set', async () => {
    await finder.findByUserId('user-1', { unreadOnly: true });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', isRead: false },
      }),
    );
  });

  it('should order by createdAt DESC', async () => {
    await finder.findByUserId('user-1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('should return 0 unread count when no unread notifications', async () => {
    const result = await finder.findByUserId('user-1');

    expect(result.unreadCount).toBe(0);
  });
});
