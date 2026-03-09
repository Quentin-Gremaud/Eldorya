import { CreateACampaignHandler } from '../commands/create-a-campaign.handler.js';
import { CreateACampaignCommand } from '../commands/create-a-campaign.command.js';
import { CampaignRepository } from '../campaign.repository.port.js';
import { Clock } from '../../../shared/clock.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';
import { CampaignLimitReachedException } from '../exceptions/campaign-limit-reached.exception.js';

describe('CreateACampaignHandler', () => {
  let handler: CreateACampaignHandler;
  let mockRepository: { saveNew: ReturnType<typeof jest.fn> };
  let mockClock: Clock;
  let mockCounter: ActiveCampaignCounter;
  let mockTierChecker: SubscriptionTierChecker;

  const fixedNow = new Date('2026-03-05T12:00:00Z');
  const campaignId = 'campaign-123';
  const userId = 'user-gm-1';

  beforeEach(() => {
    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
    };

    mockCounter = {
      countByGmUserId: jest.fn().mockResolvedValue(0),
    };

    mockTierChecker = {
      isProUser: jest.fn().mockResolvedValue(false),
    };

    handler = new CreateACampaignHandler(
      mockRepository as unknown as CampaignRepository,
      mockClock,
      mockCounter,
      mockTierChecker,
    );
  });

  it('should delegate to CampaignRepository.saveNew', async () => {
    const command = new CreateACampaignCommand(
      campaignId,
      'My Campaign',
      'A description',
      userId,
    );

    await handler.execute(command);

    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);

    const [aggregate, savedUserId] = mockRepository.saveNew.mock.calls[0];
    expect(aggregate.getId()).toBe(campaignId);
    expect(aggregate.getGmUserId()).toBe(userId);
    expect(savedUserId).toBe(userId);
  });

  it('should pass raw command fields to aggregate (no VO construction in handler)', async () => {
    const command = new CreateACampaignCommand(
      campaignId,
      'My Campaign',
      'A description',
      userId,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('My Campaign');
    expect(events[0].description).toBe('A description');
    expect(events[0].status).toBe('active');
  });

  it('should propagate CampaignLimitReachedException from aggregate', async () => {
    (mockCounter.countByGmUserId as jest.Mock).mockResolvedValue(2);

    const command = new CreateACampaignCommand(
      campaignId,
      'Test',
      '',
      userId,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      CampaignLimitReachedException,
    );

    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should handle empty description', async () => {
    const command = new CreateACampaignCommand(
      campaignId,
      'Test',
      '',
      userId,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events[0].description).toBe('');
  });
});
