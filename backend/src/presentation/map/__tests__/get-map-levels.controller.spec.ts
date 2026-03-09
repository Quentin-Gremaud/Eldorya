import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetMapLevelsController } from '../controllers/get-map-levels.controller.js';
import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('GetMapLevelsController', () => {
  let controller: GetMapLevelsController;
  let mapLevelQueryFinder: { findByCampaignId: jest.Mock };
  let mapLevelFinder: { checkGmOwnership: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 'gm-user-1';

  beforeEach(async () => {
    mapLevelQueryFinder = {
      findByCampaignId: jest.fn().mockResolvedValue([]),
    };
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetMapLevelsController],
      providers: [
        { provide: MapLevelQueryFinder, useValue: mapLevelQueryFinder },
        { provide: MapLevelFinder, useValue: mapLevelFinder },
      ],
    }).compile();

    controller = module.get<GetMapLevelsController>(GetMapLevelsController);
  });

  it('should return { data: [] } for empty campaign', async () => {
    const result = await controller.handle(campaignId, userId);
    expect(result).toEqual({ data: [] });
  });

  it('should return map levels wrapped in data', async () => {
    const levels = [
      { id: 'l1', campaignId, name: 'World', parentId: null, depth: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    mapLevelQueryFinder.findByCampaignId.mockResolvedValue(levels);

    const result = await controller.handle(campaignId, userId);
    expect(result).toEqual({ data: levels });
  });

  it('should check GM ownership before querying', async () => {
    await controller.handle(campaignId, userId);

    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(
      campaignId,
      userId,
    );
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new NotFoundException());

    await expect(controller.handle(campaignId, userId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mapLevelQueryFinder.findByCampaignId).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(controller.handle(campaignId, 'not-gm')).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetMapLevelsController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetMapLevelsController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
