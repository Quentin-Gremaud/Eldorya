import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetCampaignAnnouncementsController } from '../controllers/get-campaign-announcements.controller.js';
import { CampaignAnnouncementsFinder } from '../finders/campaign-announcements.finder.js';

describe('GetCampaignAnnouncementsController', () => {
  let controller: GetCampaignAnnouncementsController;
  let finder: jest.Mocked<CampaignAnnouncementsFinder>;

  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetCampaignAnnouncementsController],
      providers: [
        {
          provide: CampaignAnnouncementsFinder,
          useValue: {
            checkCampaignMembership: jest
              .fn()
              .mockResolvedValue({ exists: true, isMember: true }),
            findByCampaignId: jest.fn().mockResolvedValue({
              announcements: [
                {
                  id: 'ann-1',
                  content: 'Hello!',
                  gmDisplayName: 'GM Name',
                  createdAt: new Date('2026-03-07T10:00:00Z'),
                },
              ],
              totalCount: 1,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(GetCampaignAnnouncementsController);
    finder = module.get(CampaignAnnouncementsFinder);
  });

  it('should return announcements for campaign member', async () => {
    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data.announcements).toHaveLength(1);
    expect(result.data.announcements[0].content).toBe('Hello!');
    expect(result.data.totalCount).toBe(1);
  });

  it('should throw NotFoundException for non-existent campaign', async () => {
    finder.checkCampaignMembership.mockResolvedValue({ exists: false });

    await expect(
      controller.handle('nonexistent', gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException for non-member', async () => {
    finder.checkCampaignMembership.mockResolvedValue({
      exists: true,
      isMember: false,
    });

    await expect(
      controller.handle(campaignId, 'stranger'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should return empty array for campaign with no announcements', async () => {
    finder.findByCampaignId.mockResolvedValue({
      announcements: [],
      totalCount: 0,
    });

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data.announcements).toHaveLength(0);
    expect(result.data.totalCount).toBe(0);
  });
});
