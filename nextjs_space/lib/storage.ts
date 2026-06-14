

import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { saveFile as saveLocalFile, getFileUrl as getLocalFileUrl, deleteFile as deleteLocalFile } from './local-storage'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export interface StorageResult {
  storage: 'local'
  key: string
  url?: string
}

/**
 * @deprecated Use saveFile from './local-storage' instead
 * This is a legacy wrapper for backward compatibility
 */
export async function saveFile(
  buffer: Buffer, 
  originalName: string, 
  contentType?: string
): Promise<StorageResult> {
  console.warn('[DEPRECATED] lib/storage.ts saveFile is deprecated. Use lib/local-storage.ts instead')
  
  // Fallback: Lưu file local
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  
  const ext = path.extname(originalName) || ''
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  const safeName = `${timestamp}-${uuid}${ext}`
  const fullPath = path.join(UPLOAD_DIR, safeName)
  
  await fs.writeFile(fullPath, buffer)
  
  return { 
    storage: 'local', 
    key: `local/${safeName}`,
    url: `/api/files/download?key=${encodeURIComponent(`local/${safeName}`)}`
  }
}

/**
 * @deprecated Use getFileUrl from './local-storage' instead
 * Lấy URL để download file
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  console.warn('[DEPRECATED] lib/storage.ts getFileUrl is deprecated. Use lib/local-storage.ts instead')
  
  if (key.startsWith('local/')) {
    // Local file
    return `/api/files/download?key=${encodeURIComponent(key)}`
  }
  
  // For other paths, use local storage
  return getLocalFileUrl(key, true)
}

/**
 * @deprecated Use deleteFile from './local-storage' instead
 * Xóa file
 */
export async function removeFile(key: string): Promise<void> {
  console.warn('[DEPRECATED] lib/storage.ts removeFile is deprecated. Use lib/local-storage.ts instead')
  
  if (key.startsWith('local/')) {
    // Local file
    const fileName = key.replace('local/', '')
    const fullPath = path.join(UPLOAD_DIR, fileName)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      console.error('Failed to delete local file:', error)
    }
  } else {
    // Use local storage delete
    try {
      await deleteLocalFile(key)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

/**
 * Đọc file local
 */
export async function readLocalFile(key: string): Promise<Buffer> {
  if (!key.startsWith('local/')) {
    throw new Error('Not a local file')
  }
  
  const fileName = key.replace('local/', '')
  const fullPath = path.join(UPLOAD_DIR, fileName)
  
  return await fs.readFile(fullPath)
}

/**
 * Tính SHA-256 checksum
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
