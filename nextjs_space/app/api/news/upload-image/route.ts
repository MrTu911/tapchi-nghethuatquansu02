
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/responses';
import { saveFile } from '@/lib/s3';
import { validateMediaFile } from '@/lib/file-security';

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

    // ✅ Bảo mật upload (F2): validate ảnh bằng magic bytes (không tin file.type),
    // chặn executable/double-extension. Chỉ đọc 16 byte đầu để kiểm chữ ký.
    const headerBytes = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const validation = validateMediaFile(file.name, file.size, file.type, headerBytes, { allowVideo: false });
    if (!validation.valid) {
      return errorResponse(validation.error || 'Ảnh không hợp lệ', 400);
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
