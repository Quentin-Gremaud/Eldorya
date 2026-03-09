import { Test, TestingModule } from '@nestjs/testing';
import { PendingCharactersFinder } from '../finders/pending-characters.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { CharacterStatusEnum } from '@prisma/client';

describe('PendingCharactersFinder', () => {
  let finder: PendingCharactersFinder;
  let prisma: { character: { findMany: jest.Mock } };

  const dbCharacters = [
    {
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
    },
  ];

  beforeEach(async () => {
    prisma = {
      character: {
        findMany: jest.fn().mockResolvedValue(dbCharacters),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingCharactersFinder,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    finder = module.get<PendingCharactersFinder>(PendingCharactersFinder);
  });

  it('should return pending characters for campaignId', async () => {
    const result = await finder.findByCampaignId('campaign-456');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('char-123');
    expect(result[0].userId).toBe('user-player-1');
    expect(result[0].name).toBe('Gandalf');
    expect(result[0].race).toBe('Human');
    expect(result[0].characterClass).toBe('Mage');
    expect(result[0].background).toBe('A wandering wizard');
    expect(result[0].stats).toEqual(dbCharacters[0].stats);
    expect(result[0].spells).toEqual(['Fireball', 'Shield']);
    expect(result[0].status).toBe('pending');
    expect(result[0].createdAt).toBe('2026-03-01T12:00:00.000Z');
  });

  it('should return empty array when no pending characters', async () => {
    prisma.character.findMany.mockResolvedValue([]);

    const result = await finder.findByCampaignId('campaign-456');

    expect(result).toEqual([]);
  });

  it('should call Prisma with correct where clause', async () => {
    await finder.findByCampaignId('campaign-456');

    expect(prisma.character.findMany).toHaveBeenCalledWith({
      where: {
        campaignId: 'campaign-456',
        status: CharacterStatusEnum.pending,
      },
      orderBy: { createdAt: 'asc' },
    });
  });
});
