import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PrismaService } from '../database/prisma.service.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CryptoShreddingService {
  private readonly logger = new Logger(CryptoShreddingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateAndStoreKey(userId: string): Promise<Buffer> {
    const key = randomBytes(32);
    await this.prisma.encryptionKey.create({
      data: {
        userId,
        key: key.toString('base64'),
      },
    });
    return key;
  }

  async getKey(userId: string): Promise<Buffer | null> {
    const record = await this.prisma.encryptionKey.findUnique({
      where: { userId },
    });
    if (!record) return null;
    return Buffer.from(record.key, 'base64');
  }

  encrypt(plaintext: string, key: Buffer): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Format: base64(iv + authTag + encrypted)
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string, key: Buffer): string {
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = decipher.update(encrypted, undefined, 'utf8');
    return decrypted + decipher.final('utf8');
  }

  async destroyKey(userId: string): Promise<void> {
    const result = await this.prisma.encryptionKey.deleteMany({
      where: { userId },
    });
    if (result.count > 0) {
      this.logger.log(`Encryption key destroyed for user ${userId}`);
    } else {
      this.logger.warn(`No encryption key found for user ${userId} — skipping`);
    }
  }
}
