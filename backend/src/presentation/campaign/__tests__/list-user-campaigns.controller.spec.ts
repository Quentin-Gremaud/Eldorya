import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ListUserCampaignsController } from '../controllers/list-user-campaigns.controller';
import { GetUserCampaignsQuery } from '../queries/get-user-campaigns.query';
import { CampaignSummaryDto } from '../dto/campaign-summary.dto';

describe('ListUserCampaignsController', () => {
  let controller: ListUserCampaignsController;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListUserCampaignsController],
      providers: [
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ListUserCampaignsController>(
      ListUserCampaignsController,
    );
    queryBus = module.get(QueryBus);
  });

  it('should dispatch GetUserCampaignsQuery with the authenticated userId', async () => {
    const campaigns: CampaignSummaryDto[] = [];
    queryBus.execute.mockResolvedValue(campaigns);

    await controller.handle('user-123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0][0];
    expect(query).toBeInstanceOf(GetUserCampaignsQuery);
    expect(query.userId).toBe('user-123');
  });

  it('should return 200 with data wrapper containing campaigns', async () => {
    const campaigns: CampaignSummaryDto[] = [
      new CampaignSummaryDto({
        id: 'campaign-1',
        name: 'Test Campaign',
        description: 'A test',
        coverImageUrl: null,
        status: 'active',
        role: 'gm',
        playerCount: 3,
        lastSessionDate: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
    ];
    queryBus.execute.mockResolvedValue(campaigns);

    const result = await controller.handle('user-123');

    expect(result).toEqual({ data: campaigns });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Test Campaign');
    expect(result.data[0].role).toBe('gm');
  });

  it('should return empty data array when user has no campaigns', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('user-456');

    expect(result).toEqual({ data: [] });
    expect(result.data).toHaveLength(0);
  });
});
