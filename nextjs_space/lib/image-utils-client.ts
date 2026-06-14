/**
 * CLIENT-SAFE Image utilities
 * Can be imported by both client and server components
 * Supports S3 cloud storage
 */

/**
 * Convert file path to accessible image URL
 * All S3 paths go through /api/images/s3 proxy for signed URLs
 */
export function getImageUrl(filePath: string | null | undefined): string {
  if (!filePath) {
    return '/images/placeholder.png';
  }

  // If already a full URL (S3 signed URL or external), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // If already an API path, return as is
  if (filePath.startsWith('/api/')) {
    return filePath;
  }

  // All S3 paths (starting with folder prefix like 8414/) go through proxy
  // This handles: 8414/images/..., 8414/videos/..., etc.
  if (/^\d+\//.test(filePath)) {
    return `/api/images/s3?key=${encodeURIComponent(filePath)}`;
  }

  // Local /uploads/ paths — serve directly from public/ (must check before /images/ pattern)
  if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
    return filePath.startsWith('/') ? filePath : '/' + filePath;
  }

  // Non-/uploads/ paths with S3 folder structure — route through proxy
  if (filePath.includes('/images/') || filePath.includes('/videos/') || filePath.includes('/documents/')) {
    const folderPrefix = process.env.NEXT_PUBLIC_AWS_FOLDER_PREFIX || '8414/';
    return `/api/images/s3?key=${encodeURIComponent(folderPrefix + filePath)}`;
  }

  // Default: assume S3 path without prefix
  return `/api/images/s3?key=${encodeURIComponent(filePath)}`;
}

/**
 * Get multiple image URLs at once
 */
export function getImageUrls(filePaths: (string | null | undefined)[]): string[] {
  return filePaths.map(path => getImageUrl(path));
}
