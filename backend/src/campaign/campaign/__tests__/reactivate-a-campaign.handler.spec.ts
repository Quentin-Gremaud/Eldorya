import { ReactivateACampaignHandler } from '../commands/reactivate-a-campaign.handler.js';
import { ReactivateACampaignCommand } from '../commands/reactivate-a-campaign.command.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CampaignAggregate } from '../campaign.aggregate.js';
import type { Clock } from '../../../shared/clock.js';
import type { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('ReactivateACampaignHandler', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const now = new Date('2026-03-07T10:00:00Z');

  let handler: ReactivateACampaignHandler;
  let mockRepository: jest.Mocked<CampaignRepository>;
  let mockClock: Clock;
  let mockTierChecker: jest.Mocked<SubscriptionTierChecker>;

  beforeEach(() => {
    const archivedAggregate = CampaignAggregate.loadFromHistory([
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

    mockRepository = {
      saveNew: jest.fn(),
      save: jest.fn(),
      load: jest.fn().mockResolvedValue(archivedAggregate),
    };

    mockClock = {
      now: () => now,
    };

    mockTierChecker = {
      isProUser: jest.fn().mockResolvedValue(true),
    };

    handler = new ReactivateACampaignHandler(
      mockRepository,
      mockTierChecker,
      mockClock,
    );
  });

  it('should load aggregate, call reactivateCampaign with subscriptionTierChecker, and save', async () => {
    const command = new ReactivateACampaignCommand(campaignId, gmUserId);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockTierChecker.isProUser).toHaveBeenCalledWith(gmUserId);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.any(CampaignAggregate),
      gmUserId,
    );
  });

  it('should propagate domain exception when user is not the GM', async () => {
    const command = new ReactivateACampaignCommand(campaignId, 'other-user');

    await expect(handler.execute(command)).rejects.toThrow(
      'not the GM',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception when campaign is not archived', async () => {
    // Load an active (non-archived) aggregate
    const activeAggregate = CampaignAggregate.loadFromHistory([
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
    ]);
    mockRepository.load.mockResolvedValue(activeAggregate);

    const command = new ReactivateACampaignCommand(campaignId, gmUserId);

    await expect(handler.execute(command)).rejects.toThrow(
      'not archived',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception when user is not Pro', async () => {
    mockTierChecker.isProUser.mockResolvedValue(false);

    const command = new ReactivateACampaignCommand(campaignId, gmUserId);

    await expect(handler.execute(command)).rejects.toThrow(
      'Pro subscription is required',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
