import { Inventory } from '../inventory.aggregate.js';
import { InventoryCreated } from '../events/inventory-created.event.js';
import { ItemAddedToInventory } from '../events/item-added-to-inventory.event.js';
import { ItemEquipped } from '../events/item-equipped.event.js';
import { ItemUnequipped } from '../events/item-unequipped.event.js';
import { ItemMoved } from '../events/item-moved.event.js';
import { ItemDropped } from '../events/item-dropped.event.js';
import { SlotIncompatibleException } from '../exceptions/slot-incompatible.exception.js';
import { ItemNotFoundInInventoryException } from '../exceptions/item-not-found-in-inventory.exception.js';
import { SlotAlreadyOccupiedException } from '../exceptions/slot-already-occupied.exception.js';
import type { InventoryItemData } from '../inventory-item.js';
import type { Clock } from '../../../shared/clock.js';

describe('Inventory', () => {
  const characterId = 'char-123';
  const campaignId = 'campaign-456';
  const maxCapacity = 20;

  const mockClock: Clock = {
    now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
  };

  const swordItem: InventoryItemData = {
    id: 'item-sword',
    name: 'Iron Sword',
    description: 'A simple iron sword',
    weight: 3,
    slotType: 'weapon_shield',
    statModifiers: { strength: 2 },
  };

  const helmetItem: InventoryItemData = {
    id: 'item-helmet',
    name: 'Iron Helmet',
    description: 'A sturdy iron helmet',
    weight: 2,
    slotType: 'head',
    statModifiers: { constitution: 1 },
  };

  const ringItem: InventoryItemData = {
    id: 'item-ring',
    name: 'Ring of Power',
    description: 'A magical ring',
    weight: 0.1,
    slotType: 'ring1',
    statModifiers: { intelligence: 3 },
  };

  function createInventoryWithItems(
    items: InventoryItemData[] = [swordItem, helmetItem],
  ): Inventory {
    const inventory = Inventory.create(
      characterId,
      campaignId,
      maxCapacity,
      mockClock,
    );
    for (const item of items) {
      inventory.addItem(item, mockClock);
    }
    inventory.clearEvents();
    return inventory;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should emit InventoryCreated event with correct data', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InventoryCreated);

      const event = events[0] as InventoryCreated;
      expect(event.characterId).toBe(characterId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.maxCapacity).toBe(maxCapacity);
      expect(event.createdAt).toBe('2026-03-08T12:00:00.000Z');
    });

    it('should initialize 8 empty equipment slots', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );

      const slots = inventory.getEquipmentSlots();
      expect(slots.size).toBe(8);
      expect(slots.get('head')).toBeNull();
      expect(slots.get('torso')).toBeNull();
      expect(slots.get('hands')).toBeNull();
      expect(slots.get('legs')).toBeNull();
      expect(slots.get('feet')).toBeNull();
      expect(slots.get('ring1')).toBeNull();
      expect(slots.get('ring2')).toBeNull();
      expect(slots.get('weapon_shield')).toBeNull();
    });

    it('should start with empty backpack and zero weight', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );

      expect(inventory.getBackpackItems().size).toBe(0);
      expect(inventory.getWeightCapacity().getCurrentWeight()).toBe(0);
      expect(inventory.getWeightCapacity().getMaxCapacity()).toBe(maxCapacity);
      expect(inventory.isOverencumbered()).toBe(false);
    });
  });

  describe('addItem()', () => {
    it('should add item to backpack and emit ItemAddedToInventory event', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );
      inventory.clearEvents();

      inventory.addItem(swordItem, mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ItemAddedToInventory);

      const event = events[0] as ItemAddedToInventory;
      expect(event.characterId).toBe(characterId);
      expect(event.item).toEqual(swordItem);
      expect(event.backpackPosition).toBe(0);
    });

    it('should assign incremental positions to backpack items', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );
      inventory.clearEvents();

      inventory.addItem(swordItem, mockClock);
      inventory.addItem(helmetItem, mockClock);

      const events = inventory.getUncommittedEvents();
      expect((events[0] as ItemAddedToInventory).backpackPosition).toBe(0);
      expect((events[1] as ItemAddedToInventory).backpackPosition).toBe(1);
    });

    it('should update weight when item is added', () => {
      const inventory = Inventory.create(
        characterId,
        campaignId,
        maxCapacity,
        mockClock,
      );

      inventory.addItem(swordItem, mockClock);

      expect(inventory.getWeightCapacity().getCurrentWeight()).toBe(3);
    });
  });

  describe('equipItem()', () => {
    it('should move item from backpack to equipment slot and emit ItemEquipped', () => {
      const inventory = createInventoryWithItems([swordItem]);

      inventory.equipItem('item-sword', 'weapon_shield', mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ItemEquipped);

      const event = events[0] as ItemEquipped;
      expect(event.characterId).toBe(characterId);
      expect(event.itemId).toBe('item-sword');
      expect(event.fromBackpackPosition).toBe(0);
      expect(event.toEquipmentSlot).toBe('weapon_shield');
    });

    it('should remove item from backpack and place in equipment slot', () => {
      const inventory = createInventoryWithItems([swordItem]);

      inventory.equipItem('item-sword', 'weapon_shield', mockClock);

      expect(inventory.getBackpackItems().size).toBe(0);
      const equipped = inventory.getEquipmentSlots().get('weapon_shield');
      expect(equipped).not.toBeNull();
      expect(equipped!.getId()).toBe('item-sword');
    });

    it('should throw SlotIncompatibleException when item type does not match slot', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.equipItem('item-sword', 'head', mockClock);
      }).toThrow(SlotIncompatibleException);
    });

    it('should throw SlotAlreadyOccupiedException when slot is taken', () => {
      const secondSword: InventoryItemData = {
        ...swordItem,
        id: 'item-sword-2',
        name: 'Steel Sword',
      };
      const inventory = createInventoryWithItems([swordItem, secondSword]);

      inventory.equipItem('item-sword', 'weapon_shield', mockClock);
      inventory.clearEvents();

      expect(() => {
        inventory.equipItem('item-sword-2', 'weapon_shield', mockClock);
      }).toThrow(SlotAlreadyOccupiedException);
    });

    it('should throw ItemNotFoundInInventoryException for unknown item', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.equipItem('item-nonexistent', 'weapon_shield', mockClock);
      }).toThrow(ItemNotFoundInInventoryException);
    });

    it('should throw for invalid slot type', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.equipItem('item-sword', 'invalid_slot', mockClock);
      }).toThrow();
    });
  });

  describe('unequipItem()', () => {
    it('should move item from equipment slot to backpack and emit ItemUnequipped', () => {
      const inventory = createInventoryWithItems([swordItem]);
      inventory.equipItem('item-sword', 'weapon_shield', mockClock);
      inventory.clearEvents();

      inventory.unequipItem('item-sword', mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ItemUnequipped);

      const event = events[0] as ItemUnequipped;
      expect(event.characterId).toBe(characterId);
      expect(event.itemId).toBe('item-sword');
      expect(event.fromEquipmentSlot).toBe('weapon_shield');
      expect(typeof event.toBackpackPosition).toBe('number');
    });

    it('should empty the equipment slot and add item to backpack', () => {
      const inventory = createInventoryWithItems([swordItem]);
      inventory.equipItem('item-sword', 'weapon_shield', mockClock);
      inventory.clearEvents();

      inventory.unequipItem('item-sword', mockClock);

      expect(inventory.getEquipmentSlots().get('weapon_shield')).toBeNull();
      const backpackItems = inventory.getBackpackItems();
      let foundSword = false;
      for (const [, item] of backpackItems) {
        if (item.getId() === 'item-sword') foundSword = true;
      }
      expect(foundSword).toBe(true);
    });

    it('should throw ItemNotFoundInInventoryException for unequipped item', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.unequipItem('item-sword', mockClock);
      }).toThrow(ItemNotFoundInInventoryException);
    });
  });

  describe('moveItem()', () => {
    it('should swap positions in backpack and emit ItemMoved', () => {
      const inventory = createInventoryWithItems([swordItem, helmetItem]);

      inventory.moveItem('item-sword', 1, mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ItemMoved);

      const event = events[0] as ItemMoved;
      expect(event.characterId).toBe(characterId);
      expect(event.itemId).toBe('item-sword');
      expect(event.fromPosition).toBe(0);
      expect(event.toPosition).toBe(1);
    });

    it('should not emit event when moving to same position', () => {
      const inventory = createInventoryWithItems([swordItem]);

      inventory.moveItem('item-sword', 0, mockClock);

      expect(inventory.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw ItemNotFoundInInventoryException for unknown item', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.moveItem('item-nonexistent', 1, mockClock);
      }).toThrow(ItemNotFoundInInventoryException);
    });
  });

  describe('dropItem()', () => {
    it('should remove item from backpack and emit ItemDropped', () => {
      const inventory = createInventoryWithItems([swordItem]);

      inventory.dropItem('item-sword', mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ItemDropped);

      const event = events[0] as ItemDropped;
      expect(event.characterId).toBe(characterId);
      expect(event.itemId).toBe('item-sword');
      expect(event.itemName).toBe('Iron Sword');
      expect(event.itemWeight).toBe(3);
      expect(event.fromSlot).toBe('backpack:0');
    });

    it('should remove item from equipment slot and emit ItemDropped', () => {
      const inventory = createInventoryWithItems([swordItem]);
      inventory.equipItem('item-sword', 'weapon_shield', mockClock);
      inventory.clearEvents();

      inventory.dropItem('item-sword', mockClock);

      const events = inventory.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as ItemDropped;
      expect(event.fromSlot).toBe('equipment:weapon_shield');
    });

    it('should update weight after dropping item', () => {
      const inventory = createInventoryWithItems([swordItem, helmetItem]);
      const weightBefore =
        inventory.getWeightCapacity().getCurrentWeight();

      inventory.dropItem('item-sword', mockClock);

      expect(inventory.getWeightCapacity().getCurrentWeight()).toBe(
        weightBefore - swordItem.weight,
      );
    });

    it('should throw ItemNotFoundInInventoryException for unknown item', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.dropItem('item-nonexistent', mockClock);
      }).toThrow(ItemNotFoundInInventoryException);
    });
  });

  describe('overencumbrance', () => {
    it('should detect overencumbrance when weight exceeds capacity', () => {
      const inventory = Inventory.create(characterId, campaignId, 5, mockClock);

      const heavyItem: InventoryItemData = {
        id: 'item-heavy',
        name: 'Heavy Rock',
        description: 'Very heavy',
        weight: 6,
        slotType: 'weapon_shield',
        statModifiers: {},
      };

      inventory.addItem(heavyItem, mockClock);

      expect(inventory.isOverencumbered()).toBe(true);
    });

    it('should not be overencumbered at exactly max capacity', () => {
      const inventory = Inventory.create(characterId, campaignId, 3, mockClock);

      inventory.addItem(swordItem, mockClock);

      expect(inventory.getWeightCapacity().getCurrentWeight()).toBe(3);
      expect(inventory.isOverencumbered()).toBe(false);
    });

    it('should be overencumbered at 1 unit over capacity', () => {
      const inventory = Inventory.create(characterId, campaignId, 2, mockClock);

      inventory.addItem(swordItem, mockClock);

      expect(inventory.getWeightCapacity().getCurrentWeight()).toBe(3);
      expect(inventory.isOverencumbered()).toBe(true);
    });
  });

  describe('loadFromHistory()', () => {
    it('should reconstruct inventory from InventoryCreated event', () => {
      const inventory = Inventory.loadFromHistory([
        {
          type: 'InventoryCreated',
          data: {
            characterId,
            campaignId,
            maxCapacity,
            createdAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ]);

      expect(inventory.getCharacterId()).toBe(characterId);
      expect(inventory.getCampaignId()).toBe(campaignId);
      expect(inventory.getEquipmentSlots().size).toBe(8);
      expect(inventory.getBackpackItems().size).toBe(0);
      expect(inventory.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct inventory with items from history', () => {
      const inventory = Inventory.loadFromHistory([
        {
          type: 'InventoryCreated',
          data: {
            characterId,
            campaignId,
            maxCapacity,
            createdAt: '2026-03-08T12:00:00.000Z',
          },
        },
        {
          type: 'ItemAddedToInventory',
          data: {
            characterId,
            item: swordItem,
            backpackPosition: 0,
            addedAt: '2026-03-08T12:01:00.000Z',
          },
        },
      ]);

      expect(inventory.getBackpackItems().size).toBe(1);
      const item = inventory.getBackpackItems().get(0);
      expect(item).not.toBeNull();
      expect(item!.getId()).toBe('item-sword');
    });

    it('should reconstruct state from creation, add and equip events', () => {
      const inventory = Inventory.loadFromHistory([
        {
          type: 'InventoryCreated',
          data: {
            characterId,
            campaignId,
            maxCapacity,
            createdAt: '2026-03-08T12:00:00.000Z',
          },
        },
        {
          type: 'ItemAddedToInventory',
          data: {
            characterId,
            item: swordItem,
            backpackPosition: 0,
            addedAt: '2026-03-08T12:01:00.000Z',
          },
        },
        {
          type: 'ItemEquipped',
          data: {
            characterId,
            itemId: 'item-sword',
            fromBackpackPosition: 0,
            toEquipmentSlot: 'weapon_shield',
            equippedAt: '2026-03-08T12:02:00.000Z',
          },
        },
      ]);

      expect(inventory.getBackpackItems().size).toBe(0);
      const equipped = inventory.getEquipmentSlots().get('weapon_shield');
      expect(equipped).not.toBeNull();
      expect(equipped!.getId()).toBe('item-sword');
    });

    it('should throw for unknown event type', () => {
      expect(() => {
        Inventory.loadFromHistory([
          { type: 'UnknownEvent', data: {} },
        ]);
      }).toThrow('Unknown event type: UnknownEvent');
    });
  });

  describe('slot compatibility', () => {
    it('should allow equipping weapon to weapon_shield slot', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.equipItem('item-sword', 'weapon_shield', mockClock);
      }).not.toThrow();
    });

    it('should allow equipping helmet to head slot', () => {
      const inventory = createInventoryWithItems([helmetItem]);

      expect(() => {
        inventory.equipItem('item-helmet', 'head', mockClock);
      }).not.toThrow();
    });

    it('should allow equipping ring to ring1 slot', () => {
      const inventory = createInventoryWithItems([ringItem]);

      expect(() => {
        inventory.equipItem('item-ring', 'ring1', mockClock);
      }).not.toThrow();
    });

    it('should reject equipping weapon to head slot', () => {
      const inventory = createInventoryWithItems([swordItem]);

      expect(() => {
        inventory.equipItem('item-sword', 'head', mockClock);
      }).toThrow(SlotIncompatibleException);
    });

    it('should reject equipping helmet to weapon_shield slot', () => {
      const inventory = createInventoryWithItems([helmetItem]);

      expect(() => {
        inventory.equipItem('item-helmet', 'weapon_shield', mockClock);
      }).toThrow(SlotIncompatibleException);
    });
  });
});
