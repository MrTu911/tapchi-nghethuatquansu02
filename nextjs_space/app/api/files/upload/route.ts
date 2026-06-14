
import { NextRequest, NextResponse } from 'next/server';
import { saveFile, validateFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB global cap

/**
 * API Upload file to S3 Cloud Storage
 * POST /api/files/upload
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'general';
    const isPublicParam = formData.get('isPublic') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size before upload
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ success: false, error: 'File quá lớn. Kích thước tối đa là 50MB.' }, { status: 400 });
    }

    const validation = validateFile(file.type, file.size, category as any)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const isPublic = isPublicParam === 'true' || file.type.startsWith('image/');

    const result = await saveFile(file, category, isPublic);

    return NextResponse.json({
      success: true,
      url: result.url,
      cloud_storage_path: result.cloudStoragePath,
      fileName: result.fileName,
      fileSize: result.fileSize,
      fileType: result.mimeType,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}

