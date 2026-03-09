import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RequestMapBackgroundUploadDto } from '../dto/request-map-background-upload.dto.js';
import { AssetStorageService } from '../../../infrastructure/asset-storage/asset-storage.service.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Controller('campaigns')
export class RequestMapBackgroundUploadController {
  constructor(
    private readonly assetStorageService: AssetStorageService,
    private readonly mapLevelFinder: MapLevelFinder,
    private readonly mapLevelQueryFinder: MapLevelQueryFinder,
  ) {}

  @Post(':campaignId/map-levels/:mapLevelId/background/upload-url')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('mapLevelId', new ParseUUIDPipe()) mapLevelId: string,
    @Body() dto: RequestMapBackgroundUploadDto,
    @AuthUserId() userId: string,
  ): Promise<{ data: { uploadUrl: string; publicUrl: string } }> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    const levels = await this.mapLevelQueryFinder.findByCampaignId(campaignId);
    const levelExists = levels.some((l) => l.id === mapLevelId);
    if (!levelExists) {
      throw new NotFoundException('Map level not found');
    }

    const ext = CONTENT_TYPE_EXTENSIONS[dto.contentType];
    if (!ext) {
      throw new BadRequestException(`Unsupported content type: ${dto.contentType}`);
    }
    const key = `campaigns/${campaignId}/maps/${mapLevelId}/background/${randomUUID()}.${ext}`;

    const result = await this.assetStorageService.generatePresignedUploadUrl(
      key,
      dto.contentType,
      dto.fileSizeBytes,
    );

    return { data: result };
  }
}
