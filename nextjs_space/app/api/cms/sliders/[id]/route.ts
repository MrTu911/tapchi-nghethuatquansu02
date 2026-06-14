/**
 * API Quản lý Slider theo ID
 * PUT /api/cms/sliders/[id] - Cập nhật slider
 * DELETE /api/cms/sliders/[id] - Xóa slider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'

const ALLOWED_ROLES = ['ADMIN', 'SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { imageUrl, linkUrl, altText, displayOrder, isActive } = body

    const slider = await prisma.banner.update({
      where: { id: params.id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(altText !== undefined && { altText }),
        ...(displayOrder !== undefined && { position: displayOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: session.uid
      }
    })

    await logAudit({
      actorId: session.uid,
      action: 'UPDATE_SLIDER',
      object: `slider:${params.id}`,
      after: body
    })

    return NextResponse.json({
      success: true,
      data: { ...slider, displayOrder: slider.position }
    })
  } catch (error: any) {
    console.error('Update slider error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.banner.delete({
      where: { id: params.id }
    })

    await logAudit({
      actorId: session.uid,
      action: 'DELETE_SLIDER',
      object: `slider:${params.id}`,
      after: {}
    })

    return NextResponse.json({
      success: true,
      message: 'Đã xóa slider'
    })
  } catch (error: any) {
    console.error('Delete slider error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
