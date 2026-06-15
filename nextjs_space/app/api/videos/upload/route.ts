import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import {
  initUpload,
  appendChunk,
  finalizeUpload,
  getUploadStatus,
  abortUpload,
  VideoUploadError,
} from '@/lib/services/video-upload-service'

/**
 * /api/videos/upload — Upload video theo từng phần (chunked/resumable).
 *
 * POST ?action=init     body JSON   { fileName, mimeType, totalSize }            -> { uploadId, chunkSize }
 * POST ?action=chunk    query uploadId, offset; body = binary chunk             -> { received, totalSize }
 * POST ?action=complete body JSON   { uploadId, title, ...metadata }            -> { video }
 * POST ?action=abort    query uploadId                                          -> { aborted: true }
 * GET  ?uploadId=...                                                            -> { received, totalSize }
 */

const ALLOWED_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

function toErrorResponse(error: unknown) {
  if (error instanceof VideoUploadError) {
    return errorResponse(error.message, error.statusCode)
  }
  console.error('Video chunked upload error:', error)
  return errorResponse('Lỗi xử lý upload video', 500)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }
    const uploadId = new URL(request.url).searchParams.get('uploadId') || ''
    const status = await getUploadStatus({ uploadId, userId: session.uid })
    return successResponse(status)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'init') {
      const body = await request.json()
      const result = await initUpload({
        fileName: body.fileName,
        mimeType: body.mimeType,
        totalSize: Number(body.totalSize),
        userId: session.uid,
      })
      return successResponse(result)
    }

    if (action === 'chunk') {
      const uploadId = searchParams.get('uploadId') || ''
      const offset = Number(searchParams.get('offset') || '0')
      const arrayBuffer = await request.arrayBuffer()
      const data = Buffer.from(arrayBuffer)
      const result = await appendChunk({ uploadId, offset, data, userId: session.uid })
      return successResponse(result)
    }

    if (action === 'complete') {
      const body = await request.json()
      const { uploadId, title } = body
      if (!title) {
        return errorResponse('Thiếu tiêu đề video', 400)
      }

      const finalized = await finalizeUpload({ uploadId, userId: session.uid })

      const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true
      const tags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string' && body.tags
          ? JSON.parse(body.tags)
          : []

      const video = await prisma.video.create({
        data: {
          title,
          titleEn: body.titleEn || null,
          description: body.description || null,
          descriptionEn: body.descriptionEn || null,
          videoType: 'upload',
          videoUrl: finalized.publicUrl,
          cloudStoragePath: finalized.publicUrl,
          duration: body.duration ? Math.round(Number(body.duration)) : null,
          category: body.category || null,
          tags,
          isFeatured: Boolean(body.isFeatured),
          isActive,
          displayOrder: Number(body.displayOrder) || 0,
          publishedAt: isActive ? new Date() : null,
          createdBy: session.uid,
        },
      })

      await logAudit({
        actorId: session.uid,
        action: AuditEventType.SETTINGS_CHANGED,
        object: 'Video',
        before: null,
        after: { id: video.id, title: video.title, fileSize: finalized.fileSize },
      })

      return successResponse({ video })
    }

    if (action === 'abort') {
      const uploadId = searchParams.get('uploadId') || ''
      await abortUpload({ uploadId, userId: session.uid })
      return successResponse({ aborted: true })
    }

    return errorResponse('action không hợp lệ (init | chunk | complete | abort)', 400)
  } catch (error) {
    return toErrorResponse(error)
  }
}
