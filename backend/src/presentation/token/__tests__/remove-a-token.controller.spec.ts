import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { RemoveATokenController } from '../controllers/remove-a-token.controller.js';
import { RemoveTokenCommand } from '../../../world/token/commands/remove-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

describe('RemoveATokenController', () => {
  let controller: RemoveATokenController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const userId = 'gm-user-1';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemoveATokenController],
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

    controller = module.get<RemoveATokenController>(RemoveATokenController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RemoveTokenCommand with correct data', async () => {
    await controller.handle(campaignId, tokenId, userId);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RemoveTokenCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.tokenId).toBe(tokenId);
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(campaignId, tokenId, userId);
    expect(result).toBeUndefined();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(campaignId, tokenId, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
