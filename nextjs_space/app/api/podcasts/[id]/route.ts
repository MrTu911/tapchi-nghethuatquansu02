import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile, getFileUrl, deleteFile, validateFile } from '@/lib/local-storage'

const ALLOWED_ADMIN_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']
const DELETE_ROLES = ['SYSADMIN', 'EIC']

const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
const AUDIO_MAX_SIZE = 200 * 1024 * 1024
const IMAGE_MAX_SIZE = 10 * 1024 * 1024

/**
 * GET /api/podcasts/[id]
 * Get podcast detail; increments play counter for active published episodes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const podcast = await prisma.podcast.findUnique({
      where: { id: params.id },
    })

    if (!podcast) {
      return errorResponse('Podcast không tồn tại', 404)
    }

    const now = new Date()
    const isPublished = podcast.isActive && podcast.publishedAt !== null && podcast.publishedAt <= now

    // Podcast chưa publish/đã tắt chỉ dành cho người có quyền quản trị xem trước.
    // Với khách công khai phải trả 404 để tránh rò bản nháp.
    if (!isPublished) {
      const session = await getServerSession()
      if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
        return errorResponse('Podcast không tồn tại', 404)
      }
      // Không tăng lượt nghe khi quản trị xem trước bản chưa publish.
      return successResponse({ podcast })
    }

    await prisma.podcast.update({
      where: { id: params.id },
      data: { plays: { increment: 1 } },
    })

    return successResponse({ podcast })
  } catch (error) {
    console.error('Error fetching podcast:', error)
    return errorResponse('Không thể tải podcast', 500)
  }
}

/**
 * PUT /api/podcasts/[id]
 * Update podcast metadata and optionally replace audio/cover files
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const existing = await prisma.podcast.findUnique({ where: { id: params.id } })
    if (!existing) {
      return errorResponse('Podcast không tồn tại', 404)
    }

    const formData = await request.formData()
    const audioFile = formData.get('audioFile') as File | null
    const coverImageFile = formData.get('coverImageFile') as File | null

    const updateData: Record<string, unknown> = {}

    const title = (formData.get('title') as string | null)?.trim()
    if (title) updateData.title = title
    const titleEn = formData.get('titleEn') as string | null
    if (titleEn !== null) updateData.titleEn = titleEn || null
    const description = formData.get('description') as string | null
    if (description !== null) updateData.description = description || null
    const descriptionEn = formData.get('descriptionEn') as string | null
    if (descriptionEn !== null) updateData.descriptionEn = descriptionEn || null
    const host = formData.get('host') as string | null
    if (host !== null) updateData.host = host || null
    const episodeNumberRaw = formData.get('episodeNumber') as string | null
    if (episodeNumberRaw !== null) updateData.episodeNumber = episodeNumberRaw ? parseInt(episodeNumberRaw) : null
    const seasonNumberRaw = formData.get('seasonNumber') as string | null
    if (seasonNumberRaw !== null) updateData.seasonNumber = seasonNumberRaw ? parseInt(seasonNumberRaw) : null
    const transcript = formData.get('transcript') as string | null
    if (transcript !== null) updateData.transcript = transcript || null
    const category = formData.get('category') as string | null
    if (category !== null) updateData.category = category || null
    const tagsRaw = formData.get('tags') as string | null
    if (tagsRaw !== null) updateData.tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const isFeaturedRaw = formData.get('isFeatured') as string | null
    if (isFeaturedRaw !== null) updateData.isFeatured = isFeaturedRaw === 'true'
    const isActiveRaw = formData.get('isActive') as string | null
    if (isActiveRaw !== null) updateData.isActive = isActiveRaw !== 'false'
    const displayOrderRaw = formData.get('displayOrder') as string | null
    if (displayOrderRaw !== null) updateData.displayOrder = parseInt(displayOrderRaw)
    const publishedAtRaw = formData.get('publishedAt') as string | null
    if (publishedAtRaw !== null) updateData.publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null
    const durationRaw = formData.get('duration') as string | null
    if (durationRaw !== null) {
      const parsedDuration = durationRaw ? parseInt(durationRaw) : NaN
      updateData.duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : null
    }

    // Replace audio file if provided
    if (audioFile && audioFile.size > 0) {
      if (!AUDIO_MIME_TYPES.includes(audioFile.type)) {
        return errorResponse('Định dạng âm thanh không hỗ trợ', 400)
      }
      if (audioFile.size > AUDIO_MAX_SIZE) {
        return errorResponse('File âm thanh quá lớn. Giới hạn 200MB', 400)
      }
      if (existing.audioPath) {
        await deleteFile(existing.audioPath)
      }
      const audioResult = await saveFile(audioFile, 'podcast-audio', true)
      updateData.audioPath = audioResult.filePath
      updateData.audioUrl = getFileUrl(audioResult.filePath, true)
      updateData.fileSize = audioResult.fileSize
      updateData.mimeType = audioResult.mimeType
    }

    // Replace cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
      const imageValidation = validateFile(coverImageFile.type, coverImageFile.size)
      if (!imageValidation.isValid) {
        return errorResponse(`Ảnh bìa không hợp lệ: ${imageValidation.error}`, 400)
      }
      if (imageValidation.fileType !== 'image') {
        return errorResponse('Ảnh bìa phải là file ảnh', 400)
      }
      if (coverImageFile.size > IMAGE_MAX_SIZE) {
        return errorResponse('Ảnh bìa quá lớn. Giới hạn 10MB', 400)
      }
      if (existing.coverImagePath) {
        await deleteFile(existing.coverImagePath)
      }
      const coverResult = await saveFile(coverImageFile, 'podcast-cover', true)
      updateData.coverImagePath = coverResult.filePath
      updateData.coverImageUrl = getFileUrl(coverResult.filePath, true)
    }

    const podcast = await prisma.podcast.update({
      where: { id: params.id },
      data: updateData,
    })

    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_UPDATED,
      object: 'Podcast',
      objectId: podcast.id,
      before: { title: existing.title },
      after: { title: podcast.title },
    })

    return successResponse({ podcast })
  } catch (error) {
    console.error('Error updating podcast:', error)
    return errorResponse('Cập nhật podcast thất bại', 500)
  }
}

/**
 * DELETE /api/podcasts/[id]
 * Delete podcast and remove audio/cover files from disk
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !DELETE_ROLES.includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const podcast = await prisma.podcast.findUnique({ where: { id: params.id } })
    if (!podcast) {
      return errorResponse('Podcast không tồn tại', 404)
    }

    if (podcast.audioPath) {
      await deleteFile(podcast.audioPath)
    }
    if (podcast.coverImagePath) {
      await deleteFile(podcast.coverImagePath)
    }

    await prisma.podcast.delete({ where: { id: params.id } })

    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_DELETED,
      object: 'Podcast',
      objectId: params.id,
      before: { title: podcast.title },
    })

    return successResponse({ message: 'Đã xóa podcast thành công' })
  } catch (error) {
    console.error('Error deleting podcast:', error)
    return errorResponse('Xóa podcast thất bại', 500)
  }
}
