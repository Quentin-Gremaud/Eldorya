import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LinkALocationTokenController } from '../controllers/link-a-location-token.controller.js';
import { LinkLocationTokenCommand } from '../../../world/token/commands/link-location-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

describe('LinkALocationTokenController', () => {
  let controller: LinkALocationTokenController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock; checkMapLevelExists: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 'gm-user-1';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const destinationMapLevelId = '880e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
      checkMapLevelExists: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkALocationTokenController],
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

    controller = module.get<LinkALocationTokenController>(LinkALocationTokenController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch LinkLocationTokenCommand with correct data', async () => {
    await controller.handle(
      campaignId,
      tokenId,
      { destinationMapLevelId },
      userId,
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(LinkLocationTokenCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.tokenId).toBe(tokenId);
    expect(command.destinationMapLevelId).toBe(destinationMapLevelId);
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(
      campaignId,
      tokenId,
      { destinationMapLevelId },
      userId,
    );
    expect(result).toBeUndefined();
  });

  it('should check GM ownership before dispatching', async () => {
    await controller.handle(campaignId, tokenId, { destinationMapLevelId }, userId);
    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should check destination map level exists before dispatching', async () => {
    await controller.handle(campaignId, tokenId, { destinationMapLevelId }, userId);
    expect(mapLevelFinder.checkMapLevelExists).toHaveBeenCalledWith(campaignId, destinationMapLevelId);
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(campaignId, tokenId, { destinationMapLevelId }, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when destination map level does not exist', async () => {
    mapLevelFinder.checkMapLevelExists.mockRejectedValue(new NotFoundException('Map level not found'));

    await expect(
      controller.handle(campaignId, tokenId, { destinationMapLevelId }, userId),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
