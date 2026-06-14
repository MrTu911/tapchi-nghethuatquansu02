/**
 * Public File Server - S3 Version
 * 
 * Redirect to S3 signed URL for public files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    
    // Get signed URL from S3 (public = long expiry)
    const signedUrl = await getFileUrl(filePath, true);
    
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error serving public file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
