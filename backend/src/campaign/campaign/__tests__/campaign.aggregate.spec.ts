import { CampaignAggregate } from '../campaign.aggregate.js';
import { CampaignCreated } from '../events/campaign-created.event.js';
import { CampaignLimitReachedException } from '../exceptions/campaign-limit-reached.exception.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('CampaignAggregate', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const now = new Date('2026-03-01T12:00:00Z');

  const validName = 'My Campaign';
  const validDescription = 'A test campaign';

  const mockCounter: ActiveCampaignCounter = {
    countByGmUserId: jest.fn().mockResolvedValue(0),
  };

  const mockTierChecker: SubscriptionTierChecker = {
    isProUser: jest.fn().mockResolvedValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(0);
    (mockTierChecker.isProUser as jest.Mock).mockResolvedValue(false);
  });

  describe('create()', () => {
    it('should emit CampaignCreated with correct data', async () => {
      const aggregate = await CampaignAggregate.create(
        campaignId,
        validName,
        validDescription,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CampaignCreated);

      const event = events[0] as CampaignCreated;
      expect(event.campaignId).toBe(campaignId);
      expect(event.name).toBe('My Campaign');
      expect(event.description).toBe('A test campaign');
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.status).toBe('active');
      expect(event.createdAt).toBe(now.toISOString());
    });

    it('should create campaign with empty description', async () => {
      const aggregate = await CampaignAggregate.create(
        campaignId,
        validName,
        undefined,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      const events = aggregate.getUncommittedEvents();
      const event = events[0] as CampaignCreated;
      expect(event.description).toBe('');
    });

    it('should validate name via VO (rejects empty)', async () => {
      await expect(
        CampaignAggregate.create(
          campaignId,
          '',
          validDescription,
          gmUserId,
          now,
          mockCounter,
          mockTierChecker,
        ),
      ).rejects.toThrow();
    });

    it('should throw CampaignLimitReachedException for free-tier at limit', async () => {
      (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(2);

      await expect(
        CampaignAggregate.create(
          campaignId,
          validName,
          validDescription,
          gmUserId,
          now,
          mockCounter,
          mockTierChecker,
        ),
      ).rejects.toThrow(CampaignLimitReachedException);
    });

    it('should throw CampaignLimitReachedException with correct message', async () => {
      (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(2);

      await expect(
        CampaignAggregate.create(
          campaignId,
          validName,
          validDescription,
          gmUserId,
          now,
          mockCounter,
          mockTierChecker,
        ),
      ).rejects.toThrow(
        'Free-tier users are limited to 2 active campaigns.',
      );
    });

    it('should allow Pro user to bypass campaign limit', async () => {
      (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(10);
      (mockTierChecker.isProUser as jest.Mock).mockResolvedValue(true);

      const aggregate = await CampaignAggregate.create(
        campaignId,
        validName,
        validDescription,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CampaignCreated);
    });

    it('should not call countByGmUserId for Pro users', async () => {
      (mockTierChecker.isProUser as jest.Mock).mockResolvedValue(true);

      await CampaignAggregate.create(
        campaignId,
        validName,
        validDescription,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      expect(mockCounter.countByGmUserId).not.toHaveBeenCalled();
    });

    it('should set aggregate state correctly after creation', async () => {
      const aggregate = await CampaignAggregate.create(
        campaignId,
        validName,
        validDescription,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      expect(aggregate.getId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(gmUserId);
      expect(aggregate.getStatus().isActive()).toBe(true);
    });
  });

  describe('loadFromHistory()', () => {
    it('should correctly reconstruct state from CampaignCreated event', () => {
      const aggregate = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'My Campaign',
            description: 'A test campaign',
            gmUserId,
            status: 'active',
            createdAt: now.toISOString(),
          },
        },
      ]);

      expect(aggregate.getId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(gmUserId);
      expect(aggregate.getStatus().isActive()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should handle null description in event history', () => {
      const aggregate = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'My Campaign',
            description: null,
            gmUserId,
            status: 'active',
            createdAt: now.toISOString(),
          },
        },
      ]);

      expect(aggregate.getId()).toBe(campaignId);
    });

    it('should throw error on unknown event type', () => {
      expect(() =>
        CampaignAggregate.loadFromHistory([
          {
            type: 'SomeUnknownEvent',
            data: { foo: 'bar' },
          },
        ]),
      ).toThrow('Unknown event type: SomeUnknownEvent');
    });

    it('should throw runtime validation error when required field is not a string', () => {
      expect(() =>
        CampaignAggregate.loadFromHistory([
          {
            type: 'CampaignCreated',
            data: {
              campaignId: 123,
              name: 'Test',
              description: '',
              gmUserId,
              status: 'active',
              createdAt: now.toISOString(),
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "campaignId" must be a string in CampaignCreated, got number',
      );
    });
  });

  describe('clearEvents()', () => {
    it('should clear uncommitted events', async () => {
      const aggregate = await CampaignAggregate.create(
        campaignId,
        validName,
        validDescription,
        gmUserId,
        now,
        mockCounter,
        mockTierChecker,
      );

      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      aggregate.clearEvents();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
