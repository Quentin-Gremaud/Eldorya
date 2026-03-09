import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RequestMapBackgroundUploadController } from '../controllers/request-map-background-upload.controller.js';
import { AssetStorageService } from '../../../infrastructure/asset-storage/asset-storage.service.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';

describe('RequestMapBackgroundUploadController', () => {
  let controller: RequestMapBackgroundUploadController;
  let assetStorageService: { generatePresignedUploadUrl: jest.Mock };
  let mapLevelFinder: { checkGmOwnership: jest.Mock };
  let mapLevelQueryFinder: { findByCampaignId: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = 'gm-user-1';

  beforeEach(async () => {
    mapLevelFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };
    mapLevelQueryFinder = {
      findByCampaignId: jest.fn().mockResolvedValue([
        { id: mapLevelId, campaignId, name: 'World', parentId: null, depth: 0, createdAt: new Date(), updatedAt: new Date() },
      ]),
    };
    assetStorageService = {
      generatePresignedUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
        publicUrl: 'https://cdn.example.com/campaigns/camp/maps/level/background/img.jpg',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestMapBackgroundUploadController],
      providers: [
        { provide: AssetStorageService, useValue: assetStorageService },
        { provide: MapLevelFinder, useValue: mapLevelFinder },
        { provide: MapLevelQueryFinder, useValue: mapLevelQueryFinder },
      ],
    }).compile();

    controller = module.get(RequestMapBackgroundUploadController);
  });

  it('should return 200 with upload URL and public URL', async () => {
    const result = await controller.handle(
      campaignId,
      mapLevelId,
      { contentType: 'image/jpeg', fileSizeBytes: 1024000 },
      userId,
    );

    expect(result).toEqual({
      data: {
        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
        publicUrl: 'https://cdn.example.com/campaigns/camp/maps/level/background/img.jpg',
      },
    });
  });

  it('should check GM ownership', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { contentType: 'image/png', fileSizeBytes: 2048 },
      userId,
    );

    expect(mapLevelFinder.checkGmOwnership).toHaveBeenCalledWith(campaignId, userId);
  });

  it('should verify map level existence', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { contentType: 'image/png', fileSizeBytes: 2048 },
      userId,
    );

    expect(mapLevelQueryFinder.findByCampaignId).toHaveBeenCalledWith(campaignId);
  });

  it('should throw NotFoundException when map level does not exist', async () => {
    mapLevelQueryFinder.findByCampaignId.mockResolvedValue([]);

    await expect(
      controller.handle(
        campaignId,
        mapLevelId,
        { contentType: 'image/jpeg', fileSizeBytes: 1024 },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    mapLevelFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle(
        campaignId,
        mapLevelId,
        { contentType: 'image/jpeg', fileSizeBytes: 1024 },
        'non-gm-user',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should generate S3 key with correct extension for jpeg', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { contentType: 'image/jpeg', fileSizeBytes: 1024 },
      userId,
    );

    const [key, contentType, maxSize] = assetStorageService.generatePresignedUploadUrl.mock.calls[0];
    expect(key).toMatch(new RegExp(`^campaigns/${campaignId}/maps/${mapLevelId}/background/[a-f0-9-]+\\.jpg$`));
    expect(contentType).toBe('image/jpeg');
    expect(maxSize).toBe(1024);
  });

  it('should generate S3 key with correct extension for webp', async () => {
    await controller.handle(
      campaignId,
      mapLevelId,
      { contentType: 'image/webp', fileSizeBytes: 2048 },
      userId,
    );

    const [key] = assetStorageService.generatePresignedUploadUrl.mock.calls[0];
    expect(key).toMatch(/\.webp$/);
  });
});
