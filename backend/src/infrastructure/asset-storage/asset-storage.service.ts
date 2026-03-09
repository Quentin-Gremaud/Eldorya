import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetStorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    const publicUrl = process.env.S3_PUBLIC_URL;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;

    if (!bucket) throw new Error('S3_BUCKET environment variable is required');
    if (!publicUrl) throw new Error('S3_PUBLIC_URL environment variable is required');
    if (!accessKey) throw new Error('S3_ACCESS_KEY environment variable is required');
    if (!secretKey) throw new Error('S3_SECRET_KEY environment variable is required');

    this.bucket = bucket;
    this.publicUrl = publicUrl;

    const endpoint = process.env.S3_ENDPOINT;
    this.s3Client = new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    maxSizeBytes: number,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: maxSizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl };
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
