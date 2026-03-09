import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetCharacterForGmController } from '../controllers/get-character-for-gm.controller.js';
import { CharacterForGmFinder } from '../finders/character-for-gm.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('GetCharacterForGmController', () => {
  let controller: GetCharacterForGmController;
  let characterForGmFinder: { findByIdAndCampaign: jest.Mock };
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  const characterData = {
    id: 'char-123',
    userId: 'user-player-1',
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
    status: 'approved',
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
  };

  beforeEach(async () => {
    characterForGmFinder = {
      findByIdAndCampaign: jest.fn().mockResolvedValue(characterData),
    };
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetCharacterForGmController],
      providers: [
        {
          provide: CharacterForGmFinder,
          useValue: characterForGmFinder,
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignAnnouncementsFinder,
        },
      ],
    }).compile();

    controller = module.get<GetCharacterForGmController>(
      GetCharacterForGmController,
    );
  });

  it('should return character data wrapped in { data }', async () => {
    const result = await controller.handle(
      'campaign-456',
      'char-123',
      'gm-user-1',
    );

    expect(result.data).toBeTruthy();
    expect(result.data.id).toBe('char-123');
    expect(result.data.name).toBe('Gandalf');
    expect(result.data.createdAt).toBe('2026-03-01T12:00:00.000Z');
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle('campaign-456', 'char-123', 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when character not found', async () => {
    characterForGmFinder.findByIdAndCampaign.mockResolvedValue(null);

    await expect(
      controller.handle('campaign-456', 'char-123', 'gm-user-1'),
    ).rejects.toThrow(NotFoundException);
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
        GetCharacterForGmController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCharacterForGmController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
