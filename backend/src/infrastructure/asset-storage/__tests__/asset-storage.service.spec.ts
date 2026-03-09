import { AssetStorageService } from '../asset-storage.service.js';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

describe('AssetStorageService', () => {
  let service: AssetStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_PUBLIC_URL = 'https://cdn.example.com';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'test-key';
    process.env.S3_SECRET_KEY = 'test-secret';
    service = new AssetStorageService();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate a presigned upload URL and public URL', async () => {
      const expectedUploadUrl =
        'https://test-bucket.s3.amazonaws.com/some-key?signature=abc';
      mockGetSignedUrl.mockResolvedValue(expectedUploadUrl);

      const result = await service.generatePresignedUploadUrl(
        'campaigns/camp-1/maps/level-1/background/img.jpg',
        'image/jpeg',
        5242880,
      );

      expect(result.uploadUrl).toBe(expectedUploadUrl);
      expect(result.publicUrl).toBe(
        'https://cdn.example.com/campaigns/camp-1/maps/level-1/background/img.jpg',
      );
    });

    it('should call getSignedUrl with 300s expiry', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url');

      await service.generatePresignedUploadUrl(
        'some-key',
        'image/png',
        1024,
      );

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'some-key',
            ContentType: 'image/png',
            ContentLength: 1024,
          }),
        }),
        { expiresIn: 300 },
      );
    });

    it('should format the S3 key correctly in the public URL', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url');

      const key =
        'campaigns/abc-123/maps/def-456/background/uuid-789.webp';
      const result = await service.generatePresignedUploadUrl(
        key,
        'image/webp',
        2048,
      );

      expect(result.publicUrl).toBe(`https://cdn.example.com/${key}`);
    });

    it('should propagate errors from S3 client', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('S3 error'));

      await expect(
        service.generatePresignedUploadUrl('key', 'image/jpeg', 1024),
      ).rejects.toThrow('S3 error');
    });
  });

  describe('constructor validation', () => {
    it('should throw if S3_BUCKET is missing', () => {
      delete process.env.S3_BUCKET;
      expect(() => new AssetStorageService()).toThrow('S3_BUCKET environment variable is required');
    });

    it('should throw if S3_PUBLIC_URL is missing', () => {
      delete process.env.S3_PUBLIC_URL;
      expect(() => new AssetStorageService()).toThrow('S3_PUBLIC_URL environment variable is required');
    });

    it('should throw if S3_ACCESS_KEY is missing', () => {
      delete process.env.S3_ACCESS_KEY;
      expect(() => new AssetStorageService()).toThrow('S3_ACCESS_KEY environment variable is required');
    });

    it('should throw if S3_SECRET_KEY is missing', () => {
      delete process.env.S3_SECRET_KEY;
      expect(() => new AssetStorageService()).toThrow('S3_SECRET_KEY environment variable is required');
    });
  });

  describe('deleteObject', () => {
    it('should send a DeleteObjectCommand', async () => {
      mockSend.mockResolvedValue({});

      await service.deleteObject('some-key');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'some-key',
          }),
        }),
      );
    });

    it('should propagate errors from S3 client', async () => {
      mockSend.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteObject('some-key')).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
