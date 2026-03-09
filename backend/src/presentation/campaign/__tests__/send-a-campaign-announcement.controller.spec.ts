import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SendACampaignAnnouncementController } from '../controllers/send-a-campaign-announcement.controller.js';
import { SendACampaignAnnouncementCommand } from '../../../campaign/campaign/commands/send-a-campaign-announcement.command.js';
import { CampaignDetailFinder } from '../finders/campaign-detail.finder.js';

describe('SendACampaignAnnouncementController', () => {
  let controller: SendACampaignAnnouncementController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignDetailFinder: jest.Mocked<CampaignDetailFinder>;

  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendACampaignAnnouncementController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CampaignDetailFinder,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: campaignId,
              gmUserId,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(SendACampaignAnnouncementController);
    commandBus = module.get(CommandBus);
    campaignDetailFinder = module.get(CampaignDetailFinder);
  });

  it('should dispatch SendACampaignAnnouncementCommand and return 202', async () => {
    const dto = { id: 'ann-001', content: 'Hello players!' };

    const result = await controller.handle(campaignId, dto as any, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(SendACampaignAnnouncementCommand);
    expect(command.announcementId).toBe('ann-001');
    expect(command.campaignId).toBe(campaignId);
    expect(command.content).toBe('Hello players!');
    expect(command.userId).toBe(gmUserId);
  });

  it('should throw ForbiddenException if user is not GM', async () => {
    await expect(
      controller.handle(campaignId, { id: 'ann-001', content: 'Hello' } as any, 'other-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    campaignDetailFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, { id: 'ann-001', content: 'Hello' } as any, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });
});
