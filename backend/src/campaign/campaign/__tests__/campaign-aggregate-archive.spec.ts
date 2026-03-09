import { CampaignAggregate } from '../campaign.aggregate.js';
import { CampaignArchived } from '../events/campaign-archived.event.js';
import { CampaignReactivated } from '../events/campaign-reactivated.event.js';
import { CampaignNotActiveException } from '../exceptions/campaign-not-active.exception.js';
import { CampaignNotArchivedException } from '../exceptions/campaign-not-archived.exception.js';
import { ProSubscriptionRequiredException } from '../exceptions/pro-subscription-required.exception.js';
import { NotGmOfCampaignException } from '../exceptions/not-gm-of-campaign.exception.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('CampaignAggregate — Archive & Reactivate', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const otherUserId = 'user-other';
  const now = new Date('2026-03-07T12:00:00Z');

  const mockCounter: ActiveCampaignCounter = {
    countByGmUserId: jest.fn().mockResolvedValue(0),
  };

  const mockTierChecker: SubscriptionTierChecker = {
    isProUser: jest.fn().mockResolvedValue(false),
  };

  const mockProTierChecker: SubscriptionTierChecker = {
    isProUser: jest.fn().mockResolvedValue(true),
  };

  let activeAggregate: CampaignAggregate;

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(0);
    (mockTierChecker.isProUser as jest.Mock).mockResolvedValue(false);
    (mockProTierChecker.isProUser as jest.Mock).mockResolvedValue(true);

    activeAggregate = await CampaignAggregate.create(
      campaignId,
      'Test Campaign',
      'Description',
      gmUserId,
      new Date('2026-03-01'),
      mockCounter,
      mockTierChecker,
    );
    activeAggregate.clearEvents();
  });

  describe('archiveCampaign()', () => {
    it('should emit CampaignArchived event', () => {
      activeAggregate.archiveCampaign(gmUserId, now);

      const events = activeAggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CampaignArchived);

      const event = events[0] as CampaignArchived;
      expect(event.campaignId).toBe(campaignId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.archivedAt).toBe(now.toISOString());
    });

    it('should update status to archived after apply', () => {
      activeAggregate.archiveCampaign(gmUserId, now);

      expect(activeAggregate.getStatus().isArchived()).toBe(true);
      expect(activeAggregate.getStatus().isActive()).toBe(false);
    });

    it('should reject if not GM', () => {
      expect(() =>
        activeAggregate.archiveCampaign(otherUserId, now),
      ).toThrow(NotGmOfCampaignException);
    });

    it('should reject if already archived', () => {
      activeAggregate.archiveCampaign(gmUserId, now);
      activeAggregate.clearEvents();

      expect(() =>
        activeAggregate.archiveCampaign(gmUserId, now),
      ).toThrow(CampaignNotActiveException);
    });
  });

  describe('reactivateCampaign()', () => {
    let archivedAggregate: CampaignAggregate;

    beforeEach(() => {
      archivedAggregate = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'Test Campaign',
            description: 'Description',
            gmUserId,
            status: 'active',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        },
        {
          type: 'CampaignArchived',
          data: {
            campaignId,
            gmUserId,
            archivedAt: '2026-03-05T00:00:00.000Z',
          },
        },
      ]);
    });

    it('should emit CampaignReactivated event', async () => {
      await archivedAggregate.reactivateCampaign(
        gmUserId,
        now,
        mockProTierChecker,
      );

      const events = archivedAggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CampaignReactivated);

      const event = events[0] as CampaignReactivated;
      expect(event.campaignId).toBe(campaignId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.reactivatedAt).toBe(now.toISOString());
    });

    it('should update status to active after apply', async () => {
      await archivedAggregate.reactivateCampaign(
        gmUserId,
        now,
        mockProTierChecker,
      );

      expect(archivedAggregate.getStatus().isActive()).toBe(true);
      expect(archivedAggregate.getStatus().isArchived()).toBe(false);
    });

    it('should reject if not archived', async () => {
      await expect(
        activeAggregate.reactivateCampaign(gmUserId, now, mockProTierChecker),
      ).rejects.toThrow(CampaignNotArchivedException);
    });

    it('should reject if not GM', async () => {
      await expect(
        archivedAggregate.reactivateCampaign(
          otherUserId,
          now,
          mockProTierChecker,
        ),
      ).rejects.toThrow(NotGmOfCampaignException);
    });

    it('should reject if not Pro', async () => {
      await expect(
        archivedAggregate.reactivateCampaign(gmUserId, now, mockTierChecker),
      ).rejects.toThrow(ProSubscriptionRequiredException);
    });
  });

  describe('loadFromHistory() — archive/reactivate sequence', () => {
    it('should correctly reconstruct aggregate from CampaignArchived event', () => {
      const aggregate = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'Test Campaign',
            description: 'Description',
            gmUserId,
            status: 'active',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        },
        {
          type: 'CampaignArchived',
          data: {
            campaignId,
            gmUserId,
            archivedAt: '2026-03-05T00:00:00.000Z',
          },
        },
      ]);

      expect(aggregate.getStatus().isArchived()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should correctly reconstruct aggregate from archive + reactivate sequence', () => {
      const aggregate = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'Test Campaign',
            description: 'Description',
            gmUserId,
            status: 'active',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        },
        {
          type: 'CampaignArchived',
          data: {
            campaignId,
            gmUserId,
            archivedAt: '2026-03-05T00:00:00.000Z',
          },
        },
        {
          type: 'CampaignReactivated',
          data: {
            campaignId,
            gmUserId,
            reactivatedAt: '2026-03-06T00:00:00.000Z',
          },
        },
      ]);

      expect(aggregate.getStatus().isActive()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
