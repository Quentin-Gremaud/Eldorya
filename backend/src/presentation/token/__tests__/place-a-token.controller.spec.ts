import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlaceATokenController } from '../controllers/place-a-token.controller.js';
import { PlaceTokenCommand } from '../../../world/token/commands/place-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

describe('PlaceATokenController', () => {
  let controller: PlaceATokenController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock; checkMapLevelExists: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 'gm-user-1';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
      checkMapLevelExists: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaceATokenController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: MapLevelFinder,
          useValue: mapLevelFinder,
        },
      ],
    }).compile();

    controller = module.get<PlaceATokenController>(PlaceATokenController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch PlaceTokenCommand with correct data', async () => {
    await controller.handle(
      campaignId,
      { tokenId, mapLevelId, x: 100, y: 200, tokenType: 'player', label: 'Warrior', commandId: undefined },
      userId,
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(PlaceTokenCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.tokenId).toBe(tokenId);
    expect(command.mapLevelId).toBe(mapLevelId);
    expect(command.x).toBe(100);
    expect(command.y).toBe(200);
    expect(command.tokenType).toBe('player');
    expect(command.label).toBe('Warrior');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(
      campaignId,
      { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'npc', label: 'Guard', commandId: undefined },
      userId,
    );
    expect(result).toBeUndefined();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(
        campaignId,
        { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'player', label: 'Test', commandId: undefined },
        'non-gm-user',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new NotFoundException());

    await expect(
      controller.handle(
        campaignId,
        { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'player', label: 'Test', commandId: undefined },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    await controller.handle(
      campaignId,
      { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'player', label: 'Test', commandId: undefined },
      userId,
    );

    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should call checkMapLevelExists before dispatching command', async () => {
    await controller.handle(
      campaignId,
      { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'player', label: 'Test', commandId: undefined },
      userId,
    );

    expect(mapLevelFinder.checkMapLevelExists).toHaveBeenCalledWith(campaignId, mapLevelId);
  });

  it('should throw NotFoundException when map level does not exist', async () => {
    mapLevelFinder.checkMapLevelExists.mockRejectedValue(new NotFoundException('Map level not found'));

    await expect(
      controller.handle(
        campaignId,
        { tokenId, mapLevelId, x: 0, y: 0, tokenType: 'player', label: 'Test', commandId: undefined },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
