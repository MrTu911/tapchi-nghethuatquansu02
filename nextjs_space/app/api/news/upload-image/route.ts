
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/responses';
import { saveFile } from '@/lib/s3';

/**
 * POST /api/news/upload-image - Upload ảnh cho rich text editor lên S3
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    const allowedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'AUTHOR', 'REVIEWER'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền upload ảnh', 403);
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return errorResponse('Không tìm thấy file ảnh', 400);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)', 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return errorResponse('Kích thước ảnh không được vượt quá 10MB', 400);
    }

    const result = await saveFile(file, 'news', true);

    return successResponse({
      url: result.url,
      key: result.cloudStoragePath
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return errorResponse('Lỗi khi upload ảnh', 500, error.message);
  }
}
