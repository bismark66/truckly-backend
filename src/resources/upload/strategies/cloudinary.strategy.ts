import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CLOUDINARY } from 'src/common/constants';
import { v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');
import type {
  FileUploadStrategy,
  UploadOptions,
  UploadResult,
} from '../interfaces/file-upload.interface';

@Injectable()
export class CloudinaryStrategy implements FileUploadStrategy {
  constructor(@Inject(CLOUDINARY) _cloudinary: unknown) {
    // Injecting the CLOUDINARY token ensures the provider has run
    // and v2 is fully configured with credentials before any upload.
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File buffer is empty or missing');
    }

    const { folder, resourceType = 'auto', publicId, extra = {} } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { folder, resource_type: resourceType, public_id: publicId, ...extra },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result)
            return reject(new Error('Upload failed: no result returned'));
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        },
      );
      toStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Delete failed'));
          resolve(result as { result: string });
        },
      );
    });
  }

  extractPublicId(cloudinaryUrl: string): string {
    // https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/file.jpg
    const parts = cloudinaryUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new BadRequestException('Invalid Cloudinary URL');
    }
    const afterUpload = parts.slice(uploadIndex + 1);
    if (/^v\d+$/.test(afterUpload[0])) afterUpload.shift(); // strip version
    return afterUpload.join('/').replace(/\.[^/.]+$/, ''); // strip extension
  }
}
