import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const userRole = session.role;
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(userRole);

    if (!isEditor) {
      return errorResponse('Forbidden', 403);
    }

    const deadline = await prisma.deadline.findUnique({
      where: { id: params.id },
      include: {
        submission: { select: { id: true, code: true, title: true } }
      }
    });

    if (!deadline) {
      return errorResponse('Deadline không tồn tại', 404);
    }

    if (deadline.completedAt) {
      return errorResponse('Deadline đã được hoàn thành trước đó', 409);
    }

    const isManaging = ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(userRole);

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true }
    });

    if (!user) {
      return errorResponse('User không tồn tại', 404);
    }

    // Non-managing editors can only complete deadlines assigned to them
    if (!isManaging && deadline.assignedTo && deadline.assignedTo !== user.id) {
      return errorResponse('Forbidden: chỉ người được giao mới có thể hoàn thành deadline này', 403);
    }

    const updated = await prisma.deadline.update({
      where: { id: params.id },
      data: { completedAt: new Date() }
    });

    await logAudit({
      actorId: user.id,
      action: 'DEADLINE_COMPLETED',
      object: `Deadline:${params.id}`,
      after: {
        deadlineType: deadline.type,
        submissionId: deadline.submissionId,
        submissionCode: deadline.submission.code,
        completedAt: updated.completedAt,
      },
    });

    return successResponse({ id: updated.id, completedAt: updated.completedAt });
  } catch (error) {
    console.error('Complete deadline error:', error);
    return errorResponse('Lỗi hệ thống', 500);
  }
}
