import { CampaignStatusEnum } from '@prisma/client';
import { ActiveCampaignCounterAdapter } from '../active-campaign-counter.adapter.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('ActiveCampaignCounterAdapter', () => {
  let adapter: ActiveCampaignCounterAdapter;
  let prisma: { campaign: { count: jest.Mock } };

  beforeEach(() => {
    prisma = {
      campaign: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    adapter = new ActiveCampaignCounterAdapter(
      prisma as unknown as PrismaService,
    );
  });

  it('should count active campaigns for a given user', async () => {
    prisma.campaign.count.mockResolvedValue(3);

    const count = await adapter.countByGmUserId('user-123');

    expect(count).toBe(3);
    expect(prisma.campaign.count).toHaveBeenCalledWith({
      where: {
        gmUserId: 'user-123',
        status: { not: CampaignStatusEnum.archived },
      },
    });
  });

  it('should return 0 when no active campaigns', async () => {
    prisma.campaign.count.mockResolvedValue(0);

    const count = await adapter.countByGmUserId('user-123');

    expect(count).toBe(0);
  });
});
