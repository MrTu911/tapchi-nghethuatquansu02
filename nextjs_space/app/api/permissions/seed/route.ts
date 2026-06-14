
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clearPermissionsCache } from '@/lib/rbac-dynamic'
import { seedPermissions } from '@/lib/rbac-seed'

// ─── POST /api/permissions/seed ─────────────────────────────────────────────
// Danh sách quyền và ma trận phân quyền là nguồn sự thật chung tại lib/rbac-seed.ts
// (được dùng lại bởi script CLI scripts/seed-permissions.ts).

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Chỉ SYSADMIN mới có quyền seed permissions' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const resetGrants = body?.resetGrants === true

    const { added, total, grants } = await seedPermissions(prisma, { resetGrants })

    clearPermissionsCache()

    return NextResponse.json({
      success: true,
      message: added > 0
        ? `Đã thêm ${added} permission mới, tổng ${total} quyền`
        : `Tất cả ${total} permissions đã tồn tại — đã cập nhật phân quyền`,
      added,
      total,
      resetGrants,
      grants,
    })
  } catch (error: any) {
    console.error('Error seeding permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi seed permissions' },
      { status: 500 }
    )
  }
}
