import { Global, Module } from '@nestjs/common';
import { AssetStorageService } from './asset-storage.service.js';

@Global()
@Module({
  providers: [AssetStorageService],
  exports: [AssetStorageService],
})
export class AssetStorageModule {}
