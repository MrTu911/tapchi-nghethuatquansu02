import { NextRequest, NextResponse } from 'next/server'
import { NotificationType } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/responses'
import { createBulkNotifications } from '@/lib/notification-manager'

const ADMIN_ROLES = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR']

/**
 * GET /api/notifications
 * Params: limit, page, pageSize, unreadOnly, type, keyword
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20')))
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') || null
    const keyword = searchParams.get('keyword') || null

    const where: Record<string, unknown> = { userId: session.uid }

    if (unreadOnly) where.isRead = false
    if (type) where.type = type
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { message: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: session.uid, isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Notification fetch error:', error)
    return errorResponse('Server error', 500)
  }
}

/**
 * POST /api/notifications
 * Admin gửi thông báo thủ công (SYSADMIN, MANAGING_EDITOR, EIC, SECTION_EDITOR)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ADMIN_ROLES.includes(session.role)) return errorResponse('Forbidden', 403)

    const body = await request.json()
    const { userIds, type, title, message, link, sendEmail } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse('Thiếu danh sách người nhận', 400)
    }
    if (!type || !title || !message) {
      return errorResponse('Thiếu thông tin bắt buộc: type, title, message', 400)
    }
    const validTypes = Object.values(NotificationType)
    if (!validTypes.includes(type as NotificationType)) {
      return errorResponse('Loại thông báo không hợp lệ', 400)
    }

    await createBulkNotifications(userIds, {
      type: type as NotificationType,
      title,
      message,
      link: link || undefined,
      sendEmail: sendEmail === true,
    })

    return NextResponse.json({ success: true, message: `Đã gửi thông báo tới ${userIds.length} người dùng` })
  } catch (error) {
    console.error('Notification send error:', error)
    return errorResponse('Server error', 500)
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.uid, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: session.uid },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notifications marked as read' })
    }

    return errorResponse('Invalid request', 400)
  } catch (error) {
    console.error('Notification update error:', error)
    return errorResponse('Server error', 500)
  }
}

/**
 * DELETE /api/notifications
 * Body: { notificationId } hoặc { deleteAllRead: true }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const body = await request.json()
    const { notificationId, deleteAllRead } = body

    if (deleteAllRead) {
      await prisma.notification.deleteMany({
        where: { userId: session.uid, isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Đã xóa tất cả thông báo đã đọc' })
    }

    if (notificationId) {
      await prisma.notification.deleteMany({
        where: { id: notificationId, userId: session.uid },
      })
      return NextResponse.json({ success: true, message: 'Đã xóa thông báo' })
    }

    return errorResponse('Invalid request', 400)
  } catch (error) {
    console.error('Notification delete error:', error)
    return errorResponse('Server error', 500)
  }
}
