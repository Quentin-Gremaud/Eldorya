import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateACharacterController } from '../controllers/create-a-character.controller.js';
import { CreateACharacterCommand } from '../../../character/character/commands/create-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('CreateACharacterController', () => {
  let controller: CreateACharacterController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignFinder: { checkCampaignMembership: jest.Mock };

  beforeEach(async () => {
    campaignFinder = {
      checkCampaignMembership: jest
        .fn()
        .mockResolvedValue({ exists: true, isMember: true, isGm: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateACharacterController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignFinder,
        },
      ],
    }).compile();

    controller = module.get<CreateACharacterController>(
      CreateACharacterController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch CreateACharacterCommand with correct data', async () => {
    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: ['Fireball', 'Shield'],
    };

    await controller.handle('campaign-456', dto as any, 'user-player-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateACharacterCommand);
    expect(command.id).toBe('char-123');
    expect(command.userId).toBe('user-player-1');
    expect(command.campaignId).toBe('campaign-456');
    expect(command.name).toBe('Gandalf');
    expect(command.race).toBe('Human');
    expect(command.characterClass).toBe('Mage');
    expect(command.background).toBe('A wandering wizard');
    expect(command.stats).toEqual(dto.stats);
    expect(command.spells).toEqual(['Fireball', 'Shield']);
  });

  it('should return void (202 Accepted)', async () => {
    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: [],
    };

    const result = await controller.handle(
      'campaign-456',
      dto as any,
      'user-player-1',
    );

    expect(result).toBeUndefined();
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignFinder.checkCampaignMembership.mockResolvedValue({
      exists: false,
    });

    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: [],
    };

    await expect(
      controller.handle('campaign-456', dto as any, 'user-player-1'),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should pass isGm=false for regular players', async () => {
    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: [],
    };

    await controller.handle('campaign-456', dto as any, 'user-player-1');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.isGm).toBe(false);
  });

  it('should pass isGm=true when creator is the GM', async () => {
    campaignFinder.checkCampaignMembership.mockResolvedValue({
      exists: true,
      isMember: true,
      isGm: true,
    });

    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: [],
    };

    await controller.handle('campaign-456', dto as any, 'user-gm-1');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.isGm).toBe(true);
  });

  it('should throw ForbiddenException when user is not a member', async () => {
    campaignFinder.checkCampaignMembership.mockResolvedValue({
      exists: true,
      isMember: false,
    });

    const dto = {
      id: 'char-123',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      spells: [],
    };

    await expect(
      controller.handle('campaign-456', dto as any, 'user-player-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateACharacterController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateACharacterController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
