/**
 * API: User Search
 * Tìm kiếm người dùng để bắt đầu cuộc trò chuyện
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllowedRoles } from '@/lib/chat-guard';
import { Prisma, Role } from '@prisma/client';

/**
 * GET /api/users/search?q=query
 * Tìm kiếm người dùng theo tên hoặc email
 * Chỉ trả về những người dùng mà người hiện tại có thể chat
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || !session?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const roleFilter = searchParams.get('role') as Role | null;

    // Lấy danh sách vai trò mà người dùng hiện tại có thể chat
    const allowedRoles = getAllowedRoles(session.role as Role);

    const effectiveRoles =
      roleFilter && allowedRoles.includes(roleFilter)
        ? [roleFilter]
        : allowedRoles;

    const textFilter: Prisma.UserWhereInput =
      query.trim().length >= 2
        ? {
            OR: [
              { fullName: { contains: query.trim(), mode: 'insensitive' } },
              { email: { contains: query.trim(), mode: 'insensitive' } },
              { org: { contains: query.trim(), mode: 'insensitive' } },
            ],
          }
        : {};

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: effectiveRoles },
        NOT: { id: session.uid },
        ...textFilter,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true,
      },
      take: 30,
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
