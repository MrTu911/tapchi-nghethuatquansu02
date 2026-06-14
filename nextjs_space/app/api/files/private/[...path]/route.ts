/**
 * Private File Server — Local Filesystem
 *
 * Serve private files (manuscripts, review files) từ local filesystem.
 * Yêu cầu authentication và kiểm tra quyền truy cập.
 * Thay thế phiên bản cũ đã dùng S3 signed URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAbsolutePath } from '@/lib/local-storage';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

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
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reconstruct relative file path
    const relativePath = pathSegments.join('/');

    // Sanitize: reject path traversal attempts
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Look up file record in DB for permission check
    const fileRecord = await prisma.uploadedFile.findFirst({
      where: {
        OR: [
          { cloudStoragePath: relativePath },
          { cloudStoragePath: { endsWith: relativePath } },
        ],
      },
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

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Permission check
    const isOwner = fileRecord.uploadedBy === session.uid;
    const isSubmissionAuthor = fileRecord.submission?.createdBy === session.uid;
    const isAdmin = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role);
    const isReviewer = fileRecord.submission?.reviews?.some(r => r.reviewerId === session.uid) || false;

    if (!isOwner && !isSubmissionAuthor && !isAdmin && !isReviewer) {
      await logAudit({
        actorId: session.uid,
        action: 'ACCESS_DENIED',
        object: `UploadedFile:${fileRecord.id}`,
        before: { filePath: relativePath, attemptedBy: session.uid },
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Resolve absolute path using local-storage helper
    const absolutePath = getAbsolutePath(fileRecord.cloudStoragePath);

    // Read file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch {
      logger.error(`[private-files] File not found on disk: ${absolutePath}`);
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const contentType = fileRecord.mimeType || inferContentType(fileRecord.originalName);
    const originalName = fileRecord.originalName;

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: 'FILE_ACCESS',
      object: `UploadedFile:${fileRecord.id}`,
      after: {
        fileId: fileRecord.id,
        fileName: originalName,
        accessType: isReviewer ? 'reviewer' : (isAdmin ? 'admin' : 'author'),
      },
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        'Content-Disposition': contentType.includes('pdf') || contentType.startsWith('image/')
          ? `inline; filename="${originalName}"`
          : `attachment; filename="${originalName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    logger.error(`[private-files] Error serving file: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
