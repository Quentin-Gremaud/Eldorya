import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApproveACharacterController } from '../controllers/approve-a-character.controller.js';
import { ApproveACharacterCommand } from '../../../character/character/commands/approve-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('ApproveACharacterController', () => {
  let controller: ApproveACharacterController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  beforeEach(async () => {
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApproveACharacterController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignAnnouncementsFinder,
        },
      ],
    }).compile();

    controller = module.get<ApproveACharacterController>(
      ApproveACharacterController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ApproveACharacterCommand with correct data', async () => {
    await controller.handle('campaign-456', 'char-123', 'gm-user-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ApproveACharacterCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.approvedBy).toBe('gm-user-1');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle(
      'campaign-456',
      'char-123',
      'gm-user-1',
    );

    expect(result).toBeUndefined();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle('campaign-456', 'char-123', 'gm-user-1'),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle('campaign-456', 'char-123', 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    await controller.handle('campaign-456', 'char-123', 'gm-user-1');

    expect(campaignAnnouncementsFinder.checkGmOwnership).toHaveBeenCalledWith(
      'campaign-456',
      'gm-user-1',
    );
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ApproveACharacterController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ApproveACharacterController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
