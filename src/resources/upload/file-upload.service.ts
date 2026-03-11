import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { FILE_UPLOAD_STRATEGY } from 'src/common/constants';
import type {
  FileUploadStrategy,
  UploadOptions,
  UploadResult,
} from './interfaces/file-upload.interface';

/**
 * FileUploadService
 *
 * A thin facade over the active FileUploadStrategy.
 * Inject this service in any feature module — never inject the strategy directly.
 *
 * Active strategy is controlled by the UPLOAD_PROVIDER env var:
 *   cloudinary  (default) → CloudinaryStrategy
 *   aws         → AwsS3Strategy
 *   cloudflare  → CloudflareStrategy
 */
@Injectable()
export class FileUploadService {
  constructor(
    @Inject(FILE_UPLOAD_STRATEGY)
    private readonly strategy: FileUploadStrategy,
  ) {}

  /** Upload a single file via the active provider. */
  uploadFile(
    file: Express.Multer.File,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return this.strategy.uploadFile(file, options);
  }

  /**
   * Upload multiple files concurrently.
   * Implemented here as a generic utility — each provider only needs to
   * implement single-file upload.
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options?: UploadOptions,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return Promise.all(files.map((file) => this.strategy.uploadFile(file, options)));
  }

  /** Delete a file by its provider public/object ID. */
  deleteFile(
    publicId: string,
    resourceType?: 'image' | 'video' | 'raw',
  ): Promise<{ result: string }> {
    return this.strategy.deleteFile(publicId, resourceType);
  }

  /** Extract a provider public/object ID from a stored asset URL. */
  extractPublicId(url: string): string {
    return this.strategy.extractPublicId(url);
  }
}

