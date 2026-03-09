import { Test, TestingModule } from '@nestjs/testing';
import { UserCampaignsFinder } from '../finders/user-campaigns.finder';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const mockPrismaService = {
  campaign: {
    findMany: jest.fn(),
  },
};

describe('UserCampaignsFinder', () => {
  let finder: UserCampaignsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCampaignsFinder,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    finder = module.get<UserCampaignsFinder>(UserCampaignsFinder);
    jest.clearAllMocks();
  });

  it('should return empty array when user has no campaigns', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([]);

    const result = await finder.findByUserId('user-1');

    expect(result).toEqual([]);
    expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { gmUserId: 'user-1' },
            { members: { some: { userId: 'user-1' } } },
          ],
        },
      }),
    );
  });

  it('should return campaigns where user is GM with role "gm"', async () => {
    const now = new Date('2026-03-01T10:00:00Z');
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'Dragon Quest',
        description: 'An epic adventure',
        coverImageUrl: 'https://example.com/cover.jpg',
        status: 'active',
        gmUserId: 'user-1',
        playerCount: 4,
        lastSessionDate: now,
        createdAt: now,
        updatedAt: now,
        members: [{ role: 'gm' }],
      },
    ]);

    const result = await finder.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('campaign-1');
    expect(result[0].name).toBe('Dragon Quest');
    expect(result[0].role).toBe('gm');
    expect(result[0].playerCount).toBe(4);
    expect(result[0].lastSessionDate).toBe(now.toISOString());
  });

  it('should return campaigns where user is a player with role "player"', async () => {
    const now = new Date('2026-02-15T12:00:00Z');
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-2',
        name: 'Sword Coast',
        description: null,
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'other-user',
        playerCount: 3,
        lastSessionDate: null,
        createdAt: now,
        updatedAt: now,
        members: [{ role: 'player' }],
      },
    ]);

    const result = await finder.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('player');
    expect(result[0].description).toBeNull();
    expect(result[0].coverImageUrl).toBeNull();
    expect(result[0].lastSessionDate).toBeNull();
  });

  it('should return mixed GM and player campaigns', async () => {
    const now = new Date('2026-03-01T10:00:00Z');
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'My GM Campaign',
        description: 'I run this one',
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'user-1',
        playerCount: 5,
        lastSessionDate: now,
        createdAt: now,
        updatedAt: now,
        members: [{ role: 'gm' }],
      },
      {
        id: 'campaign-2',
        name: 'Player Campaign',
        description: 'I play in this one',
        coverImageUrl: 'https://example.com/img.png',
        status: 'active',
        gmUserId: 'other-user',
        playerCount: 4,
        lastSessionDate: null,
        createdAt: now,
        updatedAt: now,
        members: [{ role: 'player' }],
      },
    ]);

    const result = await finder.findByUserId('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('gm');
    expect(result[1].role).toBe('player');
  });

  it('should return archived campaigns with status "archived"', async () => {
    const now = new Date('2026-01-01T10:00:00Z');
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-3',
        name: 'Old Adventure',
        description: 'Finished',
        coverImageUrl: null,
        status: 'archived',
        gmUserId: 'user-1',
        playerCount: 3,
        lastSessionDate: now,
        createdAt: now,
        updatedAt: now,
        members: [{ role: 'gm' }],
      },
    ]);

    const result = await finder.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('archived');
    expect(result[0].name).toBe('Old Adventure');
  });

  it('should include correct playerCount and lastSessionDate', async () => {
    const sessionDate = new Date('2026-02-28T18:30:00Z');
    const createdDate = new Date('2026-01-15T09:00:00Z');
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-4',
        name: 'Test Campaign',
        description: 'Testing fields',
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'user-1',
        playerCount: 7,
        lastSessionDate: sessionDate,
        createdAt: createdDate,
        updatedAt: createdDate,
        members: [{ role: 'gm' }],
      },
    ]);

    const result = await finder.findByUserId('user-1');

    expect(result[0].playerCount).toBe(7);
    expect(result[0].lastSessionDate).toBe(sessionDate.toISOString());
    expect(result[0].createdAt).toBe(createdDate.toISOString());
  });
});
