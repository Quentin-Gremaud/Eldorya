import { Test, TestingModule } from '@nestjs/testing';
import { GetNotificationsController } from '../controllers/get-notifications.controller.js';
import { NotificationFinder } from '../finders/notification.finder.js';

describe('GetNotificationsController', () => {
  let controller: GetNotificationsController;
  let finder: jest.Mocked<NotificationFinder>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetNotificationsController],
      providers: [
        {
          provide: NotificationFinder,
          useValue: {
            findByUserId: jest.fn().mockResolvedValue({
              notifications: [
                {
                  id: 'notif-1',
                  type: 'campaign_announcement',
                  title: 'New announcement',
                  content: 'Hello!',
                  campaignId: 'campaign-123',
                  referenceId: 'ann-001',
                  isRead: false,
                  createdAt: new Date('2026-03-07T10:00:00Z'),
                },
              ],
              unreadCount: 1,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(GetNotificationsController);
    finder = module.get(NotificationFinder);
  });

  it('should return user notifications', async () => {
    const result = await controller.handle('user-1');

    expect(result.data.notifications).toHaveLength(1);
    expect(result.data.notifications[0].type).toBe('campaign_announcement');
    expect(result.data.unreadCount).toBe(1);
  });

  it('should call finder with correct userId', async () => {
    await controller.handle('user-42');

    expect(finder.findByUserId).toHaveBeenCalledWith('user-42');
  });
});
