import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CreateAMapLevelController } from '../controllers/create-a-map-level.controller.js';
import { CreateMapLevelCommand } from '../../../world/map/commands/create-map-level.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('CreateAMapLevelController', () => {
  let controller: CreateAMapLevelController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapLevelFinder: { checkGmOwnership: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 'gm-user-1';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateAMapLevelController],
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

    controller = module.get<CreateAMapLevelController>(
      CreateAMapLevelController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch CreateMapLevelCommand with correct data', async () => {
    await controller.handle(campaignId, {
      mapLevelId,
      name: 'World',
      parentId: undefined,
      commandId: undefined,
    }, userId);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateMapLevelCommand);
    expect(command.campaignId).toBe(campaignId);
    expect(command.mapLevelId).toBe(mapLevelId);
    expect(command.name).toBe('World');
    expect(command.parentId).toBeNull();
  });

  it('should pass parentId when provided', async () => {
    const parentId = '770e8400-e29b-41d4-a716-446655440000';
    await controller.handle(campaignId, {
      mapLevelId,
      name: 'City',
      parentId,
      commandId: undefined,
    }, userId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.parentId).toBe(parentId);
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(campaignId, {
      mapLevelId,
      name: 'World',
      parentId: undefined,
      commandId: undefined,
    }, userId);

    expect(result).toBeUndefined();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle(campaignId, {
        mapLevelId,
        name: 'World',
        parentId: undefined,
        commandId: undefined,
      }, userId),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle(campaignId, {
        mapLevelId,
        name: 'World',
        parentId: undefined,
        commandId: undefined,
      }, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    await controller.handle(campaignId, {
      mapLevelId,
      name: 'World',
      parentId: undefined,
      commandId: undefined,
    }, userId);

    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(
      campaignId,
      userId,
    );
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateAMapLevelController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateAMapLevelController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
