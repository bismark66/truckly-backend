import { UnsupportedMediaTypeException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp|gif|svg\+xml)$/;
const ALLOWED_DOCUMENT_TYPES =
  /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|image\/(jpeg|jpg|png))$/;

// ─── Generic filter factories ────────────────────────────────────────────────

function imageFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (ALLOWED_IMAGE_TYPES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new UnsupportedMediaTypeException(
        `Unsupported file type "${file.mimetype}". Allowed: jpeg, jpg, png, webp, gif, svg`,
      ),
      false,
    );
  }
}

function documentFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (ALLOWED_DOCUMENT_TYPES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new UnsupportedMediaTypeException(
        `Unsupported file type "${file.mimetype}". Allowed: pdf, doc, docx, jpeg, png`,
      ),
      false,
    );
  }
}

/** Single image upload — e.g. @UseInterceptors(UploadImageInterceptor('avatar')) */
export const UploadImageInterceptor = (fieldName: string, maxSizeMb = 5) =>
  FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: imageFilter,
  });

/** Single document/image upload — e.g. @UseInterceptors(UploadDocumentInterceptor('ghanaCard')) */
export const UploadDocumentInterceptor = (fieldName: string, maxSizeMb = 10) =>
  FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: documentFilter,
  });

// ─── Pre-configured multiple-files interceptors ───────────────────────────────

/** Multiple image uploads — e.g. @UseInterceptors(UploadImagesInterceptor('photos', 5)) */
export const UploadImagesInterceptor = (
  fieldName: string,
  maxCount = 10,
  maxSizeMb = 5,
) =>
  FilesInterceptor(fieldName, maxCount, {
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: imageFilter,
  });

/** Multiple document uploads */
export const UploadDocumentsInterceptor = (
  fieldName: string,
  maxCount = 5,
  maxSizeMb = 10,
) =>
  FilesInterceptor(fieldName, maxCount, {
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: documentFilter,
  });
