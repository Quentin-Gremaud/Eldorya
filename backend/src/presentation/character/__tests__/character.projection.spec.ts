import { CharacterStatusEnum } from '@prisma/client';
import { CharacterProjection } from '../projections/character.projection.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('CharacterProjection', () => {
  let projection: CharacterProjection;
  let prisma: {
    character: { upsert: jest.Mock; update: jest.Mock };
    campaign: { findUnique: jest.Mock };
    notification: { createMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };
  let kurrentDb: { getClient: jest.Mock };

  beforeEach(() => {
    prisma = {
      character: {
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue({
          userId: 'user-player-1',
          campaignId: 'campaign-456',
        }),
      },
      campaign: {
        findUnique: jest.fn().mockResolvedValue({ gmUserId: 'gm-user-1' }),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => {
        await fn(prisma);
      }),
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    kurrentDb = {
      getClient: jest.fn().mockReturnValue({
        subscribeToAll: jest.fn(),
      }),
    };

    projection = new CharacterProjection(
      kurrentDb as unknown as KurrentDbService,
      prisma as unknown as PrismaService,
    );
  });

  describe('handleCharacterCreated()', () => {
    const data = {
      characterId: 'char-123',
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
      createdAt: '2026-03-01T12:00:00.000Z',
    };

    it('should upsert character in Prisma read model', async () => {
      await projection.handleCharacterCreated(data);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.character.upsert).toHaveBeenCalledTimes(1);

      const call = prisma.character.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'char-123' });
      expect(call.create.id).toBe('char-123');
      expect(call.create.userId).toBe('user-player-1');
      expect(call.create.campaignId).toBe('campaign-456');
      expect(call.create.name).toBe('Gandalf');
      expect(call.create.race).toBe('Human');
      expect(call.create.characterClass).toBe('Mage');
      expect(call.create.background).toBe('A wandering wizard');
      expect(call.create.stats).toEqual(data.stats);
      expect(call.create.spells).toEqual(['Fireball', 'Shield']);
      expect(call.create.status).toBe(CharacterStatusEnum.pending);
      expect(call.create.createdAt).toEqual(
        new Date('2026-03-01T12:00:00.000Z'),
      );
    });

    it('should create GM notification', async () => {
      await projection.handleCharacterCreated(data);

      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'campaign-456' },
        select: { gmUserId: true },
      });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      const notifCall = prisma.notification.createMany.mock.calls[0][0];
      expect(notifCall.data[0].userId).toBe('gm-user-1');
      expect(notifCall.data[0].type).toBe('character_submitted');
      expect(notifCall.data[0].title).toBe('New character submitted');
      expect(notifCall.data[0].content).toContain('Gandalf');
      expect(notifCall.data[0].campaignId).toBe('campaign-456');
      expect(notifCall.data[0].referenceId).toBe('char-123');
    });

    it('should skip notification when campaign not found', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await projection.handleCharacterCreated(data);

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('should handle empty spells', async () => {
      await projection.handleCharacterCreated({
        ...data,
        spells: [],
      });

      const call = prisma.character.upsert.mock.calls[0][0];
      expect(call.create.spells).toEqual([]);
    });
  });

  describe('handleCharacterApproved()', () => {
    const approvedData = {
      characterId: 'char-123',
      approvedBy: 'gm-user-1',
      characterName: 'Gandalf',
      approvedAt: '2026-03-08T12:00:00.000Z',
    };

    it('should update character status to approved', async () => {
      await projection.handleCharacterApproved(approvedData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.character.update).toHaveBeenCalledTimes(1);

      const call = prisma.character.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'char-123' });
      expect(call.data.status).toBe(CharacterStatusEnum.approved);
      expect(call.data.rejectionReason).toBeNull();
    });

    it('should create player notification for approval', async () => {
      await projection.handleCharacterApproved(approvedData);

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      const notifCall = prisma.notification.create.mock.calls[0][0];
      expect(notifCall.data.userId).toBe('user-player-1');
      expect(notifCall.data.type).toBe('character_approved');
      expect(notifCall.data.title).toBe('Character Approved');
      expect(notifCall.data.content).toContain('Gandalf');
      expect(notifCall.data.campaignId).toBe('campaign-456');
      expect(notifCall.data.referenceId).toBe('char-123');
    });
  });

  describe('handleCharacterRejected()', () => {
    const rejectedData = {
      characterId: 'char-123',
      rejectedBy: 'gm-user-1',
      characterName: 'Gandalf',
      reason: 'Need more detail',
      rejectedAt: '2026-03-08T12:00:00.000Z',
    };

    it('should update character status to rejected with rejectionReason', async () => {
      await projection.handleCharacterRejected(rejectedData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.character.update).toHaveBeenCalledTimes(1);

      const call = prisma.character.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'char-123' });
      expect(call.data.status).toBe(CharacterStatusEnum.rejected);
      expect(call.data.rejectionReason).toBe('Need more detail');
    });

    it('should create player notification for rejection containing reason', async () => {
      await projection.handleCharacterRejected(rejectedData);

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      const notifCall = prisma.notification.create.mock.calls[0][0];
      expect(notifCall.data.userId).toBe('user-player-1');
      expect(notifCall.data.type).toBe('character_rejected');
      expect(notifCall.data.title).toBe('Character Rejected');
      expect(notifCall.data.content).toContain('Gandalf');
      expect(notifCall.data.content).toContain('Need more detail');
      expect(notifCall.data.campaignId).toBe('campaign-456');
      expect(notifCall.data.referenceId).toBe('char-123');
    });
  });

  describe('handleCharacterModifiedByGM()', () => {
    const modifiedData = {
      characterId: 'char-123',
      campaignId: 'campaign-456',
      modifiedBy: 'gm-user-1',
      characterName: 'Gandalf',
      modifications: {
        name: 'Gandalf the White',
        stats: {
          strength: 10,
          dexterity: 16,
          constitution: 14,
          intelligence: 20,
          wisdom: 18,
          charisma: 12,
        },
      },
      previousValues: {
        name: 'Gandalf',
        stats: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 18,
          wisdom: 16,
          charisma: 10,
        },
      },
      modifiedFields: ['name', 'stats'],
      modifiedAt: '2026-03-08T14:00:00.000Z',
    };

    it('should update only modified fields in Prisma', async () => {
      await projection.handleCharacterModifiedByGM(modifiedData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.character.update).toHaveBeenCalledTimes(1);

      const call = prisma.character.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'char-123', campaignId: 'campaign-456' });
      expect(call.data.name).toBe('Gandalf the White');
      expect(call.data.stats).toEqual(modifiedData.modifications.stats);
      expect(call.data.updatedAt).toBeTruthy();
      expect(call.data.race).toBeUndefined();
      expect(call.data.characterClass).toBeUndefined();
    });

    it('should create player notification with change summary', async () => {
      await projection.handleCharacterModifiedByGM(modifiedData);

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      const notifCall = prisma.notification.create.mock.calls[0][0];
      expect(notifCall.data.userId).toBe('user-player-1');
      expect(notifCall.data.type).toBe('character_modified_by_gm');
      expect(notifCall.data.title).toBe('Character Modified by GM');
      expect(notifCall.data.content).toContain('Gandalf');
      expect(notifCall.data.content).toContain('name, stats');
      expect(notifCall.data.campaignId).toBe('campaign-456');
      expect(notifCall.data.referenceId).toBe('char-123');
    });

    it('should handle single field modification', async () => {
      const singleFieldData = {
        ...modifiedData,
        modifications: { background: 'A powerful wizard' },
        modifiedFields: ['background'],
      };

      await projection.handleCharacterModifiedByGM(singleFieldData);

      const call = prisma.character.update.mock.calls[0][0];
      expect(call.data.background).toBe('A powerful wizard');
      expect(call.data.name).toBeUndefined();
    });
  });
});
