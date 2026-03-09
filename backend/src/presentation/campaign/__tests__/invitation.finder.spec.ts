import { Test, TestingModule } from '@nestjs/testing';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('InvitationFinder', () => {
  let finder: InvitationFinder;
  let prisma: {
    invitation: { findUnique: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      invitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationFinder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    finder = module.get<InvitationFinder>(InvitationFinder);
  });

  describe('findByTokenHash', () => {
    it('should return invitation when found', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv-123',
        tokenHash: 'hash-abc',
        campaignId: 'campaign-456',
        status: 'active',
        expiresAt: new Date('2026-03-08T12:00:00Z'),
        createdAt: new Date('2026-03-01T12:00:00Z'),
        campaign: { name: 'Dragon Quest' },
      });

      const result = await finder.findByTokenHash('hash-abc');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('inv-123');
      expect(result!.campaignName).toBe('Dragon Quest');
    });

    it('should return null when not found', async () => {
      prisma.invitation.findUnique.mockResolvedValue(null);

      const result = await finder.findByTokenHash('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByCampaignId', () => {
    it('should return active invitation for campaign', async () => {
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-123',
        tokenHash: 'hash-abc',
        campaignId: 'campaign-456',
        status: 'active',
        expiresAt: new Date('2026-03-08T12:00:00Z'),
        createdAt: new Date('2026-03-01T12:00:00Z'),
        campaign: { name: 'Dragon Quest' },
      });

      const result = await finder.findActiveByCampaignId('campaign-456');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('inv-123');
      expect(result!.campaignName).toBe('Dragon Quest');
      expect(result!.status).toBe('active');
    });

    it('should filter by campaignId and active status', async () => {
      await finder.findActiveByCampaignId('campaign-456');

      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-456', status: 'active' },
        include: { campaign: { select: { name: true } } },
      });
    });

    it('should return null when no active invitation exists', async () => {
      prisma.invitation.findFirst.mockResolvedValue(null);

      const result = await finder.findActiveByCampaignId('campaign-456');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByTokenHash', () => {
    it('should return invitation when found with active status', async () => {
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-123',
        tokenHash: 'hash-abc',
        campaignId: 'campaign-456',
        status: 'active',
        expiresAt: null,
        createdAt: new Date('2026-03-01T12:00:00Z'),
        campaign: { name: 'Dragon Quest' },
      });

      const result = await finder.findActiveByTokenHash('hash-abc');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('active');
    });

    it('should filter by active status', async () => {
      await finder.findActiveByTokenHash('hash-abc');

      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
        where: { tokenHash: 'hash-abc', status: 'active' },
        include: { campaign: { select: { name: true } } },
      });
    });

    it('should return null when no active invitation found', async () => {
      prisma.invitation.findFirst.mockResolvedValue(null);

      const result = await finder.findActiveByTokenHash('hash-used');

      expect(result).toBeNull();
    });
  });
});
