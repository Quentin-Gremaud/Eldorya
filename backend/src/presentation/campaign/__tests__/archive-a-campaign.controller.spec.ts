import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArchiveACampaignController } from '../controllers/archive-a-campaign.controller.js';
import { ArchiveACampaignCommand } from '../../../campaign/campaign/commands/archive-a-campaign.command.js';
import { CampaignDetailFinder } from '../finders/campaign-detail.finder.js';

describe('ArchiveACampaignController', () => {
  let controller: ArchiveACampaignController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignDetailFinder: jest.Mocked<CampaignDetailFinder>;

  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArchiveACampaignController],
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

    controller = module.get(ArchiveACampaignController);
    commandBus = module.get(CommandBus);
    campaignDetailFinder = module.get(CampaignDetailFinder);
  });

  it('should dispatch ArchiveACampaignCommand and return 202', async () => {
    const result = await controller.handle(campaignId, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ArchiveACampaignCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.userId).toBe(gmUserId);
  });

  it('should throw ForbiddenException if user is not GM', async () => {
    await expect(
      controller.handle(campaignId, 'other-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    campaignDetailFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });
});
