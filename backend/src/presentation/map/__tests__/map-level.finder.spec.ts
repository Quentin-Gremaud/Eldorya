import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MapLevelFinder } from '../finders/map-level.finder.js';

describe('MapLevelFinder', () => {
  let finder: MapLevelFinder;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      campaign: {
        findUnique: jest.fn(),
      },
    };

    finder = new MapLevelFinder(mockPrisma);
  });

  describe('checkGmOwnership', () => {
    it('should not throw when user is the GM', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        gmUserId: 'gm-user-1',
      });

      await expect(
        finder.checkGmOwnership('campaign-1', 'gm-user-1'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when campaign does not exist', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        finder.checkGmOwnership('campaign-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the GM', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        gmUserId: 'gm-user-1',
      });

      await expect(
        finder.checkGmOwnership('campaign-1', 'not-gm-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
