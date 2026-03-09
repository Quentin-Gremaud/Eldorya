import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarkNotificationReadController } from '../controllers/mark-notification-read.controller.js';
import { NotificationFinder } from '../finders/notification.finder.js';

describe('MarkNotificationReadController', () => {
  let controller: MarkNotificationReadController;
  let notificationFinder: any;

  beforeEach(async () => {
    notificationFinder = {
      findOwnerById: jest.fn().mockResolvedValue({
        userId: 'user-1',
      }),
      markAsRead: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarkNotificationReadController],
      providers: [
        {
          provide: NotificationFinder,
          useValue: notificationFinder,
        },
      ],
    }).compile();

    controller = module.get(MarkNotificationReadController);
  });

  it('should mark notification as read', async () => {
    await controller.handle('notif-1', 'user-1');

    expect(notificationFinder.findOwnerById).toHaveBeenCalledWith('notif-1');
    expect(notificationFinder.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should throw ForbiddenException if not owner', async () => {
    await expect(
      controller.handle('notif-1', 'other-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException for non-existent notification', async () => {
    notificationFinder.findOwnerById.mockResolvedValue(null);

    await expect(
      controller.handle('nonexistent', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
