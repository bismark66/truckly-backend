import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  FileUploadStrategy,
  UploadOptions,
  UploadResult,
} from '../interfaces/file-upload.interface';

/**
 * AWS S3 upload strategy.
 *
 * TODO: Install `@aws-sdk/client-s3` and implement each method.
 * Required env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION
 *   AWS_S3_BUCKET
 */
@Injectable()
export class AwsS3Strategy implements FileUploadStrategy {
  uploadFile(
    _file: Express.Multer.File,
    _options?: UploadOptions,
  ): Promise<UploadResult> {
    throw new NotImplementedException('AWS S3 upload strategy not yet implemented');
  }

  deleteFile(
    _publicId: string,
    _resourceType?: 'image' | 'video' | 'raw',
  ): Promise<{ result: string }> {
    throw new NotImplementedException('AWS S3 delete strategy not yet implemented');
  }

  extractPublicId(url: string): string {
    // S3 object key is everything after the bucket host
    // e.g. https://<bucket>.s3.<region>.amazonaws.com/folder/filename.jpg → folder/filename.jpg
    const match = url.match(/amazonaws\.com\/(.+)/);
    if (!match) throw new Error('Invalid AWS S3 URL');
    return match[1];
  }
}
