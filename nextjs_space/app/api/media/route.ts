import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFileToS3 } from '@/lib/s3';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import { validateMediaFile } from '@/lib/file-security';
import sharp from 'sharp';

/**
 * GET /api/media
 * List all media files with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const fileType = searchParams.get('fileType') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (fileType) {
      where.fileType = { startsWith: fileType }; // e.g., 'image/', 'video/'
    }

    // Fetch media with pagination + library-wide aggregate stats
    const [media, totalCount, imageCount, videoCount, sizeAggregate] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          cloudStoragePath: true,
          altText: true,
          title: true,
          description: true,
          category: true,
          width: true,
          height: true,
          isPublic: true,
          uploadedBy: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
        },
      }),
      prisma.media.count({ where }),
      prisma.media.count({ where: { fileType: { startsWith: 'image/' } } }),
      prisma.media.count({ where: { fileType: { startsWith: 'video/' } } }),
      prisma.media.aggregate({ _sum: { fileSize: true } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: media,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      stats: {
        imageCount,
        videoCount,
        totalSize: sizeAggregate._sum.fileSize ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return errorResponse(error.message || 'Failed to fetch media', 500);
  }
}

/**
 * POST /api/media
 * Upload a new media file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Check authorization - Editors, admins, and authors can upload
    const allowedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'AUTHOR', 'REVIEWER'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (parseError: any) {
      console.error('FormData parse error:', parseError);
      return errorResponse('Invalid form data: ' + parseError.message, 400);
    }

    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'general';
    const altText = (formData.get('altText') as string) || '';
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file || !(file instanceof File) || file.size === 0) {
      console.error('File validation failed:', { file: !!file, isFile: file instanceof File, size: file?.size });
      return errorResponse('No valid file provided. Please select a file to upload.', 400);
    }
    
    console.log('Upload request:', { fileName: file.name, fileType: file.type, fileSize: file.size, category });

    // ✅ Bảo mật upload: validator chính tắc (lib/file-security.ts) — kiểm size,
    // whitelist MIME, file thực thi, double-extension, và XÁC THỰC MAGIC BYTES
    // (không tin file.type từ client). Chỉ đọc 16 byte đầu để kiểm chữ ký, tránh
    // nuốt file lớn vào RAM trước khi xác thực.
    const headerBytes = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const validation = validateMediaFile(file.name, file.size, file.type, headerBytes);
    if (!validation.valid) {
      return errorResponse(validation.error || 'File không hợp lệ', 400);
    }
    const isVideo = validation.kind === 'video';

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get image dimensions using sharp (only for images)
    let width: number | null = null;
    let height: number | null = null;
    if (!isVideo) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (err) {
        console.warn('Could not extract image metadata:', err);
      }
    }

    // Determine proper category for S3 storage
    const storageCategory = isVideo ? 'video' : category || 'media';
    
    // Upload to S3 (public by default for media)
    let cloudStoragePath: string;
    try {
      const result = await uploadFileToS3(buffer, file.name, file.type, storageCategory, true);
      cloudStoragePath = result.cloudStoragePath;
    } catch (error: any) {
      console.error('Media upload S3 error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Lỗi khi tải lên media' },
        { status: 400 }
      );
    }

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        cloudStoragePath,
        altText: altText || file.name,
        title,
        description,
        category,
        width,
        height,
        isPublic,
        uploadedBy: session.uid,
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_UPLOADED,
      object: 'media',
      after: {
        id: media.id,
        fileName: file.name,
        fileSize: file.size,
        category,
      },
    });

    return NextResponse.json({ data: media, message: 'Media uploaded successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return errorResponse(error.message || 'Failed to upload media', 500);
  }
}
