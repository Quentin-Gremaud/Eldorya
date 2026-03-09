import { EmitInventoryModifiedByGmHandler } from '../commands/emit-inventory-modified-by-gm.handler.js';
import { EmitInventoryModifiedByGmCommand } from '../commands/emit-inventory-modified-by-gm.command.js';
import { Inventory } from '../inventory.aggregate.js';
import type { InventoryRepository } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('EmitInventoryModifiedByGmHandler', () => {
  let handler: EmitInventoryModifiedByGmHandler;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockClock: Clock;
  let mockInventory: jest.Mocked<Inventory>;

  beforeEach(() => {
    mockInventory = {
      recordGmModification: jest.fn(),
    } as unknown as jest.Mocked<Inventory>;

    mockRepository = {
      load: jest.fn().mockResolvedValue(mockInventory),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    handler = new EmitInventoryModifiedByGmHandler(mockRepository, mockClock);
  });

  it('should load inventory, call recordGmModification, and save', async () => {
    const command = new EmitInventoryModifiedByGmCommand(
      'char-123',
      'gm-user',
      'add-item',
      'item-1',
      { itemName: 'Sword' },
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('char-123');
    expect(mockInventory.recordGmModification).toHaveBeenCalledWith(
      'gm-user',
      'add-item',
      'item-1',
      { itemName: 'Sword' },
      mockClock,
    );
    expect(mockRepository.save).toHaveBeenCalledWith(mockInventory);
  });

  it('should propagate error when repository.load() throws', async () => {
    mockRepository.load.mockRejectedValue(new Error('Not found'));

    const command = new EmitInventoryModifiedByGmCommand(
      'char-123',
      'gm-user',
      'add-item',
      'item-1',
      {},
    );

    await expect(handler.execute(command)).rejects.toThrow('Not found');
    expect(mockInventory.recordGmModification).not.toHaveBeenCalled();
  });
});
