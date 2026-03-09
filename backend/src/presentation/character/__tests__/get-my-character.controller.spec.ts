import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetMyCharacterController } from '../controllers/get-my-character.controller.js';
import { CharacterDetailFinder } from '../finders/character-detail.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

describe('GetMyCharacterController', () => {
  let controller: GetMyCharacterController;
  let characterFinder: { findByUserAndCampaign: jest.Mock };
  let campaignFinder: { checkCampaignMembership: jest.Mock };

  const characterResult = {
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
    status: 'pending',
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
  };

  beforeEach(async () => {
    characterFinder = {
      findByUserAndCampaign: jest.fn().mockResolvedValue(characterResult),
    };

    campaignFinder = {
      checkCampaignMembership: jest
        .fn()
        .mockResolvedValue({ exists: true, isMember: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetMyCharacterController],
      providers: [
        {
          provide: CharacterDetailFinder,
          useValue: characterFinder,
        },
        {
          provide: CampaignAnnouncementsFinder,
          useValue: campaignFinder,
        },
      ],
    }).compile();

    controller = module.get<GetMyCharacterController>(
      GetMyCharacterController,
    );
  });

  it('should return character data wrapped in { data }', async () => {
    const result = await controller.handle('campaign-456', 'user-player-1');

    expect(result.data.id).toBe('char-123');
    expect(result.data.name).toBe('Gandalf');
    expect(result.data.race).toBe('Human');
    expect(result.data.characterClass).toBe('Mage');
    expect(result.data.background).toBe('A wandering wizard');
    expect(result.data.stats).toEqual(characterResult.stats);
    expect(result.data.spells).toEqual(['Fireball', 'Shield']);
    expect(result.data.status).toBe('pending');
    expect(result.data.createdAt).toBe('2026-03-01T12:00:00.000Z');
  });

  it('should call finder with correct params', async () => {
    await controller.handle('campaign-456', 'user-player-1');

    expect(characterFinder.findByUserAndCampaign).toHaveBeenCalledWith(
      'user-player-1',
      'campaign-456',
    );
  });

  it('should throw NotFoundException when no character found', async () => {
    characterFinder.findByUserAndCampaign.mockResolvedValue(null);

    await expect(
      controller.handle('campaign-456', 'user-player-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    campaignFinder.checkCampaignMembership.mockResolvedValue({
      exists: false,
    });

    await expect(
      controller.handle('campaign-456', 'user-player-1'),
    ).rejects.toThrow(NotFoundException);

    expect(characterFinder.findByUserAndCampaign).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not a member', async () => {
    campaignFinder.checkCampaignMembership.mockResolvedValue({
      exists: true,
      isMember: false,
    });

    await expect(
      controller.handle('campaign-456', 'user-player-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(characterFinder.findByUserAndCampaign).not.toHaveBeenCalled();
  });
});
