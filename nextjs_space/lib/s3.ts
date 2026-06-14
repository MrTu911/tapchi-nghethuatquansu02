import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();

// File type configurations
const FILE_CONFIGS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
    folder: 'images'
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    folder: 'videos'
  },
  document: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    folder: 'documents'
  },
  any: {
    maxSize: 100 * 1024 * 1024,
    allowedTypes: [] as string[],
    folder: 'files'
  }
};

/**
 * Validate file type and size
 */
export function validateFile(fileType: string, fileSize: number, category: keyof typeof FILE_CONFIGS = 'any'): { isValid: boolean; error?: string } {
  const config = FILE_CONFIGS[category] || FILE_CONFIGS.any;
  
  if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(fileType)) {
    return { isValid: false, error: `Loại file không hợp lệ. Cho phép: ${config.allowedTypes.join(', ')}` };
  }
  
  if (fileSize > config.maxSize) {
    return { isValid: false, error: `File quá lớn. Tối đa: ${config.maxSize / (1024 * 1024)}MB` };
  }
  
  return { isValid: true };
}

/**
 * Generate presigned URL for single-part upload
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloudStoragePath: string }> {
  const { bucketName, folderPrefix } = getBucketConfig();
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
  
  const subFolder = isPublic ? 'public/uploads' : 'uploads';
  const cloudStoragePath = `${folderPrefix}${subFolder}/${timestamp}-${randomStr}-${safeName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ContentType: contentType,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { uploadUrl, cloudStoragePath };
}

/**
 * Get URL for accessing a file - returns signed URL
 */
export async function getFileUrl(
  cloudStoragePath: string,
  isPublic: boolean = true
): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  // Always use signed URLs for reliability
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  });
  
  // Long expiry for public files (24h), shorter for private (1h)
  const expiresIn = isPublic ? 86400 : 3600;
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(cloudStoragePath: string): Promise<boolean> {
  const { bucketName } = getBucketConfig();
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cloudStoragePath,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Failed to delete file from S3:', error);
    return false;
  }
}

/**
 * Upload file buffer directly to S3 (server-side upload)
 * This is the main function for uploading files
 */
export async function uploadFileToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  category: string = 'general',
  isPublic: boolean = true
): Promise<{ cloudStoragePath: string; url: string; filePath: string }> {
  const { bucketName, folderPrefix } = getBucketConfig();
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
  
  // Determine folder based on content type
  let typeFolder = 'files';
  if (contentType.startsWith('image/')) typeFolder = 'images';
  else if (contentType.startsWith('video/')) typeFolder = 'videos';
  else if (contentType.includes('pdf') || contentType.includes('document')) typeFolder = 'documents';
  
  const cloudStoragePath = `${folderPrefix}${typeFolder}/${category}/${timestamp}-${randomStr}-${safeName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    Body: buffer,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  
  const url = await getFileUrl(cloudStoragePath, isPublic);
  
  return { 
    cloudStoragePath, 
    url,
    filePath: cloudStoragePath // Alias for compatibility
  };
}

/**
 * Save file from File object to S3 - compatible with old saveFile interface
 */
export async function saveFile(
  file: File,
  category: string = 'general',
  isPublic: boolean = true
): Promise<{ filePath: string; fileName: string; fileSize: number; mimeType: string; storedName: string; cloudStoragePath: string; url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFileToS3(buffer, file.name, file.type, category, isPublic);
  
  return {
    filePath: result.cloudStoragePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storedName: result.cloudStoragePath.split('/').pop() || file.name,
    cloudStoragePath: result.cloudStoragePath,
    url: result.url
  };
}

/**
 * Download file from S3 as Buffer (for server-side processing like PDF text extraction)
 */
export async function downloadFileBuffer(cloudStoragePath: string): Promise<Buffer | null> {
  const { bucketName } = getBucketConfig()
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: cloudStoragePath })
    const response = await s3Client.send(command)
    if (!response.Body) return null
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (error) {
    console.error('Failed to download file from S3:', cloudStoragePath, error)
    return null
  }
}

/**
 * Upload buffer directly to S3 (for PDF generation etc.)
 */
export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  category: string = 'articles'
): Promise<{ key: string; url: string; cloudStoragePath: string }> {
  const result = await uploadFileToS3(buffer, fileName, contentType, category, true);
  return {
    key: result.cloudStoragePath,
    url: result.url,
    cloudStoragePath: result.cloudStoragePath
  };
}
