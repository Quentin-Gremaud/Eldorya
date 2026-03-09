import { Test, TestingModule } from '@nestjs/testing';
import { CharacterDetailFinder } from '../finders/character-detail.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('CharacterDetailFinder', () => {
  let finder: CharacterDetailFinder;
  let prisma: { character: { findFirst: jest.Mock } };

  const dbCharacter = {
    id: 'char-123',
    userId: 'user-player-1',
    campaignId: 'campaign-456',
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
    updatedAt: new Date('2026-03-01T12:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      character: {
        findFirst: jest.fn().mockResolvedValue(dbCharacter),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterDetailFinder,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    finder = module.get<CharacterDetailFinder>(CharacterDetailFinder);
  });

  it('should return character detail for existing character', async () => {
    const result = await finder.findByUserAndCampaign(
      'user-player-1',
      'campaign-456',
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe('char-123');
    expect(result!.name).toBe('Gandalf');
    expect(result!.race).toBe('Human');
    expect(result!.characterClass).toBe('Mage');
    expect(result!.background).toBe('A wandering wizard');
    expect(result!.stats).toEqual(dbCharacter.stats);
    expect(result!.spells).toEqual(['Fireball', 'Shield']);
    expect(result!.status).toBe('pending');
    expect(result!.createdAt).toEqual(new Date('2026-03-01T12:00:00.000Z'));
  });

  it('should call Prisma with correct where clause', async () => {
    await finder.findByUserAndCampaign('user-player-1', 'campaign-456');

    expect(prisma.character.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-player-1', campaignId: 'campaign-456' },
    });
  });

  it('should return null when character not found', async () => {
    prisma.character.findFirst.mockResolvedValue(null);

    const result = await finder.findByUserAndCampaign(
      'user-player-1',
      'campaign-456',
    );

    expect(result).toBeNull();
  });
});
