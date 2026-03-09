import { Module } from '@nestjs/common';
import { CryptoShreddingService } from './crypto-shredding.service.js';

@Module({
  providers: [CryptoShreddingService],
  exports: [CryptoShreddingService],
})
export class GdprModule {}
