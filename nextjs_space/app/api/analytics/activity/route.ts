/**
 * Internal Analytics API - Activity Tracking
 * 
 * Provides activity analytics from audit logs for intranet environments.
 * No external dependencies - all data from internal database.
 * 
 * @route GET /api/analytics/activity
 * @query days - Number of days to analyze (default: 30, max: 365)
 * @returns Activity statistics, top users, daily trends
 */

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return errorResponse('Unauthorized', 401)
  }

  // Only admins, EIC, and managing editors can view analytics
  const authorizedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']
  if (!authorizedRoles.includes(session.role)) {
    return errorResponse('Forbidden: Insufficient permissions', 403)
  }

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get('days')
  const days = Math.min(Math.max(parseInt(daysParam || '30'), 1), 365)

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 1. Activity breakdown by action type
    const activityByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 20 // Top 20 actions
    })

    // 2. Activity breakdown by entity type
    const activityByEntity = await prisma.auditLog.groupBy({
      by: ['object'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: {
        _count: { id: 'desc' }
      }
    })

    // 3. Top 10 most active users
    const topUsers = await prisma.auditLog.groupBy({
      by: ['actorId'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        actorId: { not: null }
      },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 10
    })

    // Fetch user details for top users
    const userIds = topUsers.map(u => u.actorId).filter(Boolean) as string[]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true
      }
    })

    // Merge user data with activity counts
    const topUsersWithDetails = topUsers.map(tu => {
      const user = users.find(u => u.id === tu.actorId)
      return {
        userId: tu.actorId,
        activityCount: tu._count.id,
        user: user ? {
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          organization: user.org
        } : null
      }
    })

    // 4. Daily activity trend (last N days)
    const dailyActivity = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::int as count
      FROM "AuditLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `

    // Convert BigInt to Number for JSON serialization
    const dailyActivitySerialized = dailyActivity.map(row => ({
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      count: Number(row.count)
    }))

    // 5. Activity by hour of day (24-hour distribution)
    const hourlyActivity = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT 
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::int as count
      FROM "AuditLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `

    const hourlyActivitySerialized = hourlyActivity.map(row => ({
      hour: row.hour,
      count: Number(row.count)
    }))

    // 6. Overall statistics
    const totalActivities = await prisma.auditLog.count({
      where: { createdAt: { gte: startDate } }
    })

    const uniqueUsers = await prisma.auditLog.findMany({
      where: { 
        createdAt: { gte: startDate },
        actorId: { not: null }
      },
      select: { actorId: true },
      distinct: ['actorId']
    })

    // 7. Most accessed content (entities with most views)
    const topViewedContent = await prisma.auditLog.groupBy({
      by: ['object', 'objectId'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        action: { contains: 'VIEW' },
        objectId: { not: null }
      },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 10
    })

    return successResponse({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        totalActivities,
        uniqueUsers: uniqueUsers.length,
        avgActivitiesPerUser: uniqueUsers.length > 0 
          ? Math.round(totalActivities / uniqueUsers.length) 
          : 0
      },
      activityByAction: activityByAction.map(a => ({
        action: a.action,
        count: a._count.id
      })),
      activityByEntity: activityByEntity.map(a => ({
        entityType: a.object,
        count: a._count.id
      })),
      topUsers: topUsersWithDetails,
      dailyActivity: dailyActivitySerialized,
      hourlyActivity: hourlyActivitySerialized,
      topViewedContent: topViewedContent.map(c => ({
        entityType: c.object,
        entityId: c.objectId,
        viewCount: c._count.id
      }))
    })
  } catch (error) {
    console.error('[Analytics Activity] Error:', error)
    return errorResponse(
      'Failed to fetch activity analytics: ' + 
      (error instanceof Error ? error.message : 'Unknown error'),
      500
    )
  }
}
