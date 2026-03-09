import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetCampaignDetailController } from '../controllers/get-campaign-detail.controller';
import { CampaignDetailFinder, CampaignDetailResult } from '../finders/campaign-detail.finder';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator';

describe('GetCampaignDetailController', () => {
  let controller: GetCampaignDetailController;
  let finder: { findCampaignDetail: jest.Mock };

  const campaignId = 'campaign-123';
  const gmUserId = 'gm-user-1';
  const playerUserId = 'player-user-1';
  const now = new Date('2026-03-01T10:00:00Z');

  const baseResult: CampaignDetailResult = {
    campaign: {
      id: campaignId,
      name: 'Test Campaign',
      description: 'A great adventure',
      coverImageUrl: 'https://example.com/cover.jpg',
      status: 'active',
      gmUserId,
      playerCount: 4,
      lastSessionDate: now,
      createdAt: now,
    },
    membership: null,
    gmDisplayName: 'John Doe',
  };

  beforeEach(async () => {
    finder = {
      findCampaignDetail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetCampaignDetailController],
      providers: [
        { provide: CampaignDetailFinder, useValue: finder },
      ],
    }).compile();

    controller = module.get<GetCampaignDetailController>(
      GetCampaignDetailController,
    );
  });

  it('should return campaign details when user is the GM', async () => {
    finder.findCampaignDetail.mockResolvedValue(baseResult);

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data.id).toBe(campaignId);
    expect(result.data.name).toBe('Test Campaign');
    expect(result.data.userRole).toBe('gm');
    expect(result.data.gmDisplayName).toBe('John Doe');
    expect(result.data.playerCount).toBe(4);
    expect(result.data.lastSessionDate).toBe(now.toISOString());
  });

  it('should return campaign details when user is a player member', async () => {
    finder.findCampaignDetail.mockResolvedValue({
      ...baseResult,
      membership: { role: 'player' },
    });

    const result = await controller.handle(campaignId, playerUserId);

    expect(result.data.id).toBe(campaignId);
    expect(result.data.userRole).toBe('player');
    expect(result.data.gmDisplayName).toBe('John Doe');
  });

  it('should throw ForbiddenException when user is not GM nor member', async () => {
    finder.findCampaignDetail.mockResolvedValue(baseResult);

    await expect(
      controller.handle(campaignId, 'stranger-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    finder.findCampaignDetail.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return null lastSessionDate when campaign has no sessions', async () => {
    finder.findCampaignDetail.mockResolvedValue({
      ...baseResult,
      campaign: { ...baseResult.campaign, lastSessionDate: null },
      membership: { role: 'player' },
    });

    const result = await controller.handle(campaignId, playerUserId);

    expect(result.data.lastSessionDate).toBeNull();
  });

  it('should use gmDisplayName from finder result', async () => {
    finder.findCampaignDetail.mockResolvedValue({
      ...baseResult,
      gmDisplayName: 'gm@example.com',
      membership: { role: 'player' },
    });

    const result = await controller.handle(campaignId, playerUserId);

    expect(result.data.gmDisplayName).toBe('gm@example.com');
  });

  it('should call finder with campaignId and userId', async () => {
    finder.findCampaignDetail.mockResolvedValue(baseResult);

    await controller.handle(campaignId, gmUserId);

    expect(finder.findCampaignDetail).toHaveBeenCalledWith(campaignId, gmUserId);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignDetailController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignDetailController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
