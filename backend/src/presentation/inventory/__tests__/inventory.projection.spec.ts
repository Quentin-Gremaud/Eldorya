import { InventoryProjection } from '../projections/inventory.projection.js';

describe('InventoryProjection', () => {
  let projection: InventoryProjection;
  let mockPrisma: any;
  let mockKurrentDb: any;

  beforeEach(() => {
    mockPrisma = {
      character: {
        findUnique: jest.fn(),
      },
      inventory: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      inventoryItem: {
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      projectionCheckpoint: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
    };

    mockKurrentDb = {
      getClient: jest.fn().mockReturnValue({
        subscribeToAll: jest.fn(),
      }),
    };

    projection = new InventoryProjection(mockKurrentDb, mockPrisma);
  });

  describe('handleCharacterApproved', () => {
    it('should create empty inventory for approved character', async () => {
      mockPrisma.character.findUnique.mockResolvedValue({
        campaignId: 'campaign-456',
      });
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await (projection as any).handleCharacterApproved({
        characterId: 'char-123',
      });

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characterId: 'char-123',
          campaignId: 'campaign-456',
          currentWeight: 0,
          maxCapacity: 20,
        }),
      });
    });

    it('should not create inventory if character not found', async () => {
      mockPrisma.character.findUnique.mockResolvedValue(null);

      await (projection as any).handleCharacterApproved({
        characterId: 'char-123',
      });

      expect(mockPrisma.inventory.create).not.toHaveBeenCalled();
    });

    it('should not create inventory if one already exists', async () => {
      mockPrisma.character.findUnique.mockResolvedValue({
        campaignId: 'campaign-456',
      });
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'existing' });

      await (projection as any).handleCharacterApproved({
        characterId: 'char-123',
      });

      expect(mockPrisma.inventory.create).not.toHaveBeenCalled();
    });
  });

  describe('handleInventoryCreated', () => {
    it('should upsert inventory read model', async () => {
      await (projection as any).handleInventoryCreated({
        characterId: 'char-123',
        campaignId: 'campaign-456',
        maxCapacity: 25,
      });

      expect(mockPrisma.inventory.upsert).toHaveBeenCalledWith({
        where: { characterId: 'char-123' },
        create: expect.objectContaining({
          characterId: 'char-123',
          campaignId: 'campaign-456',
          maxCapacity: 25,
        }),
        update: { maxCapacity: 25 },
      });
    });
  });

  describe('handleItemAddedToInventory', () => {
    it('should add item to inventory read model', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { weight: 3, equippedSlot: null, id: 'item-1', name: 'Sword', description: '', slotType: 'weapon_shield', statModifiers: {}, position: 0 },
      ]);

      await (projection as any).handleItemAddedToInventory({
        characterId: 'char-123',
        item: {
          id: 'item-1',
          name: 'Sword',
          description: 'A sword',
          weight: 3,
          slotType: 'weapon_shield',
          statModifiers: { strength: 2 },
        },
        backpackPosition: 0,
      });

      expect(mockPrisma.inventoryItem.upsert).toHaveBeenCalled();
      expect(mockPrisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { characterId: 'char-123' },
          data: expect.objectContaining({
            currentWeight: 3,
          }),
        }),
      );
    });
  });

  describe('handleItemEquipped', () => {
    it('should update item equipped slot', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      await (projection as any).handleItemEquipped({
        characterId: 'char-123',
        itemId: 'item-1',
        toEquipmentSlot: 'weapon_shield',
      });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { equippedSlot: 'weapon_shield', position: null },
      });
    });
  });

  describe('handleItemUnequipped', () => {
    it('should move item from equipment slot back to backpack', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Iron Sword',
          description: 'A sword',
          weight: 3,
          slotType: 'weapon_shield',
          statModifiers: { strength: 2 },
          equippedSlot: null,
          position: 2,
        },
      ]);

      await (projection as any).handleItemUnequipped({
        characterId: 'char-123',
        itemId: 'item-1',
        toBackpackPosition: 2,
      });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { equippedSlot: null, position: 2 },
      });
    });

    it('should not update if inventory not found', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await (projection as any).handleItemUnequipped({
        characterId: 'char-123',
        itemId: 'item-1',
        toBackpackPosition: 0,
      });

      expect(mockPrisma.inventoryItem.update).not.toHaveBeenCalled();
    });
  });

  describe('handleItemMoved', () => {
    it('should update item position and swap with target', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-2',
        position: 3,
      });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Sword',
          description: '',
          weight: 3,
          slotType: 'weapon_shield',
          statModifiers: {},
          equippedSlot: null,
          position: 3,
        },
        {
          id: 'item-2',
          name: 'Shield',
          description: '',
          weight: 2,
          slotType: 'weapon_shield',
          statModifiers: {},
          equippedSlot: null,
          position: 0,
        },
      ]);

      await (projection as any).handleItemMoved({
        characterId: 'char-123',
        itemId: 'item-1',
        fromPosition: 0,
        toPosition: 3,
      });

      // Target item swapped to source position
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-2' },
        data: { position: 0 },
      });

      // Moving item placed at target position
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { position: 3 },
      });
    });

    it('should not update if inventory not found', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await (projection as any).handleItemMoved({
        characterId: 'char-123',
        itemId: 'item-1',
        fromPosition: 0,
        toPosition: 3,
      });

      expect(mockPrisma.inventoryItem.update).not.toHaveBeenCalled();
    });
  });

  describe('handleItemDropped', () => {
    it('should delete item from read model', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      await (projection as any).handleItemDropped({
        characterId: 'char-123',
        itemId: 'item-1',
      });

      expect(mockPrisma.inventoryItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });
});
