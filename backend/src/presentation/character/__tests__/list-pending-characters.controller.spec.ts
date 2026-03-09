import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ListPendingCharactersController } from '../controllers/list-pending-characters.controller.js';
import { PendingCharactersFinder } from '../finders/pending-characters.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('ListPendingCharactersController', () => {
  let controller: ListPendingCharactersController;
  let pendingCharactersFinder: { findByCampaignId: jest.Mock };
  let campaignAnnouncementsFinder: { checkGmOwnership: jest.Mock };

  const pendingCharacters = [
    {
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
      status: 'pending',
      createdAt: '2026-03-01T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    campaignAnnouncementsFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    pendingCharactersFinder = {
      findByCampaignId: jest.fn().mockResolvedValue(pendingCharacters),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListPendingCharactersController],
      providers: [
        {
          provide: PendingCharactersFinder,
          useValue: pendingCharactersFinder,
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignAnnouncementsFinder,
        },
      ],
    }).compile();

    controller = module.get<ListPendingCharactersController>(
      ListPendingCharactersController,
    );
  });

  it('should return 200 with { data: [...] }', async () => {
    const result = await controller.handle('campaign-456', 'gm-user-1');

    expect(result).toEqual({ data: pendingCharacters });
  });

  it('should return { data: [] } when no pending characters', async () => {
    pendingCharactersFinder.findByCampaignId.mockResolvedValue([]);

    const result = await controller.handle('campaign-456', 'gm-user-1');

    expect(result).toEqual({ data: [] });
  });

  it('should call finder with correct campaignId', async () => {
    await controller.handle('campaign-456', 'gm-user-1');

    expect(pendingCharactersFinder.findByCampaignId).toHaveBeenCalledWith(
      'campaign-456',
    );
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle('campaign-456', 'gm-user-1'),
    ).rejects.toThrow(NotFoundException);

    expect(pendingCharactersFinder.findByCampaignId).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    campaignAnnouncementsFinder.checkGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle('campaign-456', 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(pendingCharactersFinder.findByCampaignId).not.toHaveBeenCalled();
  });

  it('should call checkGmOwnership with correct parameters', async () => {
    await controller.handle('campaign-456', 'gm-user-1');

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
        ListPendingCharactersController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ListPendingCharactersController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
