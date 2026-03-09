import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ListCampaignCharactersController } from '../controllers/list-campaign-characters.controller.js';
import { CampaignCharactersFinder } from '../finders/campaign-characters.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('ListCampaignCharactersController', () => {
  let controller: ListCampaignCharactersController;
  let campaignCharactersFinder: { findApprovedByCampaignId: jest.Mock };
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  const characters = [
    {
      id: 'char-1',
      userId: 'user-1',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wizard',
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
      spells: ['Fireball'],
      status: 'approved',
      createdAt: '2026-03-01T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    campaignCharactersFinder = {
      findApprovedByCampaignId: jest.fn().mockResolvedValue(characters),
    };
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListCampaignCharactersController],
      providers: [
        {
          provide: CampaignCharactersFinder,
          useValue: campaignCharactersFinder,
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignAnnouncementsFinder,
        },
      ],
    }).compile();

    controller = module.get<ListCampaignCharactersController>(
      ListCampaignCharactersController,
    );
  });

  it('should return approved characters wrapped in { data }', async () => {
    const result = await controller.handle('campaign-456', 'gm-user-1');

    expect(result.data).toEqual(characters);
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle('campaign-456', 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle('campaign-456', 'gm-user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ListCampaignCharactersController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ListCampaignCharactersController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
