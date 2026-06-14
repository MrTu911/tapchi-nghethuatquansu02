import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * GET /api/images/s3?key=...
 * Redirect to S3 signed URL for image display
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }
  
  try {
    // Get signed URL from S3
    const signedUrl = await getFileUrl(key, true);
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error getting S3 URL:', error);
    return NextResponse.json({ error: 'Failed to get image URL' }, { status: 500 });
  }
}
