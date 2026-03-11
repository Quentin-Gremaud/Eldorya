import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RevealFogZoneController } from '../controllers/reveal-fog-zone.controller.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { RevealFogZoneCommand } from '../../../world/fog-state/commands/reveal-fog-zone.command.js';

describe('RevealFogZoneController', () => {
  let controller: RevealFogZoneController;
  let commandBus: { execute: jest.Mock };
  let fogStateFinder: { checkGmAccess: jest.Mock; checkPlayerInCampaign: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '660e8400-e29b-41d4-a716-446655440001';

  const validDto = {
    fogZoneId: '770e8400-e29b-41d4-a716-446655440002',
    playerId: '880e8400-e29b-41d4-a716-446655440003',
    mapLevelId: '990e8400-e29b-41d4-a716-446655440004',
    x: 10,
    y: 20,
    width: 100,
    height: 200,
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    fogStateFinder = {
      checkGmAccess: jest.fn().mockResolvedValue(undefined),
      checkPlayerInCampaign: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevealFogZoneController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: FogStateFinder, useValue: fogStateFinder },
      ],
    }).compile();

    controller = module.get<RevealFogZoneController>(RevealFogZoneController);
  });

  it('should dispatch RevealFogZoneCommand with correct params', async () => {
    await controller.handle(campaignId, validDto, userId);

    expect(commandBus.execute).toHaveBeenCalledWith(
      new RevealFogZoneCommand(
        campaignId,
        validDto.playerId,
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

  it('should check GM access and player membership before dispatching command', async () => {
    const callOrder: string[] = [];
    fogStateFinder.checkGmAccess.mockImplementation(async () => {
      callOrder.push('checkGmAccess');
    });
    fogStateFinder.checkPlayerInCampaign.mockImplementation(async () => {
      callOrder.push('checkPlayerInCampaign');
    });
    commandBus.execute.mockImplementation(async () => {
      callOrder.push('execute');
    });

    await controller.handle(campaignId, validDto, userId);

    expect(callOrder).toEqual(['checkGmAccess', 'checkPlayerInCampaign', 'execute']);
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

  it('should call checkPlayerInCampaign with campaignId and playerId', async () => {
    await controller.handle(campaignId, validDto, userId);

    expect(fogStateFinder.checkPlayerInCampaign).toHaveBeenCalledWith(
      campaignId,
      validDto.playerId,
    );
  });

  it('should throw NotFoundException when playerId is not a player in the campaign', async () => {
    fogStateFinder.checkPlayerInCampaign.mockRejectedValue(
      new NotFoundException('Player not found in campaign'),
    );

    await expect(
      controller.handle(campaignId, validDto, userId),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
