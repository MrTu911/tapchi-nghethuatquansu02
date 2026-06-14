
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { clearPermissionsCache } from '@/lib/rbac-dynamic'

/**
 * POST /api/permissions/role/grant-all
 * Grant all active permissions to a role.
 * Only SYSADMIN is allowed to call this.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Chỉ SYSADMIN mới có quyền thực hiện thao tác này' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json({ error: 'Thiếu thông tin role' }, { status: 400 })
    }

    const allPermissions = await prisma.permission.findMany({
      where: { isActive: true },
    })

    if (allPermissions.length === 0) {
      return NextResponse.json(
        { error: 'Chưa có permissions nào trong hệ thống. Hãy chạy Seed trước.' },
        { status: 400 }
      )
    }

    let granted = 0
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: role as Role,
            permissionId: permission.id,
          },
        },
        update: { isGranted: true },
        create: {
          role: role as Role,
          permissionId: permission.id,
          isGranted: true,
        },
      })
      granted++
    }

    // Invalidate cache so changes are reflected immediately
    clearPermissionsCache()

    return NextResponse.json({
      success: true,
      message: `Đã cấp ${granted} quyền cho vai trò ${role}`,
      granted,
    })
  } catch (error: any) {
    console.error('Error granting all permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi cấp quyền' },
      { status: 500 }
    )
  }
}
