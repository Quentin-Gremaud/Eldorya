import { KurrentDbCampaignRepository } from '../kurrentdb-campaign.repository.js';
import { CampaignAggregate } from '../../../campaign/campaign/campaign.aggregate.js';
import { KurrentDbService } from '../../eventstore/kurrentdb.service.js';
import { Clock } from '../../../shared/clock.js';
import { ActiveCampaignCounter } from '../../../campaign/campaign/active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../../../campaign/campaign/subscription-tier-checker.port.js';

describe('KurrentDbCampaignRepository', () => {
  let repository: KurrentDbCampaignRepository;
  let mockKurrentDb: {
    appendToNewStream: jest.Mock;
    readStream: jest.Mock;
  };
  let mockClock: Clock;

  const fixedNow = new Date('2026-03-05T12:00:00Z');
  const campaignId = 'campaign-123';
  const userId = 'user-gm-1';

  beforeEach(() => {
    mockKurrentDb = {
      appendToNewStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn().mockResolvedValue([]),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
    };

    repository = new KurrentDbCampaignRepository(
      mockKurrentDb as unknown as KurrentDbService,
      mockClock,
    );
  });

  describe('saveNew()', () => {
    it('should persist events to KurrentDB with correct stream name', async () => {
      const aggregate = await createAggregate();

      await repository.saveNew(aggregate, userId);

      expect(mockKurrentDb.appendToNewStream).toHaveBeenCalledTimes(1);

      const [streamName] = mockKurrentDb.appendToNewStream.mock.calls[0];
      expect(streamName).toBe(`campaign-${campaignId}`);
    });

    it('should serialize CampaignCreated event data correctly', async () => {
      const aggregate = await createAggregate();

      await repository.saveNew(aggregate, userId);

      const [, eventType, eventData] =
        mockKurrentDb.appendToNewStream.mock.calls[0];

      expect(eventType).toBe('CampaignCreated');
      expect(eventData.campaignId).toBe(campaignId);
      expect(eventData.name).toBe('My Campaign');
      expect(eventData.description).toBe('A description');
      expect(eventData.gmUserId).toBe(userId);
      expect(eventData.status).toBe('active');
    });

    it('should include metadata with correlationId, timestamp, userId, campaignId', async () => {
      const aggregate = await createAggregate();

      await repository.saveNew(aggregate, userId);

      const [, , , metadata] = mockKurrentDb.appendToNewStream.mock.calls[0];

      expect(metadata.correlationId).toBeDefined();
      expect(typeof metadata.correlationId).toBe('string');
      expect(metadata.timestamp).toBe('2026-03-05T12:00:00.000Z');
      expect(metadata.userId).toBe(userId);
      expect(metadata.campaignId).toBe(campaignId);
    });

    it('should clear uncommitted events after save', async () => {
      const aggregate = await createAggregate();

      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      await repository.saveNew(aggregate, userId);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('load()', () => {
    it('should read stream and reconstruct aggregate', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'My Campaign',
            description: 'A description',
            gmUserId: userId,
            status: 'active',
            createdAt: fixedNow.toISOString(),
          },
        },
      ]);

      const aggregate = await repository.load(campaignId);

      expect(mockKurrentDb.readStream).toHaveBeenCalledWith(
        `campaign-${campaignId}`,
      );
      expect(aggregate.getId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(userId);
      expect(aggregate.getStatus().isActive()).toBe(true);
    });
  });

  async function createAggregate(): Promise<CampaignAggregate> {
    const mockCounter: ActiveCampaignCounter = {
      countByGmUserId: jest.fn().mockResolvedValue(0),
    };
    const mockTierChecker: SubscriptionTierChecker = {
      isProUser: jest.fn().mockResolvedValue(false),
    };

    return CampaignAggregate.create(
      campaignId,
      'My Campaign',
      'A description',
      userId,
      fixedNow,
      mockCounter,
      mockTierChecker,
    );
  }
});
