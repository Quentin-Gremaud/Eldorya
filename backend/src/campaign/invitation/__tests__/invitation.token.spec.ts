import { createHash } from 'crypto';
import {
  InvitationToken,
  InvalidInvitationTokenException,
} from '../invitation-token.js';

describe('InvitationToken', () => {
  describe('fromRawToken()', () => {
    it('should create a token from a raw string', () => {
      const token = InvitationToken.fromRawToken('my-secret-token-value');

      expect(token).toBeDefined();
      expect(token.hash()).toBeDefined();
      expect(token.hash().length).toBeGreaterThan(0);
    });

    it('should hash immediately on construction (no raw token stored)', () => {
      const rawToken = 'my-secret-token-value';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      const token = InvitationToken.fromRawToken(rawToken);

      // The hash should match the SHA-256 of the raw token
      expect(token.hash()).toBe(expectedHash);
      // The token object should not expose the raw value anywhere
      expect(JSON.stringify(token)).not.toContain(rawToken);
    });

    it('should throw InvalidInvitationTokenException for empty string', () => {
      expect(() => InvitationToken.fromRawToken('')).toThrow(
        InvalidInvitationTokenException,
      );
    });

    it('should throw InvalidInvitationTokenException for whitespace-only string', () => {
      expect(() => InvitationToken.fromRawToken('   ')).toThrow(
        InvalidInvitationTokenException,
      );
    });

    it('should throw InvalidInvitationTokenException for token shorter than 16 characters', () => {
      expect(() => InvitationToken.fromRawToken('short-token')).toThrow(
        InvalidInvitationTokenException,
      );
      expect(() => InvitationToken.fromRawToken('short-token')).toThrow(
        'Invitation token must be at least 16 characters.',
      );
    });

    it('should accept a token that is exactly 16 characters', () => {
      const sixteenCharToken = 'abcdefghijklmnop'; // exactly 16 chars
      const token = InvitationToken.fromRawToken(sixteenCharToken);
      expect(token).toBeDefined();
      expect(token.hash()).toHaveLength(64);
    });

    it('should reject a token that is 15 characters', () => {
      const fifteenCharToken = 'abcdefghijklmno'; // exactly 15 chars
      expect(() => InvitationToken.fromRawToken(fifteenCharToken)).toThrow(
        'Invitation token must be at least 16 characters.',
      );
    });
  });

  describe('hash()', () => {
    it('should return a consistent SHA-256 hex digest', () => {
      const rawToken = 'test-token-123456789';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      const token = InvitationToken.fromRawToken(rawToken);

      expect(token.hash()).toBe(expectedHash);
      // SHA-256 hex digest is always 64 characters
      expect(token.hash()).toHaveLength(64);
    });
  });

  describe('equals()', () => {
    it('should return true for tokens created from the same raw value', () => {
      const token1 = InvitationToken.fromRawToken('same-token-value-long');
      const token2 = InvitationToken.fromRawToken('same-token-value-long');

      expect(token1.equals(token2)).toBe(true);
    });

    it('should return false for tokens created from different raw values', () => {
      const token1 = InvitationToken.fromRawToken('token-a-long-enough');
      const token2 = InvitationToken.fromRawToken('token-b-long-enough');

      expect(token1.equals(token2)).toBe(false);
    });

    it('should compare by hash, not by reference', () => {
      const token1 = InvitationToken.fromRawToken('identical-token-value');
      const token2 = InvitationToken.fromRawToken('identical-token-value');

      // Different object references but same hash
      expect(token1).not.toBe(token2);
      expect(token1.equals(token2)).toBe(true);
      expect(token1.hash()).toBe(token2.hash());
    });
  });

  describe('InvalidInvitationTokenException', () => {
    it('should be exported and throwable', () => {
      expect(InvalidInvitationTokenException).toBeDefined();

      try {
        InvitationToken.fromRawToken('');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInvitationTokenException);
        expect((error as Error).message).toBe(
          'Invitation token cannot be empty or whitespace-only.',
        );
      }
    });
  });
});
