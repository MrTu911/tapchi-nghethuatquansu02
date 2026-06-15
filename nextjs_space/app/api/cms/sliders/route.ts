/**
 * API Quản lý Slider - Sử dụng bảng Banner với targetRole = 'HOME_SLIDER'
 * GET /api/cms/sliders - Lấy danh sách slider
 * POST /api/cms/sliders - Tạo slider mới
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { can } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'

const SLIDER_TARGET = 'HOME_SLIDER'

export async function GET(req: NextRequest) {
  try {
    const sliders = await prisma.banner.findMany({
      where: {
        targetRole: SLIDER_TARGET
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        creator: {
          select: { fullName: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: sliders.map(s => ({
        ...s,
        displayOrder: s.position // Map position to displayOrder for UI
      }))
    })
  } catch (error: any) {
    console.error('Get sliders error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!can.admin(session.role as any)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { imageUrl, linkUrl, altText, displayOrder, isActive } = body

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Ảnh slider là bắt buộc' },
        { status: 400 }
      )
    }

    // Get max position
    const maxOrder = await prisma.banner.aggregate({
      where: { targetRole: SLIDER_TARGET },
      _max: { position: true }
    })

    const slider = await prisma.banner.create({
      data: {
        title: `Slider ${Date.now()}`,
        imageUrl,
        linkUrl: linkUrl || '#',
        altText: altText || 'Homepage slider image',
        targetRole: SLIDER_TARGET,
        position: displayOrder ?? ((maxOrder._max?.position || 0) + 1),
        isActive: isActive ?? true,
        createdBy: session.uid
      }
    })

    await logAudit({
      actorId: session.uid,
      action: 'CREATE_SLIDER',
      object: `slider:${slider.id}`,
      after: { imageUrl, linkUrl }
    })

    return NextResponse.json({
      success: true,
      data: { ...slider, displayOrder: slider.position }
    })
  } catch (error: any) {
    console.error('Create slider error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
