/**
 * Legacy Local File Server
 *
 * Serve files được lưu bởi lib/storage.ts (deprecated) tại <cwd>/uploads/.
 * Yêu cầu authentication — không public-accessible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const LEGACY_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Infer MIME type from extension when DB record is missing
function inferContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const types: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing file name' }, { status: 400 });
    }

    // Sanitize: prevent path traversal
    const sanitizedName = path.basename(name);
    if (sanitizedName !== name) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const absolutePath = path.join(LEGACY_UPLOAD_DIR, sanitizedName);

    // Check permission: user must own or be admin, or be an assigned reviewer
    const fileRecord = await prisma.uploadedFile.findFirst({
      where: { cloudStoragePath: `local/${sanitizedName}` },
      include: {
        submission: {
          select: { createdBy: true, reviews: { select: { reviewerId: true } } },
        },
      },
    });

    if (fileRecord) {
      const isOwner = fileRecord.uploadedBy === session.uid;
      const isSubmissionAuthor = fileRecord.submission?.createdBy === session.uid;
      const isAdmin = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'].includes(session.role);
      const isReviewer = fileRecord.submission?.reviews?.some(r => r.reviewerId === session.uid) || false;

      if (!isOwner && !isSubmissionAuthor && !isAdmin && !isReviewer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // File not in DB: only admins can access
      const isAdmin = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'].includes(session.role);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Read file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const contentType = fileRecord?.mimeType || inferContentType(sanitizedName);
    const originalName = fileRecord?.originalName || sanitizedName;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        // inline for PDF/images, attachment for Word
        'Content-Disposition': contentType.includes('pdf') || contentType.startsWith('image/')
          ? `inline; filename="${originalName}"`
          : `attachment; filename="${originalName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[serve-legacy] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
