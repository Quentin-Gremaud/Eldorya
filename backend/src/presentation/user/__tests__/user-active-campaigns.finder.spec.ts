import { Test, TestingModule } from '@nestjs/testing';
import { CampaignStatusEnum } from '@prisma/client';
import { UserActiveCampaignsFinder } from '../finders/user-active-campaigns.finder';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const mockPrismaService = {
  campaign: {
    findMany: jest.fn(),
  },
};

describe('UserActiveCampaignsFinder', () => {
  let finder: UserActiveCampaignsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActiveCampaignsFinder,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    finder = module.get<UserActiveCampaignsFinder>(UserActiveCampaignsFinder);
    jest.clearAllMocks();
  });

  it('should return empty result when user has no active campaigns as GM', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([]);

    const result = await finder.findActiveByGmUserId('user-1');

    expect(result.count).toBe(0);
    expect(result.campaigns).toEqual([]);
  });

  it('should return active campaigns where user is GM', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([
      { id: 'campaign-1', name: 'Dragon Quest' },
      { id: 'campaign-2', name: 'Sword Coast' },
    ]);

    const result = await finder.findActiveByGmUserId('user-1');

    expect(result.count).toBe(2);
    expect(result.campaigns).toEqual([
      { id: 'campaign-1', name: 'Dragon Quest' },
      { id: 'campaign-2', name: 'Sword Coast' },
    ]);
  });

  it('should query only active campaigns for the given GM userId', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([]);

    await finder.findActiveByGmUserId('user-42');

    expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith({
      where: {
        gmUserId: 'user-42',
        status: CampaignStatusEnum.active,
      },
      select: {
        id: true,
        name: true,
      },
    });
  });

  it('should exclude archived campaigns (only return active)', async () => {
    mockPrismaService.campaign.findMany.mockResolvedValue([
      { id: 'campaign-1', name: 'Active Campaign' },
    ]);

    const result = await finder.findActiveByGmUserId('user-1');

    expect(result.count).toBe(1);
    expect(result.campaigns[0].name).toBe('Active Campaign');

    // Verify the query filters by status: 'active'
    const queryArg = mockPrismaService.campaign.findMany.mock.calls[0][0];
    expect(queryArg.where.status).toBe(CampaignStatusEnum.active);
  });
});
