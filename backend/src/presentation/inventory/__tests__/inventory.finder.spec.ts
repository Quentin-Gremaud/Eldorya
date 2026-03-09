import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryFinder } from '../finders/inventory.finder.js';

describe('InventoryFinder', () => {
  let finder: InventoryFinder;
  let mockPrisma: any;

  const mockCharacter = {
    id: 'char-123',
    userId: 'user-1',
    campaignId: 'campaign-456',
  };

  const mockInventory = {
    id: 'inv-1',
    characterId: 'char-123',
    campaignId: 'campaign-456',
    equipmentSlots: { head: null },
    backpackItems: [],
    currentWeight: 5,
    maxCapacity: 20,
    items: [
      {
        id: 'item-1',
        name: 'Sword',
        description: 'A sword',
        weight: 5,
        slotType: 'weapon_shield',
        statModifiers: { strength: 2 },
        position: 0,
        equippedSlot: null,
      },
    ],
  };

  beforeEach(() => {
    mockPrisma = {
      character: {
        findUnique: jest.fn().mockResolvedValue(mockCharacter),
      },
      inventory: {
        findUnique: jest.fn().mockResolvedValue(mockInventory),
      },
    };

    finder = new InventoryFinder(mockPrisma);
  });

  describe('findByCharacterId', () => {
    it('should return inventory when user owns character', async () => {
      const result = await finder.findByCharacterId('char-123', 'user-1');

      expect(result).not.toBeNull();
      expect(result!.characterId).toBe('char-123');
      expect(result!.items).toHaveLength(1);
    });

    it('should return null when character not found', async () => {
      mockPrisma.character.findUnique.mockResolvedValue(null);

      const result = await finder.findByCharacterId('char-999', 'user-1');

      expect(result).toBeNull();
    });

    it('should throw ForbiddenException when user does not own character', async () => {
      await expect(
        finder.findByCharacterId('char-123', 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return null when inventory does not exist', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      const result = await finder.findByCharacterId('char-123', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('verifyCharacterOwnership', () => {
    it('should not throw when user owns character in correct campaign', async () => {
      await expect(
        finder.verifyCharacterOwnership('char-123', 'user-1', 'campaign-456'),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when character not found', async () => {
      mockPrisma.character.findUnique.mockResolvedValue(null);

      await expect(
        finder.verifyCharacterOwnership('char-999', 'user-1', 'campaign-456'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when campaignId does not match', async () => {
      await expect(
        finder.verifyCharacterOwnership('char-123', 'user-1', 'wrong-campaign'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own character', async () => {
      await expect(
        finder.verifyCharacterOwnership('char-123', 'wrong-user', 'campaign-456'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
