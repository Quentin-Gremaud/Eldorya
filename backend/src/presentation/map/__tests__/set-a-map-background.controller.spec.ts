import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SetAMapBackgroundController } from '../controllers/set-a-map-background.controller.js';
import { SetMapBackgroundCommand } from '../../../world/map/commands/set-map-background.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';

describe('SetAMapBackgroundController', () => {
  let controller: SetAMapBackgroundController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock };
  let mapLevelQueryFinder: { findByCampaignId: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = 'gm-user-1';
  const backgroundImageUrl = 'https://cdn.example.com/campaigns/camp/maps/level/background/img.jpg';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    mapLevelQueryFinder = {
      findByCampaignId: jest.fn().mockResolvedValue([
        { id: mapLevelId, campaignId, name: 'World Map', parentId: null, depth: 0, backgroundImageUrl: null },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetAMapBackgroundController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: MapLevelFinder,
          useValue: mapLevelFinder,
        },
        {
          provide: MapLevelQueryFinder,
          useValue: mapLevelQueryFinder,
        },
      ],
    }).compile();

    controller = module.get(SetAMapBackgroundController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch SetMapBackgroundCommand with correct data', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { backgroundImageUrl },
      userId,
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(SetMapBackgroundCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.mapLevelId).toBe(mapLevelId);
    expect(command.backgroundImageUrl).toBe(backgroundImageUrl);
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(
      campaignId,
      mapLevelId,
      { backgroundImageUrl },
      userId,
    );

    expect(result).toBeUndefined();
  });

  it('should check GM ownership', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { backgroundImageUrl },
      userId,
    );

    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new NotFoundException());

    await expect(
      controller.handle(
        campaignId,
        mapLevelId,
        { backgroundImageUrl },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(
        campaignId,
        mapLevelId,
        { backgroundImageUrl },
        'non-gm-user',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when map level does not exist', async () => {
    mapLevelQueryFinder.findByCampaignId.mockResolvedValue([]);

    await expect(
      controller.handle(
        campaignId,
        mapLevelId,
        { backgroundImageUrl },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
