import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  FileUploadStrategy,
  UploadOptions,
  UploadResult,
} from '../interfaces/file-upload.interface';

/**
 * Cloudflare R2 upload strategy.
 *
 * TODO: Cloudflare R2 is S3-compatible — install `@aws-sdk/client-s3` and
 * point it at the R2 endpoint. Implement each method.
 * Required env vars:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_ACCESS_KEY_ID
 *   CLOUDFLARE_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET
 */
@Injectable()
export class CloudflareStrategy implements FileUploadStrategy {
  uploadFile(
    _file: Express.Multer.File,
    _options?: UploadOptions,
  ): Promise<UploadResult> {
    throw new NotImplementedException(
      'Cloudflare R2 upload strategy not yet implemented',
    );
  }

  deleteFile(
    _publicId: string,
    _resourceType?: 'image' | 'video' | 'raw',
  ): Promise<{ result: string }> {
    throw new NotImplementedException(
      'Cloudflare R2 delete strategy not yet implemented',
    );
  }

  extractPublicId(url: string): string {
    // R2 public URL: https://pub-<hash>.r2.dev/<object-key>
    const match = url.match(/r2\.dev\/(.+)/);
    if (!match) throw new Error('Invalid Cloudflare R2 URL');
    return match[1];
  }
}
