import { DropItemHandler } from '../commands/drop-item.handler.js';
import { DropItemCommand } from '../commands/drop-item.command.js';
import { Inventory } from '../inventory.aggregate.js';
import type { InventoryRepository } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('DropItemHandler', () => {
  let handler: DropItemHandler;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockClock: Clock;
  let mockInventory: jest.Mocked<Inventory>;

  beforeEach(() => {
    mockInventory = {
      dropItem: jest.fn(),
    } as unknown as jest.Mocked<Inventory>;

    mockRepository = {
      load: jest.fn().mockResolvedValue(mockInventory),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    handler = new DropItemHandler(mockRepository, mockClock);
  });

  it('should load inventory, call dropItem, and save', async () => {
    const command = new DropItemCommand('char-123', 'item-1', 'user-1');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('char-123');
    expect(mockInventory.dropItem).toHaveBeenCalledWith('item-1', mockClock);
    expect(mockRepository.save).toHaveBeenCalledWith(mockInventory);
  });

  it('should propagate error when repository.load() throws', async () => {
    const error = new Error('Aggregate not found');
    mockRepository.load.mockRejectedValue(error);

    const command = new DropItemCommand('char-123', 'item-1', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockInventory.dropItem).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception and not save when aggregate method throws', async () => {
    const domainError = new Error('Item not found in inventory');
    mockInventory.dropItem.mockImplementation(() => {
      throw domainError;
    });

    const command = new DropItemCommand('char-123', 'item-1', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Item not found in inventory');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
