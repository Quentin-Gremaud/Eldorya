import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

describe('InventoryGmFinder', () => {
  let finder: InventoryGmFinder;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      campaign: {
        findUnique: jest.fn(),
      },
      character: {
        findUnique: jest.fn(),
      },
    };

    finder = new InventoryGmFinder(mockPrisma);
  });

  describe('verifyGmOwnership', () => {
    it('should succeed when user is GM and character belongs to campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ gmUserId: 'gm-user' });
      mockPrisma.character.findUnique.mockResolvedValue({ campaignId: 'campaign-1' });

      await expect(
        finder.verifyGmOwnership('char-123', 'campaign-1', 'gm-user'),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        finder.verifyGmOwnership('char-123', 'campaign-1', 'gm-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not GM', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ gmUserId: 'other-user' });

      await expect(
        finder.verifyGmOwnership('char-123', 'campaign-1', 'not-gm'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when character not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ gmUserId: 'gm-user' });
      mockPrisma.character.findUnique.mockResolvedValue(null);

      await expect(
        finder.verifyGmOwnership('char-123', 'campaign-1', 'gm-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when character not in campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ gmUserId: 'gm-user' });
      mockPrisma.character.findUnique.mockResolvedValue({ campaignId: 'other-campaign' });

      await expect(
        finder.verifyGmOwnership('char-123', 'campaign-1', 'gm-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
