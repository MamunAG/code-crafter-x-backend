import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AwsConfigService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  getS3Client(): S3Client {
    return this.s3Client;
  }

  getBucketName(): string {
    return process.env.AWS_S3_BUCKET_NAME || 'blue-atlantic-files';
  }

  getS3BaseUrl(): string {
    const bucketName = this.getBucketName();
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com`;
  }
}
