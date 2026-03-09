import { CampaignAnnouncementProjection } from '../projections/campaign-announcement.projection.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';

describe('CampaignAnnouncementProjection', () => {
  let projection: CampaignAnnouncementProjection;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      campaignAnnouncement: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      },
      campaignMember: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'player-1' },
          { userId: 'player-2' },
        ]),
      },
      projectionCheckpoint: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    } as any;

    const mockKurrentDb = {} as KurrentDbService;
    projection = new CampaignAnnouncementProjection(mockKurrentDb, prisma);
  });

  describe('handleCampaignAnnouncementSent', () => {
    const eventData = {
      announcementId: 'ann-001',
      campaignId: 'campaign-123',
      content: 'Hello everyone!',
      gmUserId: 'user-gm-1',
      gmDisplayName: 'John Doe',
      timestamp: '2026-03-07T10:00:00.000Z',
    };

    it('should create announcement record', async () => {
      await projection.handleCampaignAnnouncementSent(eventData);

      expect(prisma.campaignAnnouncement.upsert).toHaveBeenCalledWith({
        where: { id: 'ann-001' },
        create: expect.objectContaining({
          id: 'ann-001',
          campaignId: 'campaign-123',
          content: 'Hello everyone!',
          gmUserId: 'user-gm-1',
          gmDisplayName: 'John Doe',
        }),
        update: {},
      });
    });

    it('should use gmDisplayName from event without DB lookup', async () => {
      await projection.handleCampaignAnnouncementSent(eventData);

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('should fall back to DB lookup when gmDisplayName is absent (old events)', async () => {
      const oldEventData = {
        announcementId: 'ann-002',
        campaignId: 'campaign-123',
        content: 'Old event',
        gmUserId: 'user-gm-1',
        timestamp: '2026-03-01T10:00:00.000Z',
      };

      await projection.handleCampaignAnnouncementSent(oldEventData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { clerkUserId: 'user-gm-1' },
        select: { firstName: true, lastName: true, email: true },
      });
      expect(prisma.campaignAnnouncement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            gmDisplayName: 'John Doe',
          }),
        }),
      );
    });

    it('should create notification records for all campaign players', async () => {
      await projection.handleCampaignAnnouncementSent(eventData);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'player-1',
            type: 'campaign_announcement',
            campaignId: 'campaign-123',
            referenceId: 'ann-001',
          }),
          expect.objectContaining({
            userId: 'player-2',
            type: 'campaign_announcement',
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should use "Unknown" when GM user is not found (old events)', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      const oldEventData = { ...eventData, gmDisplayName: undefined };

      await projection.handleCampaignAnnouncementSent(
        oldEventData as unknown as Record<string, unknown>,
      );

      expect(prisma.campaignAnnouncement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            gmDisplayName: 'Unknown',
          }),
        }),
      );
    });

    it('should create no notifications when no players exist', async () => {
      (prisma.campaignMember.findMany as jest.Mock).mockResolvedValue([]);

      await projection.handleCampaignAnnouncementSent(eventData);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true,
      });
    });
  });
});
