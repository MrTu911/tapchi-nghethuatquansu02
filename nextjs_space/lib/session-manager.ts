
/**
 * ✅ Phase 2: Session Manager
 * Quản lý user sessions với tracking và force logout
 */

import { prisma } from './prisma'
import { signToken, signRefreshToken } from './auth'

/** Số session đồng thời tối đa cho một user (môi trường quân sự: nên thấp) */
const MAX_CONCURRENT_SESSIONS = 3

export interface SessionInfo {
  id: string
  userId: string
  ipAddress: string | null
  userAgent: string | null
  lastActive: Date
  createdAt: Date
  expiresAt: Date
}

/**
 * Tạo session mới
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    throw new Error('User not found')
  }
  
  // Create tokens
  const accessToken = signToken({
    uid: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName
  })
  
  const refreshToken = signRefreshToken({
    uid: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName
  })
  
  // ── Concurrent session guard ─────────────────────────────────────────────
  const activeSessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gte: new Date() }
    },
    orderBy: { lastActive: 'asc' } // oldest first để xóa
  })

  // Phát hiện đăng nhập từ IP lạ — ghi SecurityAlert
  if (activeSessions.length > 0 && ipAddress) {
    const knownIPs = new Set(activeSessions.map(s => s.ipAddress).filter(Boolean))
    if (!knownIPs.has(ipAddress)) {
      // IP mới — tạo cảnh báo để admin biết
      await prisma.securityAlert.create({
        data: {
          userId,
          type: 'UNUSUAL_ACTIVITY',
          severity: 'MEDIUM',
          description: `Đăng nhập từ IP mới: ${ipAddress}. IP đã biết: ${[...knownIPs].join(', ')}`,
          ipAddress,
          userAgent: userAgent || null,
          status: 'PENDING'
        }
      }).catch(() => {
        // Không làm login fail nếu không ghi được alert
      })
    }
  }

  // Xóa session cũ nhất nếu vượt quá giới hạn concurrent
  if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const sessionsToDelete = activeSessions.slice(0, activeSessions.length - MAX_CONCURRENT_SESSIONS + 1)
    await prisma.userSession.deleteMany({
      where: { id: { in: sessionsToDelete.map(s => s.id) } }
    })
  }

  // Save session to database
  const session = await prisma.userSession.create({
    data: {
      userId,
      token: accessToken,
      refreshToken,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  return {
    accessToken,
    refreshToken,
    sessionId: session.id
  }
}

/**
 * Vô hiệu hóa toàn bộ sessions khi đổi mật khẩu
 * Gọi từ password-reset route sau khi đổi password thành công
 */
export async function invalidateAllSessionsOnPasswordChange(
  userId: string,
  keepSessionId?: string
): Promise<number> {
  const where = keepSessionId
    ? { userId, NOT: { id: keepSessionId } }
    : { userId }

  const result = await prisma.userSession.deleteMany({ where })
  return result.count
}

/**
 * Get all active sessions for user
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gte: new Date() }
    },
    orderBy: { lastActive: 'desc' }
  })
  
  return sessions.map(s => ({
    id: s.id,
    userId: s.userId,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    lastActive: s.lastActive,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt
  }))
}

/**
 * Update session last active time
 */
export async function updateSessionActivity(sessionId: string) {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastActive: new Date() }
  })
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string) {
  await prisma.userSession.delete({
    where: { id: sessionId }
  })
}

/**
 * Delete all sessions for user (force logout all devices)
 */
export async function deleteAllUserSessions(userId: string) {
  await prisma.userSession.deleteMany({
    where: { userId }
  })
}

/**
 * Cleanup expired sessions (should run periodically)
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.userSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  })
  
  return result.count
}

/**
 * Get session by token
 */
export async function getSessionByToken(token: string) {
  return await prisma.userSession.findUnique({
    where: { token }
  })
}

/**
 * Get all active sessions (admin view)
 * Uses a single query with include to avoid N+1.
 */
export async function getAllActiveSessions() {
  return prisma.userSession.findMany({
    where: {
      expiresAt: { gte: new Date() }
    },
    orderBy: { lastActive: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  })
}
