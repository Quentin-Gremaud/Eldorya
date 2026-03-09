import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetCampaignPlayersController } from '../controllers/get-campaign-players.controller';
import { CampaignPlayersFinder } from '../finders/campaign-players.finder';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator';

describe('GetCampaignPlayersController', () => {
  let controller: GetCampaignPlayersController;
  let finder: { findByCampaignId: jest.Mock };

  const campaignId = 'campaign-123';
  const gmUserId = 'gm-user-1';
  const now = new Date('2026-03-01T10:00:00Z');

  beforeEach(async () => {
    finder = { findByCampaignId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetCampaignPlayersController],
      providers: [
        { provide: CampaignPlayersFinder, useValue: finder },
      ],
    }).compile();

    controller = module.get<GetCampaignPlayersController>(
      GetCampaignPlayersController,
    );
  });

  it('should return 200 with player data when user is GM', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: { gmUserId },
      players: [
        {
          userId: 'player-1',
          displayName: 'Alice Smith',
          email: 'alice@test.com',
          status: 'joined',
          joinedAt: now,
        },
      ],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 1,
    });

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data.players).toHaveLength(1);
    expect(result.data.players[0].userId).toBe('player-1');
    expect(result.data.players[0].displayName).toBe('Alice Smith');
    expect(result.data.players[0].status).toBe('joined');
    expect(result.data.players[0].joinedAt).toBe(now.toISOString());
    expect(result.data.hasActiveInvitation).toBe(false);
    expect(result.data.allReady).toBe(false);
    expect(result.data.playerCount).toBe(1);
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: { gmUserId: 'other-gm' },
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
    });

    await expect(
      controller.handle(campaignId, 'not-the-gm'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: null,
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
    });

    await expect(
      controller.handle(campaignId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return empty players array for campaign with no players', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: { gmUserId },
      players: [],
      hasActiveInvitation: true,
      allReady: false,
      playerCount: 0,
    });

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data.players).toEqual([]);
    expect(result.data.playerCount).toBe(0);
    expect(result.data.hasActiveInvitation).toBe(true);
  });

  it('should call finder with the correct campaignId', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: { gmUserId },
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
    });

    await controller.handle(campaignId, gmUserId);

    expect(finder.findByCampaignId).toHaveBeenCalledWith(campaignId);
  });

  it('should not access player data when campaign does not exist', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: null,
      players: [
        {
          userId: 'player-1',
          displayName: 'Alice',
          email: 'alice@test.com',
          status: 'joined',
          joinedAt: now,
        },
      ],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 1,
    });

    await expect(
      controller.handle(campaignId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not return player data when user is not GM', async () => {
    finder.findByCampaignId.mockResolvedValue({
      campaign: { gmUserId: 'other-gm' },
      players: [
        {
          userId: 'player-1',
          displayName: 'Alice',
          email: 'alice@test.com',
          status: 'joined',
          joinedAt: now,
        },
      ],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 1,
    });

    await expect(
      controller.handle(campaignId, 'attacker-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected by global ClerkAuthGuard (unauthenticated requests get 401)', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignPlayersController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignPlayersController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
