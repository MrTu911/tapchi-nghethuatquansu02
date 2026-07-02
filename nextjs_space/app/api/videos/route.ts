import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile, getFileUrl } from '@/lib/local-storage'

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
    const keyword = searchParams.get('keyword')?.trim()
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true'
    if (videoType) where.videoType = videoType
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { titleEn: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ]
    }

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
 * Tạo video mới từ file upload nội bộ (LAN). Chỉ hỗ trợ multipart/form-data.
 * File lớn nên đi qua luồng chunked/resumable /api/videos/upload.
 * Hệ thống chạy air-gap LAN nên KHÔNG hỗ trợ nhúng YouTube/Vimeo.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const contentType = request.headers.get('content-type') || ''

    // Chỉ chấp nhận upload file (multipart/form-data) — không nhúng YouTube/Vimeo
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

      // Validate file type (video files). Dung lượng do lib/local-storage kiểm soát
      // (MAX_VIDEO_UPLOAD_MB; mặc định không giới hạn). Đường này dành cho file vừa;
      // file rất lớn nên dùng luồng chunked /api/videos/upload.
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/x-matroska']
      if (!validTypes.includes(file.type)) {
        return errorResponse('Định dạng không hợp lệ. Chấp nhận: MP4, WebM, OGG, MOV, AVI, MKV', 400)
      }

      // Lưu file vào filesystem nội bộ (public) và lấy URL công khai để phát trực tiếp
      let publicUrl: string;
      try {
        const result = await saveFile(file, 'video', true);
        publicUrl = getFileUrl(result.filePath, true); // -> /uploads/videos/uploads/<file>
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
          videoUrl: publicUrl,
          cloudStoragePath: publicUrl,
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

    return errorResponse('Chỉ hỗ trợ tải lên file video (multipart/form-data)', 400)
  } catch (error) {
    console.error('Error creating video:', error)
    return errorResponse('Failed to create video', 500)
  }
}
