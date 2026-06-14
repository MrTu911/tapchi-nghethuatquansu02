
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { clearPermissionsCache } from '@/lib/rbac-dynamic'

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

    const result = await prisma.rolePermission.updateMany({
      where: { role: role as Role, isGranted: true },
      data: { isGranted: false },
    })

    clearPermissionsCache()

    return NextResponse.json({
      success: true,
      message: `Đã thu hồi ${result.count} quyền của vai trò ${role}`,
      revoked: result.count,
    })
  } catch (error: any) {
    console.error('Error revoking all permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi thu hồi quyền' },
      { status: 500 }
    )
  }
}
