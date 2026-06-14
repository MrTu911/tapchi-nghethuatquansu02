
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { getRolePermissions } from '@/lib/rbac-dynamic'
import { Role } from '@prisma/client'

/**
 * GET /api/permissions/me
 * Returns the list of granted permission codes for the currently logged-in user.
 * Used by the sidebar to dynamically show/hide menu items.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const permissions = await getRolePermissions(session.role as Role)

    return NextResponse.json({
      success: true,
      role: session.role,
      permissions,
    })
  } catch (error) {
    console.error('Error fetching current user permissions:', error)
    return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy quyền' }, { status: 500 })
  }
}
