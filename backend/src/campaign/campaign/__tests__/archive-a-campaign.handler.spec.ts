import { ArchiveACampaignHandler } from '../commands/archive-a-campaign.handler.js';
import { ArchiveACampaignCommand } from '../commands/archive-a-campaign.command.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CampaignAggregate } from '../campaign.aggregate.js';
import type { Clock } from '../../../shared/clock.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('ArchiveACampaignHandler', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const now = new Date('2026-03-07T10:00:00Z');

  let handler: ArchiveACampaignHandler;
  let mockRepository: jest.Mocked<CampaignRepository>;
  let mockClock: Clock;

  beforeEach(async () => {
    const mockCounter: ActiveCampaignCounter = {
      countByGmUserId: jest.fn().mockResolvedValue(0),
    };
    const mockTierChecker: SubscriptionTierChecker = {
      isProUser: jest.fn().mockResolvedValue(false),
    };

    const aggregate = await CampaignAggregate.create(
      campaignId,
      'Test Campaign',
      'Description',
      gmUserId,
      new Date('2026-03-01'),
      mockCounter,
      mockTierChecker,
    );
    aggregate.clearEvents();

    mockRepository = {
      saveNew: jest.fn(),
      save: jest.fn(),
      load: jest.fn().mockResolvedValue(aggregate),
    };

    mockClock = {
      now: () => now,
    };

    handler = new ArchiveACampaignHandler(mockRepository, mockClock);
  });

  it('should load aggregate, call archiveCampaign, and save', async () => {
    const command = new ArchiveACampaignCommand(campaignId, gmUserId);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.any(CampaignAggregate),
      gmUserId,
    );
  });

  it('should propagate domain exception when user is not the GM', async () => {
    const command = new ArchiveACampaignCommand(campaignId, 'other-user');

    await expect(handler.execute(command)).rejects.toThrow(
      'not the GM',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception when campaign is not active', async () => {
    // Archive the campaign first to make it non-active
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
    mockRepository.load.mockResolvedValue(archivedAggregate);

    const command = new ArchiveACampaignCommand(campaignId, gmUserId);

    await expect(handler.execute(command)).rejects.toThrow(
      'not active',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
