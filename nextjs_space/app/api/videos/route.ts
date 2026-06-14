import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile, getFileUrl } from '@/lib/s3'

/**
 * GET /api/videos
 * Retrieve list of videos with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const isFeatured = searchParams.get('isFeatured')
    const videoType = searchParams.get('videoType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true'
    if (videoType) where.videoType = videoType

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
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
      prisma.video.count({ where }),
    ])

    return successResponse({
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return errorResponse('Failed to fetch videos', 500)
  }
}

/**
 * POST /api/videos
 * Create a new video - Supports both YouTube URLs and direct file uploads
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const contentType = request.headers.get('content-type') || ''
    
    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string
      const titleEn = formData.get('titleEn') as string | null
      const description = formData.get('description') as string | null
      const descriptionEn = formData.get('descriptionEn') as string | null
      const category = formData.get('category') as string | null
      const tags = formData.get('tags') as string | null
      const isFeatured = formData.get('isFeatured') === 'true'
      const isActive = formData.get('isActive') === 'true'
      const displayOrder = parseInt(formData.get('displayOrder') as string || '0')

      if (!file || !title) {
        return errorResponse('Missing required fields: file and title', 400)
      }

      // Validate file type (video files)
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
      if (!validTypes.includes(file.type)) {
        return errorResponse('Invalid file type. Accepted: MP4, WebM, OGG, AVI, MOV', 400)
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        return errorResponse('File size exceeds 100MB limit', 400)
      }

      // Upload to local storage (public)
      let cloudPath: string;
      try {
        const result = await saveFile(file, 'video', true);
        cloudPath = result.filePath;
      } catch (error: any) {
        return errorResponse(error.message || 'Lỗi khi tải lên video', 400)
      }

      // Create video record
      const video = await prisma.video.create({
        data: {
          title,
          titleEn: titleEn || null,
          description,
          descriptionEn,
          videoType: 'upload',
          videoUrl: cloudPath,
          cloudStoragePath: cloudPath,
          category,
          tags: tags ? JSON.parse(tags) : [],
          isFeatured,
          isActive,
          displayOrder,
          publishedAt: isActive ? new Date() : null,
          createdBy: session.uid,
        },
      })

      await logAudit({
        actorId: session.uid,
        action: AuditEventType.SETTINGS_CHANGED,
        object: 'Video',
        before: null,
        after: { id: video.id, title: video.title }
      })

      return successResponse({ video })
    }

    // Handle JSON data (YouTube embed)
    const body = await request.json()
    const {
      title,
      titleEn,
      description,
      descriptionEn,
      videoType,
      videoUrl,
      videoId,
      thumbnailUrl,
      duration,
      category,
      tags,
      isFeatured,
      isActive,
      displayOrder,
      publishedAt,
    } = body

    // Validate required fields for YouTube
    if (!title || !videoUrl) {
      return errorResponse('Missing required fields: title and videoUrl', 400)
    }

    // Validate video type
    if (!['youtube', 'vimeo', 'upload', 'embed'].includes(videoType)) {
      return errorResponse('Invalid videoType. Must be: youtube, vimeo, upload, or embed', 400)
    }

    // Extract video ID from URL for YouTube
    let extractedVideoId = videoId
    if (videoType === 'youtube' && !extractedVideoId) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/
      const match = videoUrl.match(youtubeRegex)
      if (match && match[1]) {
        extractedVideoId = match[1]
      }
    }

    const video = await prisma.video.create({
      data: {
        title,
        titleEn,
        description,
        descriptionEn,
        videoType,
        videoUrl,
        videoId: extractedVideoId,
        thumbnailUrl,
        duration: duration ? parseInt(duration) : null,
        category,
        tags: tags || [],
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        createdBy: session.uid,
      },
    })

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'Video',
      before: null,
      after: { id: video.id, title: video.title }
    })

    return successResponse({ video })
  } catch (error) {
    console.error('Error creating video:', error)
    return errorResponse('Failed to create video', 500)
  }
}
