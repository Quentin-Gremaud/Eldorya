import { CampaignAggregate } from '../campaign.aggregate.js';
import { CampaignAnnouncementSent } from '../events/campaign-announcement-sent.event.js';
import { NotGmOfCampaignException } from '../exceptions/not-gm-of-campaign.exception.js';
import { CampaignNotActiveException } from '../exceptions/campaign-not-active.exception.js';
import { InvalidAnnouncementContentException } from '../announcement-content.js';
import { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';

describe('CampaignAggregate — sendAnnouncement', () => {
  const campaignId = 'campaign-123';
  const gmUserId = 'user-gm-1';
  const now = new Date('2026-03-01T12:00:00Z');
  const announcementId = 'ann-001';
  const announcementTimestamp = new Date('2026-03-07T10:00:00Z');

  const mockCounter: ActiveCampaignCounter = {
    countByGmUserId: jest.fn().mockResolvedValue(0),
  };

  const mockTierChecker: SubscriptionTierChecker = {
    isProUser: jest.fn().mockResolvedValue(false),
  };

  let aggregate: CampaignAggregate;

  beforeEach(async () => {
    jest.clearAllMocks();
    aggregate = await CampaignAggregate.create(
      campaignId,
      'Test Campaign',
      'Description',
      gmUserId,
      now,
      mockCounter,
      mockTierChecker,
    );
    aggregate.clearEvents();
  });

  it('should emit CampaignAnnouncementSent event with correct data', () => {
    aggregate.sendAnnouncement(
      announcementId,
      'Session tonight at 8pm!',
      gmUserId,
      'GM Name',
      announcementTimestamp,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CampaignAnnouncementSent);

    const event = events[0] as CampaignAnnouncementSent;
    expect(event.announcementId).toBe(announcementId);
    expect(event.campaignId).toBe(campaignId);
    expect(event.content).toBe('Session tonight at 8pm!');
    expect(event.gmUserId).toBe(gmUserId);
    expect(event.gmDisplayName).toBe('GM Name');
    expect(event.timestamp).toBe(announcementTimestamp.toISOString());
  });

  it('should reject if user is not the GM', () => {
    expect(() =>
      aggregate.sendAnnouncement(
        announcementId,
        'Hello!',
        'other-user',
        'Other Name',
        announcementTimestamp,
      ),
    ).toThrow(NotGmOfCampaignException);
  });

  it('should sanitize content (strip HTML tags)', () => {
    aggregate.sendAnnouncement(
      announcementId,
      '<b>Bold</b> text <script>hack</script>',
      gmUserId,
      'GM Name',
      announcementTimestamp,
    );

    const event = aggregate.getUncommittedEvents()[0] as CampaignAnnouncementSent;
    expect(event.content).toBe('Bold text hack');
  });

  it('should reject empty content', () => {
    expect(() =>
      aggregate.sendAnnouncement(
        announcementId,
        '',
        gmUserId,
        announcementTimestamp,
      ),
    ).toThrow(InvalidAnnouncementContentException);
  });

  it('should reject content exceeding 2000 chars', () => {
    const longContent = 'a'.repeat(2001);
    expect(() =>
      aggregate.sendAnnouncement(
        announcementId,
        longContent,
        gmUserId,
        announcementTimestamp,
      ),
    ).toThrow(InvalidAnnouncementContentException);
  });

  it('should reject announcement on non-active campaign', () => {
    const archivedAggregate = CampaignAggregate.loadFromHistory([
      {
        type: 'CampaignCreated',
        data: {
          campaignId,
          name: 'Archived Campaign',
          description: 'Desc',
          gmUserId,
          status: 'archived',
          createdAt: now.toISOString(),
        },
      },
    ]);

    expect(() =>
      archivedAggregate.sendAnnouncement(
        announcementId,
        'Hello!',
        gmUserId,
        announcementTimestamp,
      ),
    ).toThrow(CampaignNotActiveException);
  });

  describe('loadFromHistory with CampaignAnnouncementSent', () => {
    it('should load aggregate with announcement events', () => {
      const loaded = CampaignAggregate.loadFromHistory([
        {
          type: 'CampaignCreated',
          data: {
            campaignId,
            name: 'Test Campaign',
            description: 'Desc',
            gmUserId,
            status: 'active',
            createdAt: now.toISOString(),
          },
        },
        {
          type: 'CampaignAnnouncementSent',
          data: {
            announcementId: 'ann-1',
            campaignId,
            content: 'Hello!',
            gmUserId,
            timestamp: announcementTimestamp.toISOString(),
          },
        },
      ]);

      expect(loaded.getId()).toBe(campaignId);
      expect(loaded.getGmUserId()).toBe(gmUserId);
      expect(loaded.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
