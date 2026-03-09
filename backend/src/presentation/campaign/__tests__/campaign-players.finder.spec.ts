import { Test, TestingModule } from '@nestjs/testing';
import { CampaignPlayersFinder } from '../finders/campaign-players.finder';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('CampaignPlayersFinder', () => {
  let finder: CampaignPlayersFinder;
  let prisma: {
    campaign: { findUnique: jest.Mock };
    campaignMember: { findMany: jest.Mock };
    invitation: { findFirst: jest.Mock };
    user: { findMany: jest.Mock };
  };

  const campaignId = 'campaign-123';
  const gmUserId = 'gm-user-1';
  const now = new Date('2026-03-01T10:00:00Z');
  const earlier = new Date('2026-02-15T08:00:00Z');

  beforeEach(async () => {
    prisma = {
      campaign: { findUnique: jest.fn() },
      campaignMember: { findMany: jest.fn() },
      invitation: { findFirst: jest.fn() },
      user: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignPlayersFinder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    finder = module.get<CampaignPlayersFinder>(CampaignPlayersFinder);
  });

  function setupCampaignExists() {
    prisma.campaign.findUnique.mockResolvedValue({ gmUserId });
  }

  it('should return campaign null when campaign does not exist', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.campaign).toBeNull();
    expect(result.players).toEqual([]);
    expect(result.playerCount).toBe(0);
  });

  it('should return campaign gmUserId when campaign exists', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.campaign).toEqual({ gmUserId });
  });

  it('should return empty players array for campaign with no players', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.players).toEqual([]);
    expect(result.playerCount).toBe(0);
    expect(result.allReady).toBe(false);
    expect(result.hasActiveInvitation).toBe(false);
  });

  it('should return players with correct display names', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-1', campaignId, role: 'player', joinedAt: now },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
    ]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.players).toHaveLength(1);
    expect(result.players[0].displayName).toBe('Alice Smith');
    expect(result.players[0].userId).toBe('user-1');
  });

  it('should fallback to email when no first/last name', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-1', campaignId, role: 'player', joinedAt: now },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', firstName: null, lastName: null, email: 'alice@example.com' },
    ]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.players[0].displayName).toBe('alice@example.com');
  });

  it('should return "Unknown" when user not found', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-missing', campaignId, role: 'player', joinedAt: now },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.players[0].displayName).toBe('Unknown');
  });

  it('should compute status as "joined" for all players (until Epic 3)', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-1', campaignId, role: 'player', joinedAt: now },
      { userId: 'user-2', campaignId, role: 'player', joinedAt: earlier },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', firstName: 'Alice', lastName: null, email: 'alice@test.com' },
      { id: 'user-2', firstName: 'Bob', lastName: null, email: 'bob@test.com' },
    ]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.players).toHaveLength(2);
    expect(result.players[0].status).toBe('joined');
    expect(result.players[1].status).toBe('joined');
  });

  it('should return hasActiveInvitation true when active invitation exists', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue({ id: 'inv-1' });

    const result = await finder.findByCampaignId(campaignId);

    expect(result.hasActiveInvitation).toBe(true);
  });

  it('should return hasActiveInvitation false when no active invitation', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.hasActiveInvitation).toBe(false);
  });

  it('should compute allReady as false when all players are "joined"', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-1', campaignId, role: 'player', joinedAt: now },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', firstName: 'Alice', lastName: null, email: 'alice@test.com' },
    ]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.allReady).toBe(false);
  });

  it('should compute allReady as false when no players exist', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.allReady).toBe(false);
  });

  it('should return correct playerCount', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([
      { userId: 'user-1', campaignId, role: 'player', joinedAt: earlier },
      { userId: 'user-2', campaignId, role: 'player', joinedAt: now },
      { userId: 'user-3', campaignId, role: 'player', joinedAt: now },
    ]);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', firstName: 'A', lastName: null, email: 'a@test.com' },
      { id: 'user-2', firstName: 'B', lastName: null, email: 'b@test.com' },
      { id: 'user-3', firstName: 'C', lastName: null, email: 'c@test.com' },
    ]);

    const result = await finder.findByCampaignId(campaignId);

    expect(result.playerCount).toBe(3);
  });

  it('should query campaign with correct campaignId', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await finder.findByCampaignId(campaignId);

    expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
      where: { id: campaignId },
      select: { gmUserId: true },
    });
  });

  it('should query campaignMember with role player and order by joinedAt ASC', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    await finder.findByCampaignId(campaignId);

    expect(prisma.campaignMember.findMany).toHaveBeenCalledWith({
      where: { campaignId, role: 'player' },
      orderBy: { joinedAt: 'asc' },
    });
  });

  it('should query invitation with campaignId and active status', async () => {
    setupCampaignExists();
    prisma.campaignMember.findMany.mockResolvedValue([]);
    prisma.invitation.findFirst.mockResolvedValue(null);

    await finder.findByCampaignId(campaignId);

    expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
      where: { campaignId, status: 'active' },
      select: { id: true },
    });
  });

  it('should not query members or invitations when campaign does not exist', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await finder.findByCampaignId(campaignId);

    expect(prisma.campaignMember.findMany).not.toHaveBeenCalled();
    expect(prisma.invitation.findFirst).not.toHaveBeenCalled();
  });
});
