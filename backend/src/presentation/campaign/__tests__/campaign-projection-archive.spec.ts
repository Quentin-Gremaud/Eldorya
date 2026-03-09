import { CampaignStatusEnum } from '@prisma/client';
import { CampaignProjection } from '../projections/campaign.projection.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('CampaignProjection — Archive & Reactivate', () => {
  let projection: CampaignProjection;
  let prisma: {
    campaign: { upsert: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
    campaignMember: { findMany: jest.Mock };
    notification: { createMany: jest.Mock };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let kurrentDb: { getClient: jest.Mock };

  beforeEach(() => {
    prisma = {
      campaign: {
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue({ name: 'Test Campaign' }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ name: 'Test Campaign' }),
      },
      campaignMember: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'player-1' },
          { userId: 'player-2' },
        ]),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };

    kurrentDb = {
      getClient: jest.fn().mockReturnValue({
        subscribeToAll: jest.fn(),
      }),
    };

    projection = new CampaignProjection(
      kurrentDb as unknown as KurrentDbService,
      prisma as unknown as PrismaService,
    );
  });

  describe('handleCampaignArchived()', () => {
    const data = {
      campaignId: 'campaign-123',
      gmUserId: 'user-gm-1',
      archivedAt: '2026-03-07T12:00:00.000Z',
    };

    it('should update campaign status to archived within transaction', async () => {
      await projection.handleCampaignArchived(data);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: { status: CampaignStatusEnum.archived },
        select: { name: true },
      });
    });

    it('should create notification records for campaign players', async () => {
      await projection.handleCampaignArchived(data);

      expect(prisma.campaignMember.findMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-123', role: 'player' },
        select: { userId: true },
      });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      const call = prisma.notification.createMany.mock.calls[0][0];
      expect(call.data).toHaveLength(2);
      expect(call.data[0].userId).toBe('player-1');
      expect(call.data[0].type).toBe('campaign_archived');
      expect(call.data[0].title).toBe('Campaign archived');
      expect(call.data[0].content).toContain('Test Campaign');
      expect(call.data[0].campaignId).toBe('campaign-123');
      expect(call.skipDuplicates).toBe(true);
    });
  });

  describe('handleCampaignReactivated()', () => {
    it('should update campaign status to active', async () => {
      const data = {
        campaignId: 'campaign-123',
        gmUserId: 'user-gm-1',
        reactivatedAt: '2026-03-07T12:00:00.000Z',
      };

      await projection.handleCampaignReactivated(data);

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: { status: CampaignStatusEnum.active },
      });
    });
  });
});
