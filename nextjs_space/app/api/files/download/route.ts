/**
 * GET /api/files/download?path=... or ?key=...
 * Download file — hỗ trợ cả legacy local files và new local-storage files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { errorResponse } from '@/lib/responses';
import { getFileUrl as getLocalFileUrl } from '@/lib/local-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.uid) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path') || searchParams.get('key');

    if (!filePath) {
      return errorResponse('Missing file path', 400);
    }

    if (filePath.startsWith('local/')) {
      // Legacy file: redirect to the authenticated serve-legacy endpoint
      const name = filePath.replace('local/', '');
      return NextResponse.redirect(
        new URL(`/api/files/serve-legacy?name=${encodeURIComponent(name)}`, request.url)
      );
    }

    // New local-storage file: check if it's public or private
    // Private files need auth route; public files served from /uploads/
    // We default to private (requires auth) for safety
    const resolvedUrl = getLocalFileUrl(filePath, false); // false = private
    return NextResponse.redirect(new URL(resolvedUrl, request.url));
  } catch (error: any) {
    console.error('File download error:', error);
    return errorResponse(error.message || 'Lỗi khi tải file');
  }
}
