import { Test, TestingModule } from '@nestjs/testing';
import { CampaignAnnouncementsFinder } from '../finders/campaign-announcements.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('CampaignAnnouncementsFinder', () => {
  let finder: CampaignAnnouncementsFinder;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignAnnouncementsFinder,
        {
          provide: PrismaService,
          useValue: {
            campaignAnnouncement: {
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
            campaign: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    finder = module.get(CampaignAnnouncementsFinder);
    prisma = module.get(PrismaService);
  });

  describe('findByCampaignId', () => {
    it('should return announcements ordered by createdAt DESC', async () => {
      const announcements = [
        {
          id: 'ann-2',
          content: 'Second',
          gmDisplayName: 'GM',
          createdAt: new Date('2026-03-07T12:00:00Z'),
        },
        {
          id: 'ann-1',
          content: 'First',
          gmDisplayName: 'GM',
          createdAt: new Date('2026-03-07T10:00:00Z'),
        },
      ];
      (prisma.campaignAnnouncement.findMany as jest.Mock).mockResolvedValue(
        announcements,
      );
      (prisma.campaignAnnouncement.count as jest.Mock).mockResolvedValue(2);

      const result = await finder.findByCampaignId('campaign-123');

      expect(result.announcements).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(
        (prisma.campaignAnnouncement.findMany as jest.Mock).mock.calls[0][0],
      ).toEqual(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty for no announcements', async () => {
      const result = await finder.findByCampaignId('campaign-empty');

      expect(result.announcements).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should filter by campaignId', async () => {
      await finder.findByCampaignId('campaign-456');

      expect(
        (prisma.campaignAnnouncement.findMany as jest.Mock).mock.calls[0][0],
      ).toEqual(
        expect.objectContaining({
          where: { campaignId: 'campaign-456' },
        }),
      );
    });
  });

  describe('checkCampaignMembership', () => {
    it('should return { exists: true, isMember: true } for GM', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        gmUserId: 'gm-user',
        members: [],
      });

      const result = await finder.checkCampaignMembership(
        'campaign-123',
        'gm-user',
      );

      expect(result).toEqual({ exists: true, isMember: true, isGm: true });
    });

    it('should return { exists: true, isMember: true } for player member', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        gmUserId: 'gm-user',
        members: [{ id: 'member-1' }],
      });

      const result = await finder.checkCampaignMembership(
        'campaign-123',
        'player-user',
      );

      expect(result).toEqual({ exists: true, isMember: true, isGm: false });
    });

    it('should return { exists: true, isMember: false } for non-member', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        gmUserId: 'gm-user',
        members: [],
      });

      const result = await finder.checkCampaignMembership(
        'campaign-123',
        'stranger',
      );

      expect(result).toEqual({ exists: true, isMember: false, isGm: false });
    });

    it('should return { exists: false } if campaign not found', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await finder.checkCampaignMembership(
        'nonexistent',
        'any-user',
      );

      expect(result).toEqual({ exists: false });
    });
  });
});
