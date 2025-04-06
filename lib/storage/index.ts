import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageService {
  upload(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; pathname: string }>;
  getUrl(key: string): Promise<string>;
}

export class S3rverStorageService implements StorageService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3RVER_ENDPOINT || 'http://localhost:4568',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3RVER_ACCESS_KEY || 'S3RVER',
        secretAccessKey: process.env.S3RVER_SECRET_KEY || 'S3RVER',
      },
      forcePathStyle: true,
    });
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; pathname: string }> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3RVER_BUCKET || 'uploads',
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3.send(command);

    const url = await this.getUrl(key);
    return {
      url,
      pathname: key,
    };
  }

  async getUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.S3RVER_BUCKET || 'uploads',
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}

// For production, we'll use this S3 implementation
export class S3StorageService implements StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required AWS credentials or bucket name');
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucket = bucketName;
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; pathname: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3.send(command);

    const url = await this.getUrl(key);
    return {
      url,
      pathname: key,
    };
  }

  async getUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}

// Use s3rver in development, S3 in production
export const storageService = process.env.NODE_ENV === 'production'
  ? new S3StorageService()
  : new S3rverStorageService(); 