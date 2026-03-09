import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetInventoryController } from '../controllers/get-inventory.controller.js';
import { InventoryFinder } from '../finders/inventory.finder.js';

describe('GetInventoryController', () => {
  let controller: GetInventoryController;
  let inventoryFinder: { findByCharacterId: jest.Mock };

  const mockInventory = {
    characterId: 'char-123',
    campaignId: 'campaign-456',
    equipmentSlots: { head: null, torso: null, hands: null, legs: null, feet: null, ring1: null, ring2: null, weapon_shield: null },
    backpackItems: [],
    currentWeight: 0,
    maxCapacity: 20,
    items: [],
  };

  beforeEach(async () => {
    inventoryFinder = {
      findByCharacterId: jest.fn().mockResolvedValue(mockInventory),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetInventoryController],
      providers: [
        {
          provide: InventoryFinder,
          useValue: inventoryFinder,
        },
      ],
    }).compile();

    controller = module.get<GetInventoryController>(GetInventoryController);
  });

  it('should return inventory data wrapped in { data }', async () => {
    const result = await controller.handle('char-123', 'user-1');

    expect(result).toEqual({ data: mockInventory });
  });

  it('should call finder with characterId and userId', async () => {
    await controller.handle('char-123', 'user-1');

    expect(inventoryFinder.findByCharacterId).toHaveBeenCalledWith(
      'char-123',
      'user-1',
    );
  });

  it('should throw NotFoundException when inventory not found', async () => {
    inventoryFinder.findByCharacterId.mockResolvedValue(null);

    await expect(
      controller.handle('char-123', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
