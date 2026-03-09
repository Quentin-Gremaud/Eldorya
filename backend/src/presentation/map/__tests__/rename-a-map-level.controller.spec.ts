import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';
import { RenameAMapLevelController } from '../controllers/rename-a-map-level.controller.js';
import { RenameMapLevelCommand } from '../../../world/map/commands/rename-map-level.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';

describe('RenameAMapLevelController', () => {
  let controller: RenameAMapLevelController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = 'gm-user-1';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenameAMapLevelController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: MapLevelFinder, useValue: mapLevelFinder },
      ],
    }).compile();

    controller = module.get<RenameAMapLevelController>(
      RenameAMapLevelController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RenameMapLevelCommand with correct data', async () => {
    await controller.handle(campaignId, mapLevelId, {
      name: 'New World',
      commandId: undefined,
    }, userId);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RenameMapLevelCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.mapLevelId).toBe(mapLevelId);
    expect(command.newName).toBe('New World');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(campaignId, mapLevelId, {
      name: 'New World',
      commandId: undefined,
    }, userId);

    expect(result).toBeUndefined();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle(campaignId, mapLevelId, {
        name: 'New World',
        commandId: undefined,
      }, 'non-gm'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle(campaignId, mapLevelId, {
        name: 'New World',
        commandId: undefined,
      }, userId),
    ).rejects.toThrow(NotFoundException);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        RenameAMapLevelController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        RenameAMapLevelController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
