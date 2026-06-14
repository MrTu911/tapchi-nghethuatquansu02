import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint cho real-time notifications.
 * Phù hợp với môi trường intranet quân sự — không cần WebSocket.
 *
 * Client connect và giữ kết nối mở, server push event khi có thông báo mới.
 * Mỗi 25s gửi comment "heartbeat" để giữ kết nối không bị proxy timeout.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.uid

  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Gửi event khởi đầu để client biết kết nối thành công
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"userId":"${userId}"}\n\n`)
      )

      // Gửi unread count ngay khi connect
      try {
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        })
        controller.enqueue(
          encoder.encode(`event: unread-count\ndata: ${JSON.stringify({ count: unreadCount })}\n\n`)
        )
      } catch {
        // Không làm gián đoạn kết nối nếu DB lỗi nhất thời
      }

      let lastCheckedAt = new Date()

      // Poll DB mỗi 15 giây để phát hiện thông báo mới
      const pollInterval = setInterval(async () => {
        if (isClosed) {
          clearInterval(pollInterval)
          return
        }

        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
          })

          if (newNotifications.length > 0) {
            lastCheckedAt = newNotifications[newNotifications.length - 1].createdAt

            const unreadCount = await prisma.notification.count({
              where: { userId, isRead: false },
            })

            // Gửi từng thông báo mới
            for (const notification of newNotifications) {
              controller.enqueue(
                encoder.encode(
                  `event: notification\ndata: ${JSON.stringify(notification)}\n\n`
                )
              )
            }

            // Cập nhật unread count
            controller.enqueue(
              encoder.encode(
                `event: unread-count\ndata: ${JSON.stringify({ count: unreadCount })}\n\n`
              )
            )
          }
        } catch {
          // Không throw lỗi ra stream, chỉ bỏ qua lần poll này
        }
      }, 15_000)

      // Heartbeat mỗi 25s để giữ kết nối qua proxy/load balancer
      const heartbeatInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeatInterval)
          return
        }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeatInterval)
        }
      }, 25_000)

      // Cleanup khi request bị đóng (user đóng tab, logout, v.v.)
      request.signal.addEventListener('abort', () => {
        isClosed = true
        clearInterval(pollInterval)
        clearInterval(heartbeatInterval)
        try {
          controller.close()
        } catch {
          // Stream có thể đã đóng
        }
      })
    },

    cancel() {
      isClosed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Tắt buffering trong nginx
    },
  })
}
