import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FILE_UPLOAD_STRATEGY } from 'src/common/constants';
import { CloudinaryModule } from '../providers/cloudinary/cloudinary.module';
import { CloudinaryStrategy } from './strategies/cloudinary.strategy';
import { AwsS3Strategy } from './strategies/aws-s3.strategy';
import { CloudflareStrategy } from './strategies/cloudflare.strategy';
import { FileUploadService } from './file-upload.service';

function resolveStrategyClass() {
  const provider = (process.env.UPLOAD_PROVIDER ?? 'cloudinary').toLowerCase();
  switch (provider) {
    case 'aws':
      return AwsS3Strategy;
    case 'cloudflare':
      return CloudflareStrategy;
    case 'cloudinary':
    default:
      return CloudinaryStrategy;
  }
}

const strategyClass = resolveStrategyClass();

// Only initialise the Cloudinary SDK when it's actually the active provider.
// This avoids startup errors when env vars for other providers are missing.
const conditionalImports = strategyClass === CloudinaryStrategy ? [CloudinaryModule] : [];

@Module({
  imports: [ConfigModule, ...conditionalImports],
  providers: [
    {
      provide: FILE_UPLOAD_STRATEGY,
      useClass: strategyClass,
    },
    FileUploadService,
  ],
  exports: [FileUploadService],
})
export class FileUploadModule {}


