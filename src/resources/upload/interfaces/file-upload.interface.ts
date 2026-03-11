export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  /** Destination folder on the CDN, e.g. 'truckly/avatars' */
  folder?: string;
  /** Media type hint — defaults to 'auto' */
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  /** Overwrite an existing asset by its public/object ID */
  publicId?: string;
  /** Provider-specific extra options (passed through as-is) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: Record<string, any>;
}

export interface FileUploadStrategy {
  /**
   * Upload a single file and return a normalised result.
   * This is the core method each provider must implement.
   */
  uploadFile(
    file: Express.Multer.File,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * Delete a previously uploaded file by its provider public/object ID.
   * @param resourceType - only relevant for providers that distinguish types (e.g. Cloudinary)
   */
  deleteFile(
    publicId: string,
    resourceType?: 'image' | 'video' | 'raw',
  ): Promise<{ result: string }>;

  /**
   * Extract the provider-specific public/object ID from a stored URL.
   * Useful when you stored only the URL and need to delete the asset later.
   */
  extractPublicId(url: string): string;
}

