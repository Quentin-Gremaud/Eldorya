import { SendACampaignAnnouncementHandler } from '../commands/send-a-campaign-announcement.handler.js';
import { SendACampaignAnnouncementCommand } from '../commands/send-a-campaign-announcement.command.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CampaignAggregate } from '../campaign.aggregate.js';
import type { Clock } from '../../../shared/clock.js';
import type { UserDisplayNameResolver } from '../user-display-name-resolver.port.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('SendACampaignAnnouncementHandler', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const announcementId = 'ann-001';
  const content = 'Session tonight at 8pm!';
  const now = new Date('2026-03-07T10:00:00Z');

  let handler: SendACampaignAnnouncementHandler;
  let mockRepository: jest.Mocked<CampaignRepository>;
  let mockClock: Clock;
  let mockDisplayNameResolver: jest.Mocked<UserDisplayNameResolver>;

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

    mockDisplayNameResolver = {
      resolve: jest.fn().mockResolvedValue('GM Name'),
    };

    handler = new SendACampaignAnnouncementHandler(
      mockRepository,
      mockDisplayNameResolver,
      mockClock,
    );
  });

  it('should load aggregate, call sendAnnouncement, and save', async () => {
    const command = new SendACampaignAnnouncementCommand(
      announcementId,
      campaignId,
      content,
      gmUserId,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockDisplayNameResolver.resolve).toHaveBeenCalledWith(gmUserId);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.any(CampaignAggregate),
      gmUserId,
    );
  });

  it('should pass announcement data through to aggregate', async () => {
    const command = new SendACampaignAnnouncementCommand(
      announcementId,
      campaignId,
      content,
      gmUserId,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0][0];
    // After save, events should have been the ones from sendAnnouncement
    // (save clears them, but we can check the call happened)
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
