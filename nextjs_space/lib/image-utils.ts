
/**
 * Image utilities for handling local storage images
 * Re-exports client-safe functions and provides server-only functions
 */

// Re-export client-safe functions
export { getImageUrl, getImageUrls } from './image-utils-client';

// Import server-side only utilities
import { getFileUrl } from './local-storage';

/**
 * Generate a file URL directly (for API responses)
 * ⚠️ SERVER-SIDE ONLY
 */
export async function getSignedImageUrl(
  filePath: string | null | undefined,
  isPublic: boolean = true
): Promise<string> {
  if (!filePath) {
    return '/images/placeholder.png';
  }

  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // If it's a local path (starts with /), return as is
  if (filePath.startsWith('/')) {
    return filePath;
  }

  try {
    return getFileUrl(filePath, isPublic);
  } catch (error) {
    console.error('Error generating file URL:', error);
    return '/images/placeholder.png';
  }
}

/**
 * Add file URLs to objects with image fields
 * Usage: await addSignedUrls(banners, ['imageUrl', 'thumbnailUrl'], true)
 */
export async function addSignedUrls<T extends Record<string, any>>(
  items: T[],
  imageFields: string[],
  isPublic: boolean = true
): Promise<T[]> {
  const promises = items.map(async (item) => {
    const signedUrls: Record<string, string> = {};
    
    for (const field of imageFields) {
      const filePath = item[field];
      if (filePath) {
        signedUrls[`${field}Signed`] = await getSignedImageUrl(filePath, isPublic);
      }
    }
    
    return { ...item, ...signedUrls };
  });

  return Promise.all(promises);
}
