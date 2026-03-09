import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { GetTokensController } from '../controllers/get-tokens.controller.js';
import { TokenFinder, type TokenResult } from '../finders/token.finder.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

describe('GetTokensController', () => {
  let controller: GetTokensController;
  let tokenFinder: { findByCampaignAndMapLevel: jest.Mock };
  let mapLevelFinder: { checkCampaignAccess: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = 'gm-user-1';

  const mockTokens: TokenResult[] = [
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      campaignId,
      mapLevelId,
      x: 100,
      y: 200,
      tokenType: 'player',
      label: 'Warrior',
      createdAt: '2026-03-09T10:00:00.000Z',
      updatedAt: '2026-03-09T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    tokenFinder = {
      findByCampaignAndMapLevel: jest.fn().mockResolvedValue(mockTokens),
    };
    mapLevelFinder = {
      checkCampaignAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetTokensController],
      providers: [
        { provide: TokenFinder, useValue: tokenFinder },
        { provide: MapLevelFinder, useValue: mapLevelFinder },
      ],
    }).compile();

    controller = module.get<GetTokensController>(GetTokensController);
  });

  it('should return { data: tokens } for valid request', async () => {
    const result = await controller.handle(campaignId, mapLevelId, userId);

    expect(result).toEqual({ data: mockTokens });
    expect(tokenFinder.findByCampaignAndMapLevel).toHaveBeenCalledWith(campaignId, mapLevelId);
  });

  it('should call checkCampaignAccess before fetching', async () => {
    await controller.handle(campaignId, mapLevelId, userId);

    expect(mapLevelFinder.checkCampaignAccess).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should throw ForbiddenException when user has no campaign access', async () => {
    mapLevelFinder.checkCampaignAccess.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(campaignId, mapLevelId, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(tokenFinder.findByCampaignAndMapLevel).not.toHaveBeenCalled();
  });
});
