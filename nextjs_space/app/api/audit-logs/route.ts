import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { convertBigInts } from '@/lib/utils';

const ALLOWED_ROLES: Role[] = [Role.SYSADMIN, Role.EIC, Role.MANAGING_EDITOR]

/**
 * GET /api/audit-logs
 * Fetch audit logs with filtering and pagination
 * Accessible by SYSADMIN, EIC, MANAGING_EDITOR
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.role as Role)) {
      return NextResponse.json(
        { error: 'Forbidden: Bạn không có quyền xem audit logs' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Filters
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const object = searchParams.get('object');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    // Build where clause
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
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { object: { contains: search, mode: 'insensitive' } },
        { objectId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Fetch logs, total count, and distinct actions in parallel
    const [logs, total, distinctActions] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
    ]);
    
    const convertedData = convertBigInts({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(Number(total) / limit),
      },
    });

    return NextResponse.json({
      success: true,
      data: convertedData.logs,
      pagination: convertedData.pagination,
      filters: {
        actions: distinctActions.map((r: { action: string }) => r.action),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
