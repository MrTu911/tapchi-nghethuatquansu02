import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { format } from 'date-fns';

const ALLOWED_ROLES: Role[] = [Role.SYSADMIN, Role.EIC, Role.MANAGING_EDITOR]

/**
 * GET /api/audit-logs/export
 * Export audit logs as CSV. Only accessible by SYSADMIN.
 * Accepts same filter params as GET /api/audit-logs.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.role as Role)) {
      return NextResponse.json(
        { error: 'Forbidden: Bạn không có quyền xuất audit logs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const object = searchParams.get('object');
    const dateFrom = searchParams.get('fromDate');
    const dateTo = searchParams.get('toDate');
    const search = searchParams.get('search');

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (object) {
      where.object = { contains: object, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { object: { contains: search, mode: 'insensitive' } },
        { objectId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Cap at 10,000 rows to prevent memory issues
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const csvHeader = 'ID,Thời gian,Hành động,Đối tượng,Object ID,IP,Người thực hiện,Email,Vai trò\n';
    const csvRows = logs.map((log) => {
      const fields = [
        String(log.id),
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'),
        log.action,
        log.object,
        log.objectId ?? '',
        log.ipAddress ?? '',
        log.actor?.fullName ?? '',
        log.actor?.email ?? '',
        log.actor?.role ?? '',
      ];
      // Escape fields containing commas or quotes
      return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(',');
    });

    const csv = csvHeader + csvRows.join('\n');
    const filename = `security-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('GET /api/audit-logs/export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
