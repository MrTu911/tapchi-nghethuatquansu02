
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

/**
 * GET /api/permissions/counts
 * Trả về số quyền đã cấp và tổng số quyền cho tất cả roles.
 * Dùng để load sidebar counts một lần thay vì gọi từng role.
 */
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const totalActive = await prisma.permission.count({ where: { isActive: true } })

    const grantedByRole = await prisma.rolePermission.groupBy({
      by: ['role'],
      where: { isGranted: true },
      _count: { _all: true },
    })

    const counts: Record<string, { granted: number; total: number }> = {}
    for (const row of grantedByRole) {
      counts[row.role] = { granted: row._count._all, total: totalActive }
    }

    // Điền 0 cho roles chưa có grant nào
    const allRoles: Role[] = ['READER', 'AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'LAYOUT_EDITOR', 'MANAGING_EDITOR', 'SECURITY_AUDITOR', 'DEPUTY_EIC', 'EIC', 'COMMANDER', 'SYSADMIN']
    for (const role of allRoles) {
      if (!counts[role]) {
        counts[role] = { granted: 0, total: totalActive }
      }
    }

    return NextResponse.json({ success: true, total: totalActive, counts })
  } catch (error: any) {
    console.error('Error fetching permission counts:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
}
