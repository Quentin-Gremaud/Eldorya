import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GetPlayerCampaignsController } from '../controllers/get-player-campaigns.controller';
import { PlayerCampaignsFinder } from '../finders/player-campaigns.finder';
import { PlayerCampaignDto } from '../dto/player-campaign.dto';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator';

describe('GetPlayerCampaignsController', () => {
  let controller: GetPlayerCampaignsController;
  let finder: { findPlayerCampaigns: jest.Mock };

  beforeEach(async () => {
    finder = {
      findPlayerCampaigns: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPlayerCampaignsController],
      providers: [
        { provide: PlayerCampaignsFinder, useValue: finder },
      ],
    }).compile();

    controller = module.get<GetPlayerCampaignsController>(
      GetPlayerCampaignsController,
    );
  });

  it('should return 200 with player campaigns wrapped in data', async () => {
    const campaigns: PlayerCampaignDto[] = [
      new PlayerCampaignDto({
        id: 'campaign-1',
        name: 'Dragon Quest',
        description: 'An adventure',
        coverImageUrl: null,
        status: 'active',
        gmDisplayName: 'John Doe',
        playerCount: 4,
        lastSessionDate: null,
      }),
    ];
    finder.findPlayerCampaigns.mockResolvedValue(campaigns);

    const result = await controller.handle('user-123');

    expect(result).toEqual({ data: campaigns });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Dragon Quest');
    expect(result.data[0].role).toBe('player');
    expect(result.data[0].gmDisplayName).toBe('John Doe');
  });

  it('should call finder with the authenticated userId', async () => {
    finder.findPlayerCampaigns.mockResolvedValue([]);

    await controller.handle('user-456');

    expect(finder.findPlayerCampaigns).toHaveBeenCalledTimes(1);
    expect(finder.findPlayerCampaigns).toHaveBeenCalledWith('user-456');
  });

  it('should return empty data array when user has no player campaigns', async () => {
    finder.findPlayerCampaigns.mockResolvedValue([]);

    const result = await controller.handle('user-789');

    expect(result).toEqual({ data: [] });
    expect(result.data).toHaveLength(0);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetPlayerCampaignsController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetPlayerCampaignsController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
