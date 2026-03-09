import { Test, TestingModule } from '@nestjs/testing';
import { PlayerCampaignsFinder } from '../finders/player-campaigns.finder';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const mockPrismaService = {
  campaign: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

describe('PlayerCampaignsFinder', () => {
  let finder: PlayerCampaignsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerCampaignsFinder,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    finder = module.get<PlayerCampaignsFinder>(PlayerCampaignsFinder);
    jest.clearAllMocks();
  });

  it('should return empty array when user has no player campaigns', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([]);

    const result = await finder.findPlayerCampaigns('user-1');

    expect(result).toEqual([]);
    expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          members: {
            some: {
              userId: 'user-1',
              role: 'player',
            },
          },
        },
      }),
    );
    expect(mockPrismaService.user.findMany).not.toHaveBeenCalled();
  });

  it('should return campaigns for a player with GM display name', async () => {
    const sessionDate = new Date('2026-03-01T10:00:00Z');
    const createdDate = new Date('2026-02-01T10:00:00Z');

    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'Dragon Quest',
        description: 'An epic adventure',
        coverImageUrl: 'https://example.com/cover.jpg',
        status: 'active',
        gmUserId: 'gm-user-1',
        playerCount: 4,
        lastSessionDate: sessionDate,
        createdAt: createdDate,
      },
    ]);

    mockPrismaService.user.findMany.mockResolvedValue([
      {
        id: 'gm-user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    ]);

    const result = await finder.findPlayerCampaigns('player-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('campaign-1');
    expect(result[0].name).toBe('Dragon Quest');
    expect(result[0].gmDisplayName).toBe('John Doe');
    expect(result[0].role).toBe('player');
    expect(result[0].playerCount).toBe(4);
    expect(result[0].lastSessionDate).toBe(sessionDate.toISOString());
  });

  it('should exclude campaigns where user is GM only (filter uses role=player)', async () => {
    const createdDate = new Date('2026-02-01T10:00:00Z');

    // Simulate Prisma returning only player campaigns (GM-only campaigns are filtered by the query)
    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'player-campaign',
        name: 'I Play Here',
        description: null,
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'other-gm',
        playerCount: 3,
        lastSessionDate: null,
        createdAt: createdDate,
      },
    ]);

    mockPrismaService.user.findMany.mockResolvedValue([
      { id: 'other-gm', firstName: 'GM', lastName: null, email: 'gm@test.com' },
    ]);

    const result = await finder.findPlayerCampaigns('user-1');

    // Only the player campaign is returned, GM-only campaign is excluded by the query filter
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('player-campaign');
    expect(result[0].role).toBe('player');
    expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          members: {
            some: {
              userId: 'user-1',
              role: 'player',
            },
          },
        },
      }),
    );
  });

  it('should use GM email as display name when firstName/lastName are missing', async () => {
    const createdDate = new Date('2026-02-01T10:00:00Z');

    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'Test Campaign',
        description: null,
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'gm-user-2',
        playerCount: 2,
        lastSessionDate: null,
        createdAt: createdDate,
      },
    ]);

    mockPrismaService.user.findMany.mockResolvedValue([
      {
        id: 'gm-user-2',
        firstName: null,
        lastName: null,
        email: 'gm@example.com',
      },
    ]);

    const result = await finder.findPlayerCampaigns('player-1');

    expect(result[0].gmDisplayName).toBe('gm@example.com');
  });

  it('should return "Unknown" when GM user is not found', async () => {
    const createdDate = new Date('2026-02-01T10:00:00Z');

    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'Orphan Campaign',
        description: null,
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'deleted-gm',
        playerCount: 1,
        lastSessionDate: null,
        createdAt: createdDate,
      },
    ]);

    mockPrismaService.user.findMany.mockResolvedValue([]);

    const result = await finder.findPlayerCampaigns('player-1');

    expect(result[0].gmDisplayName).toBe('Unknown');
  });

  it('should order results by lastSessionDate DESC', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([]);

    await finder.findPlayerCampaigns('user-1');

    expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { lastSessionDate: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
      }),
    );
  });

  it('should handle multiple campaigns with different GMs', async () => {
    const createdDate = new Date('2026-02-01T10:00:00Z');

    mockPrismaService.campaign.findMany.mockResolvedValue([
      {
        id: 'campaign-1',
        name: 'Campaign A',
        description: null,
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'gm-1',
        playerCount: 3,
        lastSessionDate: new Date('2026-03-01T10:00:00Z'),
        createdAt: createdDate,
      },
      {
        id: 'campaign-2',
        name: 'Campaign B',
        description: 'Another game',
        coverImageUrl: null,
        status: 'active',
        gmUserId: 'gm-2',
        playerCount: 5,
        lastSessionDate: null,
        createdAt: createdDate,
      },
    ]);

    mockPrismaService.user.findMany.mockResolvedValue([
      { id: 'gm-1', firstName: 'Alice', lastName: null, email: 'alice@test.com' },
      { id: 'gm-2', firstName: 'Bob', lastName: 'Smith', email: 'bob@test.com' },
    ]);

    const result = await finder.findPlayerCampaigns('player-1');

    expect(result).toHaveLength(2);
    expect(result[0].gmDisplayName).toBe('Alice');
    expect(result[1].gmDisplayName).toBe('Bob Smith');
    expect(result.every((c) => c.role === 'player')).toBe(true);
  });
});
