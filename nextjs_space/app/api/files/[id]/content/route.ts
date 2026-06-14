/**
 * GET /api/files/[id]/content
 *
 * Stream file content trực tiếp (cho download hoặc inline view).
 * Hỗ trợ cả legacy local files (local/) và new local-storage files.
 * Yêu cầu authentication và kiểm tra quyền truy cập.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAbsolutePath } from '@/lib/local-storage';
import { logAudit } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

const LEGACY_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            id: true,
            code: true,
            createdBy: true,
            reviews: { select: { reviewerId: true } },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Permission check
    const isOwner = file.uploadedBy === session.uid;
    const isSubmissionAuthor = file.submission?.createdBy === session.uid;
    const isAdmin = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'].includes(session.role);
    const isReviewer = file.submission?.reviews?.some(r => r.reviewerId === session.uid) || false;

    if (!isOwner && !isSubmissionAuthor && !isAdmin && !isReviewer) {
      await logAudit({
        actorId: session.uid,
        action: 'FILE_ACCESS_DENIED',
        object: `UploadedFile:${id}`,
        after: { reason: 'Unauthorized content access', submissionCode: file.submission?.code },
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve absolute path
    let absolutePath: string;
    if (file.cloudStoragePath.startsWith('local/')) {
      // Legacy: stored in <cwd>/uploads/
      const name = file.cloudStoragePath.replace('local/', '');
      absolutePath = path.join(LEGACY_UPLOAD_DIR, path.basename(name));
    } else {
      // New: stored by local-storage.ts in public/uploads/
      absolutePath = getAbsolutePath(file.cloudStoragePath);
    }

    // Read file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const contentType = file.mimeType || inferContentType(file.originalName);
    const isPdf = contentType.includes('pdf');
    const isImage = contentType.startsWith('image/');

    // Audit log (non-blocking)
    logAudit({
      actorId: session.uid,
      action: 'FILE_ACCESSED',
      object: `UploadedFile:${id}`,
      after: {
        fileName: file.originalName,
        submissionCode: file.submission?.code,
        accessType: isReviewer ? 'reviewer' : isAdmin ? 'admin' : 'author',
      },
    }).catch(() => {});

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        // PDF và ảnh: inline (xem trực tiếp trong trình duyệt)
        // Word và các file khác: attachment (tải xuống)
        'Content-Disposition': isPdf || isImage
          ? `inline; filename="${file.originalName}"`
          : `attachment; filename="${file.originalName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[files/content] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
