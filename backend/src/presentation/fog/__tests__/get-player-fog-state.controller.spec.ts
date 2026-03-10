import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPlayerFogStateController } from '../controllers/get-player-fog-state.controller.js';
import { FogStateFinder, type FogZoneResult } from '../finders/fog-state.finder.js';

describe('GetPlayerFogStateController', () => {
  let controller: GetPlayerFogStateController;
  let fogStateFinder: {
    findRevealedZones: jest.Mock;
    checkPlayerOrGmAccess: jest.Mock;
  };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = '770e8400-e29b-41d4-a716-446655440002';
  const userId = playerId; // player querying own fog state

  const mockZones: FogZoneResult[] = [
    {
      id: '880e8400-e29b-41d4-a716-446655440003',
      mapLevelId,
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      revealedAt: '2026-03-10T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    fogStateFinder = {
      findRevealedZones: jest.fn().mockResolvedValue(mockZones),
      checkPlayerOrGmAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPlayerFogStateController],
      providers: [
        { provide: FogStateFinder, useValue: fogStateFinder },
      ],
    }).compile();

    controller = module.get<GetPlayerFogStateController>(GetPlayerFogStateController);
  });

  it('should return { data: zones } for valid request', async () => {
    const result = await controller.handle(campaignId, mapLevelId, playerId, userId);

    expect(result).toEqual({ data: mockZones });
    expect(fogStateFinder.checkPlayerOrGmAccess).toHaveBeenCalledWith(
      campaignId,
      playerId,
      userId,
    );
    expect(fogStateFinder.findRevealedZones).toHaveBeenCalledWith(
      campaignId,
      mapLevelId,
      playerId,
    );
  });

  it('should return empty array when no zones exist', async () => {
    fogStateFinder.findRevealedZones.mockResolvedValue([]);

    const result = await controller.handle(campaignId, mapLevelId, playerId, userId);

    expect(result).toEqual({ data: [] });
  });

  it('should throw ForbiddenException when user is not the player and not the GM', async () => {
    const otherUserId = 'other-user-id';
    fogStateFinder.checkPlayerOrGmAccess.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(campaignId, mapLevelId, playerId, otherUserId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    fogStateFinder.checkPlayerOrGmAccess.mockRejectedValue(new NotFoundException());

    await expect(
      controller.handle(campaignId, mapLevelId, playerId, userId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should call checkPlayerOrGmAccess before findRevealedZones', async () => {
    const callOrder: string[] = [];
    fogStateFinder.checkPlayerOrGmAccess.mockImplementation(async () => {
      callOrder.push('checkAccess');
    });
    fogStateFinder.findRevealedZones.mockImplementation(async () => {
      callOrder.push('findZones');
      return mockZones;
    });

    await controller.handle(campaignId, mapLevelId, playerId, userId);

    expect(callOrder).toEqual(['checkAccess', 'findZones']);
  });
});
