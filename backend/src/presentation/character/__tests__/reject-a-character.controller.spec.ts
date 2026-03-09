import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RejectACharacterController } from '../controllers/reject-a-character.controller.js';
import { RejectACharacterCommand } from '../../../character/character/commands/reject-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('RejectACharacterController', () => {
  let controller: RejectACharacterController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  beforeEach(async () => {
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectACharacterController],
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

    controller = module.get<RejectACharacterController>(
      RejectACharacterController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RejectACharacterCommand with correct data', async () => {
    const dto = { reason: 'Needs more detail' } as any;

    await controller.handle('campaign-456', 'char-123', dto, 'gm-user-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RejectACharacterCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.rejectedBy).toBe('gm-user-1');
    expect(command.reason).toBe('Needs more detail');
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { reason: 'Needs more detail' } as any;

    const result = await controller.handle(
      'campaign-456',
      'char-123',
      dto,
      'gm-user-1',
    );

    expect(result).toBeUndefined();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    const dto = { reason: 'Needs more detail' } as any;

    await expect(
      controller.handle('campaign-456', 'char-123', dto, 'gm-user-1'),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    const dto = { reason: 'Needs more detail' } as any;

    await expect(
      controller.handle('campaign-456', 'char-123', dto, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    const dto = { reason: 'Needs more detail' } as any;

    await controller.handle('campaign-456', 'char-123', dto, 'gm-user-1');

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
        RejectACharacterController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        RejectACharacterController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
