import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile, getFileUrl, validateFile } from '@/lib/local-storage'

const ALLOWED_ADMIN_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
const AUDIO_MAX_SIZE = 200 * 1024 * 1024  // 200MB
const IMAGE_MAX_SIZE = 10 * 1024 * 1024   // 10MB

/**
 * GET /api/podcasts
 * List podcasts with optional filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const isFeatured = searchParams.get('isFeatured')
    const category = searchParams.get('category')
    const keyword = searchParams.get('keyword')
    const adminView = searchParams.get('adminView') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true'
    if (category) where.category = category
    // Public requests chỉ thấy podcast đã published
    if (!adminView) {
      where.publishedAt = { lte: new Date() }
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { titleEn: { contains: keyword, mode: 'insensitive' } },
        { host: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    const [podcasts, total] = await Promise.all([
      prisma.podcast.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip,
      }),
      prisma.podcast.count({ where }),
    ])

    return successResponse({
      podcasts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching podcasts:', error)
    return errorResponse('Failed to fetch podcasts', 500)
  }
}

/**
 * POST /api/podcasts
 * Create a new podcast episode with audio file and cover image upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const formData = await request.formData()

    const audioFile = formData.get('audioFile') as File | null
    const coverImageFile = formData.get('coverImageFile') as File | null
    const title = (formData.get('title') as string | null)?.trim()
    const titleEn = formData.get('titleEn') as string | null
    const description = formData.get('description') as string | null
    const descriptionEn = formData.get('descriptionEn') as string | null
    const host = formData.get('host') as string | null
    const episodeNumberRaw = formData.get('episodeNumber') as string | null
    const seasonNumberRaw = formData.get('seasonNumber') as string | null
    const transcript = formData.get('transcript') as string | null
    const category = formData.get('category') as string | null
    const tagsRaw = formData.get('tags') as string | null
    const isFeatured = formData.get('isFeatured') === 'true'
    const isActive = formData.get('isActive') !== 'false'
    const displayOrderRaw = formData.get('displayOrder') as string | null
    const publishedAtRaw = formData.get('publishedAt') as string | null

    if (!title) {
      return errorResponse('Tiêu đề là bắt buộc', 400)
    }

    // Validate audio file
    if (!audioFile || audioFile.size === 0) {
      return errorResponse('File âm thanh là bắt buộc', 400)
    }
    if (!AUDIO_MIME_TYPES.includes(audioFile.type)) {
      return errorResponse('Định dạng âm thanh không hỗ trợ. Vui lòng dùng MP3, M4A, WAV, OGG, AAC', 400)
    }
    if (audioFile.size > AUDIO_MAX_SIZE) {
      return errorResponse('File âm thanh quá lớn. Giới hạn 200MB', 400)
    }

    // Validate cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
      const imageValidation = validateFile(coverImageFile.type, coverImageFile.size)
      if (!imageValidation.isValid) {
        return errorResponse(`Ảnh bìa không hợp lệ: ${imageValidation.error}`, 400)
      }
      if (imageValidation.fileType !== 'image') {
        return errorResponse('Ảnh bìa phải là file ảnh (JPG, PNG, WebP)', 400)
      }
      if (coverImageFile.size > IMAGE_MAX_SIZE) {
        return errorResponse('Ảnh bìa quá lớn. Giới hạn 10MB', 400)
      }
    }

    // Save audio file (private — served via signed URL)
    const audioResult = await saveFile(audioFile, 'podcast-audio', true)

    // Save cover image (public)
    let coverImagePath: string | null = null
    let coverImageUrl: string | null = null
    if (coverImageFile && coverImageFile.size > 0) {
      const coverResult = await saveFile(coverImageFile, 'podcast-cover', true)
      coverImagePath = coverResult.filePath
      coverImageUrl = getFileUrl(coverResult.filePath, true)
    }

    const episodeNumber = episodeNumberRaw ? parseInt(episodeNumberRaw) : null
    const seasonNumber = seasonNumberRaw ? parseInt(seasonNumberRaw) : null
    const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw) : 0
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null

    const podcast = await prisma.podcast.create({
      data: {
        title,
        titleEn: titleEn || null,
        description: description || null,
        descriptionEn: descriptionEn || null,
        audioPath: audioResult.filePath,
        audioUrl: getFileUrl(audioResult.filePath, true),
        duration: null,
        fileSize: audioResult.fileSize,
        mimeType: audioResult.mimeType,
        coverImagePath,
        coverImageUrl,
        host: host || null,
        episodeNumber,
        seasonNumber,
        transcript: transcript || null,
        category: category || null,
        tags,
        isFeatured,
        isActive,
        displayOrder,
        publishedAt,
        createdBy: session.uid,
      },
    })

    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_UPLOADED,
      object: 'Podcast',
      objectId: podcast.id,
      after: { title: podcast.title, audioPath: podcast.audioPath },
    })

    return successResponse({ podcast }, 'Tạo podcast thành công', 201)
  } catch (error) {
    console.error('Error creating podcast:', error)
    return errorResponse('Tạo podcast thất bại', 500)
  }
}
