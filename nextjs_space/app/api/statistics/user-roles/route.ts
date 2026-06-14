
/**
 * 📊 API: User Role Distribution
 * GET /api/statistics/user-roles
 * 
 * Phân loại người dùng theo vai trò
 * Dùng cho biểu đồ tròn
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface RoleDistribution {
  role: string;
  roleLabel: string;
  count: number;
  percentage: number;
}

const ROLE_LABELS: Record<string, string> = {
  'AUTHOR': 'Tác giả',
  'REVIEWER': 'Phản biện',
  'SECTION_EDITOR': 'Biên tập chuyên mục',
  'MANAGING_EDITOR': 'Thư ký tòa soạn',
  'DEPUTY_EIC': 'Phó Tổng biên tập',
  'LAYOUT_EDITOR': 'Biên tập bố cục',
  'EIC': 'Tổng biên tập',
  'SYSADMIN': 'Quản trị hệ thống',
  'SECURITY_AUDITOR': 'Kiểm toán bảo mật'
};

async function fetchUserRoleDistribution(): Promise<RoleDistribution[]> {
  // Group users by role
  const roleGroups = await prisma.user.groupBy({
    by: ['role'],
    _count: { _all: true }
  });

  const totalUsers = roleGroups.reduce((sum, group) => sum + group._count._all, 0);

  const distribution = roleGroups.map(group => ({
    role: group.role,
    roleLabel: ROLE_LABELS[group.role] || group.role,
    count: group._count._all,
    percentage: totalUsers > 0 
      ? Math.round((group._count._all / totalUsers) * 100 * 10) / 10 
      : 0
  }));

  // Sắp xếp theo số lượng giảm dần
  return distribution.sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ ADMIN, MANAGING_EDITOR, EIC mới xem được
    if (!['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Lấy từ cache hoặc tính toán (cache 1 giờ)
    const stats = await getCachedData(
      'stats:user-roles',
      fetchUserRoleDistribution,
      3600 // 1 giờ
    );

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching user role distribution:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

