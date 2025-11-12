import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class StorageService {
  private s3: S3Client
  private bucket: string
  private endpoint: string

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT')!
    this.bucket = config.get<string>('S3_BUCKET')!
    this.endpoint = endpoint.replace(/\/$/, '')
    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: config.get<string>('S3_SECRET_KEY')!,
      },
    })
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType?: string) {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType
    }))
    return { key, url: `${this.endpoint}/${this.bucket}/${encodeURI(key)}` }
  }
}
