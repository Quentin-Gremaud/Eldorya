import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RevealFogZoneToAllController } from '../controllers/reveal-fog-zone-to-all.controller.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { RevealFogZoneToAllCommand } from '../../../world/fog-state/commands/reveal-fog-zone-to-all.command.js';

describe('RevealFogZoneToAllController', () => {
  let controller: RevealFogZoneToAllController;
  let commandBus: { execute: jest.Mock };
  let fogStateFinder: { checkGmAccess: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '660e8400-e29b-41d4-a716-446655440001';

  const validDto = {
    fogZoneId: '770e8400-e29b-41d4-a716-446655440002',
    mapLevelId: '990e8400-e29b-41d4-a716-446655440004',
    x: 10,
    y: 20,
    width: 100,
    height: 200,
    commandId: 'aa0e8400-e29b-41d4-a716-446655440005',
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    fogStateFinder = {
      checkGmAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevealFogZoneToAllController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: FogStateFinder, useValue: fogStateFinder },
      ],
    }).compile();

    controller = module.get<RevealFogZoneToAllController>(RevealFogZoneToAllController);
  });

  it('should dispatch RevealFogZoneToAllCommand with correct params', async () => {
    await controller.handle(campaignId, validDto, userId);

    expect(commandBus.execute).toHaveBeenCalledWith(
      new RevealFogZoneToAllCommand(
        campaignId,
        validDto.fogZoneId,
        validDto.mapLevelId,
        validDto.x,
        validDto.y,
        validDto.width,
        validDto.height,
      ),
    );
  });

  it('should return void (202 response with no body)', async () => {
    const result = await controller.handle(campaignId, validDto, userId);

    expect(result).toBeUndefined();
  });

  it('should check GM access before dispatching command', async () => {
    const callOrder: string[] = [];
    fogStateFinder.checkGmAccess.mockImplementation(async () => {
      callOrder.push('checkGmAccess');
    });
    commandBus.execute.mockImplementation(async () => {
      callOrder.push('execute');
    });

    await controller.handle(campaignId, validDto, userId);

    expect(callOrder).toEqual(['checkGmAccess', 'execute']);
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    fogStateFinder.checkGmAccess.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(campaignId, validDto, userId),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    fogStateFinder.checkGmAccess.mockRejectedValue(new NotFoundException());

    await expect(
      controller.handle(campaignId, validDto, userId),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should call checkGmAccess with campaignId and userId', async () => {
    await controller.handle(campaignId, validDto, userId);

    expect(fogStateFinder.checkGmAccess).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should not require playerId in the DTO', async () => {
    await controller.handle(campaignId, validDto, userId);

    const executedCommand = commandBus.execute.mock.calls[0][0] as RevealFogZoneToAllCommand;
    expect(executedCommand).not.toHaveProperty('playerId');
  });
});
