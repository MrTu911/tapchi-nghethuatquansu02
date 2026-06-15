import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { deleteFile } from '@/lib/local-storage'
import { resolveYouTubeId } from '@/lib/youtube'

/**
 * Chuyển URL công khai (/uploads/videos/uploads/x.mp4) về đường dẫn tương đối
 * mà lib/local-storage hiểu (videos/uploads/x.mp4). Trả null nếu không phải file nội bộ.
 */
function toStorageRelativePath(url: string | null): string | null {
  if (!url) return null
  const prefix = '/uploads/'
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

/**
 * GET /api/videos/[id]
 * Retrieve a specific video by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return errorResponse('Video not found', 404)
    }

    // Increment view count if video is active and published
    if (video.isActive && video.publishedAt) {
      await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } },
      })
      video.views += 1
    }

    return successResponse({ video })
  } catch (error) {
    console.error('Error fetching video:', error)
    return errorResponse('Failed to fetch video', 500)
  }
}

/**
 * PUT /api/videos/[id]
 * Update an existing video
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = params
    const body = await request.json()

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({ where: { id } })
    if (!existingVideo) {
      return errorResponse('Video not found', 404)
    }

    // Trích + làm sạch video ID cho YouTube (cắt bỏ ?si=... của link youtu.be)
    let extractedVideoId = body.videoId
    if (body.videoType === 'youtube' && body.videoUrl) {
      extractedVideoId = resolveYouTubeId(body.videoUrl, body.videoId)
    }

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn
    if (body.description !== undefined) updateData.description = body.description
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn
    if (body.videoType !== undefined) updateData.videoType = body.videoType
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl
    if (extractedVideoId !== undefined) updateData.videoId = extractedVideoId
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl
    if (body.duration !== undefined) updateData.duration = body.duration ? parseInt(body.duration) : null
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder
    if (body.publishedAt !== undefined) {
      updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
    }

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
    })

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'Video',
      before: { id: existingVideo.id, title: existingVideo.title },
      after: { id: video.id, title: video.title }
    })

    return successResponse({ video })
  } catch (error) {
    console.error('Error updating video:', error)
    return errorResponse('Failed to update video', 500)
  }
}

/**
 * DELETE /api/videos/[id]
 * Delete a video
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return errorResponse('Unauthorized - Only SYSADMIN and EIC can delete videos', 401)
    }

    const { id } = params

    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return errorResponse('Video not found', 404)
    }

    await prisma.video.delete({ where: { id } })

    // Dọn file vật lý nếu là video upload nội bộ (tránh orphan trên đĩa).
    // Không chặn response nếu xóa file lỗi — bản ghi DB đã xóa thành công.
    if (video.videoType === 'upload') {
      const relativePath = toStorageRelativePath(video.cloudStoragePath || video.videoUrl)
      if (relativePath) {
        try {
          await deleteFile(relativePath)
        } catch (fileError) {
          console.error('Video DB deleted but file cleanup failed:', relativePath, fileError)
        }
      }
    }

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'Video',
      before: { id: video.id, title: video.title },
      after: null
    })

    return successResponse({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting video:', error)
    return errorResponse('Failed to delete video', 500)
  }
}
