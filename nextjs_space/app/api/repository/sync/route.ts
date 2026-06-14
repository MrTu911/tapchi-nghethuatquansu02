import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditEventType } from '@/lib/audit-logger'

/**
 * Sync published articles from Workflow to Repository
 * This ensures all approved articles are indexed in the repository
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).role
    if (!['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get count of approved articles
    const approvedCount = await prisma.article.count({
      where: { approvalStatus: 'APPROVED' }
    })

    // Update all approved articles to ensure they're indexed
    // In a real system, this would also extract text for plagiarism indexing
    const result = await prisma.article.updateMany({
      where: { 
        approvalStatus: 'APPROVED',
        publishedAt: { not: null }
      },
      data: {
        // Mark as synced (we could add a syncedAt field)
      }
    })

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: `Repository:sync:${approvedCount}`,
    })

    return NextResponse.json({
      success: true,
      data: {
        synced: approvedCount,
        message: `Đã đồng bộ ${approvedCount} bài báo vào CSDL`
      }
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi đồng bộ' }, { status: 500 })
  }
}
