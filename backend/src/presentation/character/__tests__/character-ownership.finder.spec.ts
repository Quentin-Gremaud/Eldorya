import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CharacterOwnershipFinder } from '../finders/character-ownership.finder.js';

describe('CharacterOwnershipFinder', () => {
  let finder: CharacterOwnershipFinder;
  let mockPrisma: { character: { findUnique: jest.Mock } };

  beforeEach(() => {
    mockPrisma = {
      character: { findUnique: jest.fn() },
    };
    finder = new CharacterOwnershipFinder(mockPrisma as any);
  });

  it('should pass when user owns the character in the campaign', async () => {
    mockPrisma.character.findUnique.mockResolvedValue({
      userId: 'player-1',
      campaignId: 'camp-1',
    });

    await expect(
      finder.verifyOwnership('char-1', 'player-1', 'camp-1'),
    ).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when character does not exist', async () => {
    mockPrisma.character.findUnique.mockResolvedValue(null);

    await expect(
      finder.verifyOwnership('char-999', 'player-1', 'camp-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when character is in different campaign', async () => {
    mockPrisma.character.findUnique.mockResolvedValue({
      userId: 'player-1',
      campaignId: 'camp-other',
    });

    await expect(
      finder.verifyOwnership('char-1', 'player-1', 'camp-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own character', async () => {
    mockPrisma.character.findUnique.mockResolvedValue({
      userId: 'player-1',
      campaignId: 'camp-1',
    });

    await expect(
      finder.verifyOwnership('char-1', 'other-user', 'camp-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
