
import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * Image proxy route to serve S3 images
 * GET /api/images/proxy?key=<file-path>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('key');

    if (!fileKey) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // Get signed S3 URL
    const fileUrl = await getFileUrl(decodeURIComponent(fileKey), true);

    // Redirect to S3 signed URL
    return NextResponse.redirect(fileUrl);
  } catch (error: any) {
    console.error('Image proxy error:', error);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/images/placeholder.png`);
  }
}
