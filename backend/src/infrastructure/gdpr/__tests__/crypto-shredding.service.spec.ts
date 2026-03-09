import { CryptoShreddingService } from '../crypto-shredding.service';
import { randomBytes } from 'crypto';

describe('CryptoShreddingService', () => {
  let service: CryptoShreddingService;

  beforeEach(() => {
    // Create service with mocked PrismaService
    service = new CryptoShreddingService({} as any);
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt back to original value', () => {
      const key = randomBytes(32);
      const plaintext = 'test@example.com';

      const encrypted = service.encrypt(plaintext, key);
      const decrypted = service.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext with different keys', () => {
      const key1 = randomBytes(32);
      const key2 = randomBytes(32);
      const plaintext = 'sensitive data';

      const encrypted1 = service.encrypt(plaintext, key1);
      const encrypted2 = service.encrypt(plaintext, key2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const key = randomBytes(32);
      const plaintext = 'same text';

      const encrypted1 = service.encrypt(plaintext, key);
      const encrypted2 = service.encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail to decrypt with wrong key', () => {
      const key1 = randomBytes(32);
      const key2 = randomBytes(32);
      const plaintext = 'secret';

      const encrypted = service.encrypt(plaintext, key1);

      expect(() => service.decrypt(encrypted, key2)).toThrow();
    });

    it('should handle Unicode characters', () => {
      const key = randomBytes(32);
      const plaintext = 'Héléne Müller — ñ';

      const encrypted = service.encrypt(plaintext, key);
      const decrypted = service.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const key = randomBytes(32);
      const plaintext = '';

      const encrypted = service.encrypt(plaintext, key);
      const decrypted = service.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });
});
