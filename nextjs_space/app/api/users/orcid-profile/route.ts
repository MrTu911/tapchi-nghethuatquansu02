export const dynamic = 'force-dynamic'

/**
 * GET  /api/users/orcid-profile  — trả về ORCID profile của user đang đăng nhập
 * DELETE /api/users/orcid-profile — ngắt kết nối ORCID (xóa record)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const profile = await prisma.oRCIDProfile.findUnique({
      where: { userId: session.uid },
      select: {
        orcidId: true,
        fullName: true,
        biography: true,
        affiliations: true,
        works: true,
        lastSyncAt: true,
        createdAt: true,
        // accessToken / refreshToken never sent to client
      },
    })

    return NextResponse.json({
      success: true,
      data: profile ?? null,
    })
  } catch (error) {
    logger.error({
      message: 'GET /api/users/orcid-profile error:',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const existing = await prisma.oRCIDProfile.findUnique({
      where: { userId: session.uid },
      select: { id: true, orcidId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Chưa kết nối ORCID' },
        { status: 404 }
      )
    }

    await prisma.oRCIDProfile.delete({ where: { userId: session.uid } })

    await logAudit({
      actorId: session.uid,
      action: 'ORCID_DISCONNECTED',
      object: `ORCIDProfile:${existing.id}`,
      before: { orcidId: existing.orcidId },
    })

    logger.info({
      context: 'ORCID_DISCONNECT',
      userId: session.uid,
      orcidId: existing.orcidId,
    })

    return NextResponse.json({ success: true, message: 'Đã ngắt kết nối ORCID' })
  } catch (error) {
    logger.error({
      message: 'DELETE /api/users/orcid-profile error:',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
