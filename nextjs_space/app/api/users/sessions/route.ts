
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { getAllActiveSessions, deleteAllUserSessions, deleteSession } from '@/lib/session-manager'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECURITY_AUDITOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền xem phiên đăng nhập' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    let rawSessions
    if (userId) {
      rawSessions = await prisma.userSession.findMany({
        where: { userId, expiresAt: { gte: new Date() } },
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } }
        },
        orderBy: { lastActive: 'desc' }
      })
    } else {
      rawSessions = await getAllActiveSessions()
    }

    const activeSessions = rawSessions.map(s => ({
      id: s.id,
      userId: s.userId,
      user: s.user,
      loginTime: s.createdAt,
      lastActive: s.lastActive,
      ip: s.ipAddress,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt,
      duration: Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 1000 / 60)
    }))

    return NextResponse.json({
      sessions: activeSessions,
      total: activeSessions.length
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách phiên đăng nhập' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền kết thúc phiên đăng nhập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, sessionId } = body

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Thiếu userId hoặc sessionId' }, { status: 400 })
    }

    if (userId && userId === session.uid) {
      return NextResponse.json(
        { error: 'Không thể kết thúc phiên đăng nhập của chính bạn' },
        { status: 400 }
      )
    }

    if (sessionId) {
      await deleteSession(sessionId)
    } else {
      await deleteAllUserSessions(userId)
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'LOGOUT',
        object: 'session',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        after: {
          terminatedBy: session.email,
          targetUserId: userId || null,
          targetSessionId: sessionId || null,
          reason: 'Admin forced logout'
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Đã kết thúc phiên đăng nhập' })
  } catch (error) {
    console.error('Error terminating session:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi kết thúc phiên đăng nhập' },
      { status: 500 }
    )
  }
}
