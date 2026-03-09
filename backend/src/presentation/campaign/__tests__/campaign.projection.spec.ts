import { CampaignStatusEnum } from '@prisma/client';
import { CampaignProjection } from '../projections/campaign.projection.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('CampaignProjection', () => {
  let projection: CampaignProjection;
  let prisma: {
    campaign: { upsert: jest.Mock };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };
  let kurrentDb: { getClient: jest.Mock };

  beforeEach(() => {
    prisma = {
      campaign: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
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

  describe('handleCampaignCreated()', () => {
    it('should upsert campaign in Prisma read model', async () => {
      const data = {
        campaignId: 'campaign-123',
        name: 'My Campaign',
        description: 'A great campaign',
        gmUserId: 'user-gm-1',
        createdAt: '2026-03-01T12:00:00.000Z',
      };

      await projection.handleCampaignCreated(data);

      expect(prisma.campaign.upsert).toHaveBeenCalledTimes(1);

      const call = prisma.campaign.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'campaign-123' });
      expect(call.create.id).toBe('campaign-123');
      expect(call.create.name).toBe('My Campaign');
      expect(call.create.description).toBe('A great campaign');
      expect(call.create.gmUserId).toBe('user-gm-1');
      expect(call.create.status).toBe(CampaignStatusEnum.active);
      expect(call.create.playerCount).toBe(0);
      expect(call.create.createdAt).toEqual(new Date('2026-03-01T12:00:00.000Z'));
    });

    it('should handle empty description', async () => {
      const data = {
        campaignId: 'campaign-123',
        name: 'My Campaign',
        description: '',
        gmUserId: 'user-gm-1',
        createdAt: '2026-03-01T12:00:00.000Z',
      };

      await projection.handleCampaignCreated(data);

      const call = prisma.campaign.upsert.mock.calls[0][0];
      expect(call.create.description).toBe('');
    });

    it('should handle undefined description', async () => {
      const data = {
        campaignId: 'campaign-123',
        name: 'My Campaign',
        gmUserId: 'user-gm-1',
        createdAt: '2026-03-01T12:00:00.000Z',
      };

      await projection.handleCampaignCreated(data);

      const call = prisma.campaign.upsert.mock.calls[0][0];
      expect(call.create.description).toBe('');
    });
  });
});
