import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModifyCharacterByGmController } from '../controllers/modify-character-by-gm.controller.js';
import { ModifyCharacterByGmCommand } from '../../../character/character/commands/modify-character-by-gm.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';
import { ModifyCharacterByGmDto } from '../dto/modify-character-by-gm.dto.js';

describe('ModifyCharacterByGmController', () => {
  let controller: ModifyCharacterByGmController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  beforeEach(async () => {
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModifyCharacterByGmController],
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

    controller = module.get<ModifyCharacterByGmController>(
      ModifyCharacterByGmController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ModifyCharacterByGmCommand with correct data', async () => {
    const dto = new ModifyCharacterByGmDto();
    dto.name = 'Gandalf the White';
    dto.race = 'Elf';

    await controller.handle('campaign-456', 'char-123', 'gm-user-1', dto);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ModifyCharacterByGmCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.modifiedBy).toBe('gm-user-1');
    expect(command.modifications.name).toBe('Gandalf the White');
    expect(command.modifications.race).toBe('Elf');
  });

  it('should return void (202 Accepted)', async () => {
    const dto = new ModifyCharacterByGmDto();
    dto.name = 'Gandalf the White';

    const result = await controller.handle(
      'campaign-456',
      'char-123',
      'gm-user-1',
      dto,
    );

    expect(result).toBeUndefined();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    const dto = new ModifyCharacterByGmDto();
    dto.name = 'Gandalf the White';

    await expect(
      controller.handle('campaign-456', 'char-123', 'non-gm-user', dto),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    const dto = new ModifyCharacterByGmDto();
    dto.name = 'Gandalf the White';

    await expect(
      controller.handle('campaign-456', 'char-123', 'gm-user-1', dto),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    const dto = new ModifyCharacterByGmDto();
    dto.name = 'Gandalf the White';

    await controller.handle('campaign-456', 'char-123', 'gm-user-1', dto);

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
        ModifyCharacterByGmController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ModifyCharacterByGmController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
