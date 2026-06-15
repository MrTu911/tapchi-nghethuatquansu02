/**
 * Local Filesystem Storage Module
 * 
 * Quản lý lưu trữ file trên filesystem local cho hệ thống mạng nội bộ.
 * Thay thế AWS S3 để đảm bảo tự chủ hoàn toàn, không phụ thuộc Internet.
 * 
 * Nguyên tắc thiết kế:
 * - File lưu trên filesystem – Metadata lưu trong DB
 * - Phân loại rõ ràng theo loại dữ liệu + nghiệp vụ
 * - Kiểm soát quyền truy cập ở backend
 * - Hỗ trợ cả public URL và signed URL
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';

// ============================================================================
// CẤU HÌNH
// ============================================================================

/**
 * Đường dẫn gốc cho thư mục upload
 * Production: Dùng thư mục public/uploads (có quyền write và serve trực tiếp)
 * Development: Dùng thư mục upload riêng
 */
const getUploadRoot = () => {
  // Nếu có biến môi trường UPLOAD_ROOT và là đường dẫn tương đối
  if (process.env.UPLOAD_ROOT) {
    const uploadRoot = process.env.UPLOAD_ROOT;
    // Chuyển đường dẫn tương đối thành tuyệt đối
    if (!path.isAbsolute(uploadRoot)) {
      return path.join(process.cwd(), uploadRoot);
    }
    return uploadRoot;
  }
  // Mặc định: dùng thư mục public/uploads để có thể serve trực tiếp
  return path.join(process.cwd(), 'public', 'uploads');
};

const UPLOAD_ROOT = getUploadRoot();

/**
 * Giới hạn dung lượng video (MB) — cấu hình qua env MAX_VIDEO_UPLOAD_MB.
 * Đặt 0 (hoặc không đặt) = KHÔNG giới hạn dung lượng video.
 * Lưu ý: đường upload một-POST vẫn bị ràng buộc bởi RAM; file rất lớn nên đi
 * qua luồng chunked/resumable (xem lib/services/video-upload-service.ts).
 */
const VIDEO_MAX_MB = parseInt(process.env.MAX_VIDEO_UPLOAD_MB || '0', 10);
const VIDEO_SIZE_LIMIT = VIDEO_MAX_MB > 0 ? VIDEO_MAX_MB * 1024 * 1024 : 0; // 0 = unlimited

/**
 * Giới hạn dung lượng file (bytes). video = 0 nghĩa là không giới hạn.
 */
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,     // 10MB
  video: VIDEO_SIZE_LIMIT,     // 0 = unlimited (cấu hình qua MAX_VIDEO_UPLOAD_MB)
  document: 50 * 1024 * 1024,  // 50MB
  audio: 200 * 1024 * 1024,    // 200MB
  default: 10 * 1024 * 1024,   // 10MB
};

/**
 * MIME types được phép
 */
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/x-matroska'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a'],
};

/**
 * Mapping category -> thư mục con
 */
const CATEGORY_PATHS = {
  // Images
  'article-image': 'images/articles',
  'user-avatar': 'images/users',
  'banner': 'images/banners',
  'issue-cover': 'images/issues',
  'news': 'images/news',
  'general': 'images/general',
  'media': 'images/media',
  
  // Videos
  'video': 'videos/uploads',
  'video-gallery': 'videos/gallery',

  // Podcasts
  'podcast-audio': 'podcasts/audio',
  'podcast-cover': 'podcasts/covers',

  // Documents
  'manuscript': 'documents/manuscripts',
  'review-file': 'documents/reviews',
  'issue-pdf': 'documents/issues',
  
  // Temp
  'temp': 'temp',
};

// ============================================================================
// TYPES
// ============================================================================

export interface SaveFileResult {
  filePath: string;       // Đường dẫn tương đối từ UPLOAD_ROOT (vd: 'images/articles/123-abc.jpg')
  fileName: string;       // Tên file gốc
  fileSize: number;       // Kích thước (bytes)
  mimeType: string;       // MIME type
  storedName: string;     // Tên file đã lưu (với timestamp)
}

export interface FileValidationError {
  isValid: false;
  error: string;
}

export interface FileValidationSuccess {
  isValid: true;
  fileType: 'image' | 'video' | 'document' | 'audio';
}

export type FileValidationResult = FileValidationError | FileValidationSuccess;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate file dựa trên MIME type và size
 */
export function validateFile(
  mimeType: string,
  fileSize: number
): FileValidationResult {
  // Xác định loại file
  let fileType: 'image' | 'video' | 'document' | 'audio' | null = null;

  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    fileType = 'image';
  } else if (ALLOWED_MIME_TYPES.video.includes(mimeType)) {
    fileType = 'video';
  } else if (ALLOWED_MIME_TYPES.document.includes(mimeType)) {
    fileType = 'document';
  } else if (ALLOWED_MIME_TYPES.audio.includes(mimeType)) {
    fileType = 'audio';
  }
  
  if (!fileType) {
    return {
      isValid: false,
      error: `Loại file không được hỗ trợ: ${mimeType}`,
    };
  }
  
  // Kiểm tra kích thước (maxSize = 0 nghĩa là không giới hạn — vd video)
  const maxSize = FILE_SIZE_LIMITS[fileType] ?? FILE_SIZE_LIMITS.default;
  if (maxSize > 0 && fileSize > maxSize) {
    return {
      isValid: false,
      error: `File quá lớn. Giới hạn: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }
  
  return { isValid: true, fileType };
}

/**
 * Tạo tên file unique với timestamp
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .substring(0, 50);
  
  return `${timestamp}-${randomStr}-${baseName}${ext}`;
}

/**
 * Đảm bảo thư mục tồn tại
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Lưu file vào filesystem
 * 
 * @param file - File object từ FormData
 * @param category - Loại file (vd: 'manuscript', 'article-image')
 * @param isPublic - File có public không (ảnh bài viết = true, manuscript = false)
 * @returns SaveFileResult chứa đường dẫn và metadata
 */
export async function saveFile(
  file: File,
  category: keyof typeof CATEGORY_PATHS = 'temp',
  isPublic: boolean = false
): Promise<SaveFileResult> {
  // Validate
  const validation = validateFile(file.type, file.size);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Xác định thư mục đích
  const categoryPath = CATEGORY_PATHS[category] || 'temp';
  const fullPath = path.join(UPLOAD_ROOT, categoryPath);
  
  // Đảm bảo thư mục tồn tại
  await ensureDir(fullPath);
  
  // Tạo tên file unique
  const storedName = generateUniqueFileName(file.name);
  const filePath = path.join(categoryPath, storedName);
  const absolutePath = path.join(UPLOAD_ROOT, filePath);
  
  // Lưu file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  
  return {
    filePath,           // 'images/articles/123-abc.jpg'
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storedName,
  };
}

/**
 * Lấy URL để truy cập file
 * 
 * @param filePath - Đường dẫn tương đối (từ DB: cloud_storage_path)
 * @param isPublic - File có public không
 * @returns URL để download/view file
 * 
 * Lưu ý:
 * - Public files: Trả về /uploads/{filePath} (serve trực tiếp từ public folder)
 * - Private files: Trả về /api/files/private/{filePath} (cần auth)
 */
export function getFileUrl(filePath: string, isPublic: boolean = false): string {
  const cleanPath = filePath.replace(/^\/+/, ''); // Remove leading slashes
  
  if (isPublic) {
    // Serve trực tiếp từ public/uploads
    return `/uploads/${cleanPath}`;
  }
  
  return `/api/files/private/${cleanPath}`;
}

/**
 * Xóa file khỏi filesystem
 * 
 * @param filePath - Đường dẫn tương đối từ UPLOAD_ROOT
 * @returns true nếu xóa thành công
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.join(UPLOAD_ROOT, filePath);
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
}

/**
 * Kiểm tra file có tồn tại không
 * 
 * @param filePath - Đường dẫn tương đối từ UPLOAD_ROOT
 * @returns true nếu file tồn tại
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.join(UPLOAD_ROOT, filePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lấy absolute path của file (dùng internal)
 * 
 * @param filePath - Đường dẫn tương đối từ UPLOAD_ROOT
 * @returns Absolute path
 */
export function getAbsolutePath(filePath: string): string {
  return path.join(UPLOAD_ROOT, filePath);
}

/**
 * Tạo ReadStream để stream file (dùng cho API routes)
 * 
 * @param filePath - Đường dẫn tương đối từ UPLOAD_ROOT
 * @returns ReadStream
 */
export function createFileStream(filePath: string) {
  const absolutePath = getAbsolutePath(filePath);
  return createReadStream(absolutePath);
}

/**
 * Lấy thông tin file (size, mtime)
 * 
 * @param filePath - Đường dẫn tương đối từ UPLOAD_ROOT
 * @returns File stats
 */
export async function getFileStats(filePath: string) {
  const absolutePath = getAbsolutePath(filePath);
  return await fs.stat(absolutePath);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Di chuyển file từ temp sang thư mục đích
 * Hữu ích cho workflow upload 2 bước: temp → permanent
 */
export async function moveFile(
  sourcePath: string,
  targetCategory: keyof typeof CATEGORY_PATHS
): Promise<string> {
  const sourceAbsolute = path.join(UPLOAD_ROOT, sourcePath);
  const fileName = path.basename(sourcePath);
  
  const targetPath = CATEGORY_PATHS[targetCategory];
  const targetDir = path.join(UPLOAD_ROOT, targetPath);
  await ensureDir(targetDir);
  
  const targetFilePath = path.join(targetPath, fileName);
  const targetAbsolute = path.join(UPLOAD_ROOT, targetFilePath);
  
  await fs.rename(sourceAbsolute, targetAbsolute);
  
  return targetFilePath;
}

/**
 * Xóa tất cả file trong thư mục temp (cleanup)
 */
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
  const tempDir = path.join(UPLOAD_ROOT, 'temp');
  const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
  
  try {
    const files = await fs.readdir(tempDir);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < cutoffTime) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
    return 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const LocalStorage = {
  saveFile,
  getFileUrl,
  deleteFile,
  fileExists,
  getAbsolutePath,
  createFileStream,
  getFileStats,
  moveFile,
  cleanupTempFiles,
  validateFile,
};

export default LocalStorage;
