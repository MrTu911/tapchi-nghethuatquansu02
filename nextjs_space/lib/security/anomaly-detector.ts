
/**
 * 🧠 SECURITY ANOMALY DETECTION SYSTEM
 * Phát hiện hành vi bất thường trong hệ thống
 */

import { PrismaClient } from '@prisma/client'
import { createAuditLog } from '../audit-logger'

const prisma = new PrismaClient()

export interface SecurityAlert {
  type: 'BRUTE_FORCE' | 'SUSPICIOUS_IP' | 'UNUSUAL_ACTIVITY' | 'ROLE_ESCALATION' | 'DATA_ACCESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  ipAddress?: string
  userAgent?: string
  description: string
  metadata?: Record<string, any>
}

export interface LoginAttempt {
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  timestamp: Date
}

// In-memory cache cho login attempts (trong production nên dùng Redis)
const loginAttemptsCache = new Map<string, LoginAttempt[]>()
const suspiciousIpsCache = new Set<string>()

/**
 * Ghi nhận login attempt
 */
export async function recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
  const key = `${attempt.email}:${attempt.ipAddress}`
  const attempts = loginAttemptsCache.get(key) || []
  
  attempts.push(attempt)
  
  // Giữ lại 20 attempts gần nhất
  if (attempts.length > 20) {
    attempts.shift()
  }
  
  loginAttemptsCache.set(key, attempts)
  
  // Kiểm tra brute force
  await detectBruteForce(attempt.email, attempt.ipAddress)
}

/**
 * Phát hiện brute force attack
 */
async function detectBruteForce(email: string, ipAddress: string): Promise<void> {
  const key = `${email}:${ipAddress}`
  const attempts = loginAttemptsCache.get(key) || []
  
  // Đếm số lần thất bại trong 15 phút gần nhất
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const recentFailures = attempts.filter(
    a => !a.success && a.timestamp > fifteenMinutesAgo
  )
  
  if (recentFailures.length >= 5) {
    suspiciousIpsCache.add(ipAddress)
    
    await createSecurityAlert({
      type: 'BRUTE_FORCE',
      severity: 'HIGH',
      ipAddress,
      description: `Phát hiện ${recentFailures.length} lần đăng nhập thất bại liên tiếp từ IP ${ipAddress} cho tài khoản ${email}`,
      metadata: {
        email,
        attemptCount: recentFailures.length,
        timeWindow: '15 minutes'
      }
    })
  }
}

/**
 * Kiểm tra IP có đáng ngờ không
 */
export function isSuspiciousIp(ipAddress: string): boolean {
  return suspiciousIpsCache.has(ipAddress)
}

/**
 * Phát hiện đăng nhập từ IP lạ
 */
export async function detectSuspiciousIpLogin(
  userId: string,
  newIpAddress: string
): Promise<void> {
  // Lấy 10 lần đăng nhập gần nhất của user
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      actorId: userId,
      action: 'LOGIN'
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  const knownIps = new Set(recentLogs.map(log => log.ipAddress).filter(Boolean))
  
  // Nếu IP mới và chưa từng thấy trong 10 lần gần nhất
  if (knownIps.size > 0 && !knownIps.has(newIpAddress)) {
    await createSecurityAlert({
      type: 'SUSPICIOUS_IP',
      severity: 'MEDIUM',
      userId,
      ipAddress: newIpAddress,
      description: `Đăng nhập từ IP địa chỉ mới: ${newIpAddress}`,
      metadata: {
        knownIps: Array.from(knownIps),
        newIp: newIpAddress
      }
    })
  }
}

/**
 * Phát hiện hoạt động bất thường
 */
export async function detectUnusualActivity(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Kiểm tra số lượng action trong 1 giờ
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const recentActions = await prisma.auditLog.count({
    where: {
      actorId: userId,
      action,
      createdAt: { gte: oneHourAgo }
    }
  })
  
  // Nếu quá 50 actions trong 1 giờ - có thể là bot
  if (recentActions > 50) {
    await createSecurityAlert({
      type: 'UNUSUAL_ACTIVITY',
      severity: 'MEDIUM',
      userId,
      description: `Phát hiện ${recentActions} lần thực hiện action "${action}" trong 1 giờ`,
      metadata: {
        action,
        count: recentActions,
        timeWindow: '1 hour',
        ...metadata
      }
    })
  }
}

/**
 * Phát hiện role escalation
 */
export async function detectRoleEscalation(
  userId: string,
  fromRole: string,
  toRole: string,
  performedBy: string
): Promise<void> {
  const roleHierarchy = {
    'AUTHOR': 1,
    'REVIEWER': 2,
    'SECTION_EDITOR': 3,
    'MANAGING_EDITOR': 4,
    'DEPUTY_EIC': 5,
    'EIC': 6,
    'LAYOUT_EDITOR': 3,
    'SECURITY_AUDITOR': 4,
    'SYSADMIN': 7
  }
  
  const fromLevel = roleHierarchy[fromRole as keyof typeof roleHierarchy] || 0
  const toLevel = roleHierarchy[toRole as keyof typeof roleHierarchy] || 0
  
  // Nếu tăng quyền 2 cấp trở lên
  if (toLevel - fromLevel >= 2) {
    await createSecurityAlert({
      type: 'ROLE_ESCALATION',
      severity: 'HIGH',
      userId,
      description: `Tăng quyền từ ${fromRole} lên ${toRole}`,
      metadata: {
        fromRole,
        toRole,
        performedBy,
        levelJump: toLevel - fromLevel
      }
    })
  }
}

/**
 * Tạo security alert
 */
async function createSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    // Tạo security alert record
    await prisma.securityAlert.create({
      data: {
        type: alert.type,
        severity: alert.severity,
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent,
        description: alert.description,
        metadata: alert.metadata || {},
        status: 'PENDING'
      }
    })
    
    // Ghi audit log
    await createAuditLog({
      userId: alert.userId || 'SYSTEM',
      action: 'SECURITY_ALERT',
      entity: 'SECURITY',
      entityId: alert.type,
      ipAddress: alert.ipAddress,
      userAgent: alert.userAgent,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        description: alert.description
      }
    })
    
    console.log(`🚨 Security Alert [${alert.severity}]: ${alert.description}`)
  } catch (error) {
    console.error('Error creating security alert:', error)
  }
}

/**
 * Lấy danh sách security alerts
 */
export async function getSecurityAlerts(
  filters?: {
    type?: SecurityAlert['type']
    severity?: SecurityAlert['severity']
    status?: 'PENDING' | 'REVIEWED' | 'RESOLVED'
    fromDate?: Date
    toDate?: Date
  },
  page = 1,
  limit = 20
) {
  const where: any = {}
  
  if (filters?.type) where.type = filters.type
  if (filters?.severity) where.severity = filters.severity
  if (filters?.status) where.status = filters.status
  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {}
    if (filters.fromDate) where.createdAt.gte = filters.fromDate
    if (filters.toDate) where.createdAt.lte = filters.toDate
  }
  
  const [alerts, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.securityAlert.count({ where })
  ])
  
  return {
    alerts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Cập nhật trạng thái alert
 */
export async function updateAlertStatus(
  alertId: string,
  status: 'REVIEWED' | 'RESOLVED',
  reviewedBy: string,
  notes?: string
): Promise<void> {
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status,
      reviewedBy,
      reviewedAt: new Date(),
      notes
    }
  })
  
  await createAuditLog({
    userId: reviewedBy,
    action: 'UPDATE_ALERT_STATUS',
    entity: 'SECURITY',
    entityId: alertId,
    metadata: { status, notes }
  })
}

/**
 * Lấy thống kê security
 */
export async function getSecurityStats(days = 7) {
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const [totalAlerts, criticalAlerts, pendingAlerts, alertsByType] = await Promise.all([
    prisma.securityAlert.count({
      where: { createdAt: { gte: fromDate } }
    }),
    prisma.securityAlert.count({
      where: {
        createdAt: { gte: fromDate },
        severity: 'CRITICAL'
      }
    }),
    prisma.securityAlert.count({
      where: {
        createdAt: { gte: fromDate },
        status: 'PENDING'
      }
    }),
    prisma.securityAlert.groupBy({
      by: ['type'],
      where: { createdAt: { gte: fromDate } },
      _count: { id: true }
    })
  ])
  
  return {
    totalAlerts,
    criticalAlerts,
    pendingAlerts,
    alertsByType: alertsByType.map(a => ({
      type: a.type,
      count: a._count.id
    }))
  }
}
