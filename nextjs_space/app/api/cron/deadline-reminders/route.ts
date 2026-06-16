/**
 * API Cron Job - Gửi email nhắc hạn phản biện
 * Được gọi từ Scheduled Task hoặc cron job bên ngoài
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit-logger'

// Cho phép cả GET và POST để dễ test và gọi từ scheduled task
export const dynamic = 'force-dynamic'

interface ReminderResult {
  type: 'review' | 'revision' | 'sla'
  email: string
  submissionCode: string
  daysLeft: number
  sent: boolean
}

export async function GET(req: NextRequest) {
  return handleReminders()
}

export async function POST(req: NextRequest) {
  // Verify API key for security (optional)
  const authHeader = req.headers.get('authorization')
  const apiKey = process.env.CRON_API_KEY
  
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return handleReminders()
}

async function handleReminders() {
  const results: ReminderResult[] = []
  const now = new Date()
  
  try {
    // 1. Nhắc Reviewer sắp hết hạn phản biện (còn 3 ngày hoặc 1 ngày)
    const pendingReviews = await prisma.review.findMany({
      where: {
        submittedAt: null,
        declinedAt: null,
        deadline: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 ngày tới
        }
      },
      include: {
        reviewer: { select: { email: true, fullName: true } },
        submission: { select: { code: true, title: true } }
      }
    })
    
    for (const review of pendingReviews) {
      const daysLeft = Math.ceil(
        (review.deadline!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      
      // Chỉ gửi nhắc khi còn đúng 3 ngày hoặc 1 ngày
      if (daysLeft === 3 || daysLeft === 1) {
        const sent = await sendEmail({
          to: review.reviewer.email,
          subject: `[NTQS] Nhắc nhở: Phản biện bài ${review.submission.code} - Còn ${daysLeft} ngày`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Tạp chí Nghệ thuật Quân sự Việt Nam</h2>
              <p>Kính gửi <strong>${review.reviewer.fullName}</strong>,</p>
              <p>Bạn còn <strong style="color: ${daysLeft === 1 ? '#dc2626' : '#f59e0b'};">${daysLeft} ngày</strong> để hoàn thành phản biện cho bài viết:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Mã bài:</strong> ${review.submission.code}</p>
                <p style="margin: 5px 0 0;"><strong>Tiêu đề:</strong> ${review.submission.title}</p>
                <p style="margin: 5px 0 0;"><strong>Hạn chót:</strong> ${review.deadline?.toLocaleDateString('vi-VN')}</p>
              </div>
              <p>Vui lòng đăng nhập hệ thống để hoàn tất phản biện.</p>
              <p>Trân trọng,<br/>Ban biên tập</p>
            </div>
          `
        })
        
        results.push({
          type: 'review',
          email: review.reviewer.email,
          submissionCode: review.submission.code,
          daysLeft,
          sent
        })
      }
    }
    
    // 2. Nhắc Author chỉnh sửa bài (status = REVISION)
    const revisionSubmissions = await prisma.submission.findMany({
      where: {
        status: 'REVISION',
        slaDeadline: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        author: { select: { email: true, fullName: true } }
      }
    })
    
    for (const sub of revisionSubmissions) {
      if (!sub.slaDeadline) continue
      
      const daysLeft = Math.ceil(
        (sub.slaDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      
      if (daysLeft === 3 || daysLeft === 1) {
        const sent = await sendEmail({
          to: sub.author.email,
          subject: `[NTQS] Nhắc nhở: Chỉnh sửa bài ${sub.code} - Còn ${daysLeft} ngày`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Tạp chí Nghệ thuật Quân sự Việt Nam</h2>
              <p>Kính gửi <strong>${sub.author.fullName}</strong>,</p>
              <p>Bạn còn <strong style="color: ${daysLeft === 1 ? '#dc2626' : '#f59e0b'};">${daysLeft} ngày</strong> để nộp bản chỉnh sửa cho bài viết:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Mã bài:</strong> ${sub.code}</p>
                <p style="margin: 5px 0 0;"><strong>Tiêu đề:</strong> ${sub.title}</p>
                <p style="margin: 5px 0 0;"><strong>Hạn chót:</strong> ${sub.slaDeadline.toLocaleDateString('vi-VN')}</p>
              </div>
              <p>Vui lòng đăng nhập hệ thống để nộp bản chỉnh sửa.</p>
              <p>Trân trọng,<br/>Ban biên tập</p>
            </div>
          `
        })
        
        results.push({
          type: 'revision',
          email: sub.author.email,
          submissionCode: sub.code,
          daysLeft,
          sent
        })
      }
    }
    
    // 3. Cập nhật cờ isOverdue cho các submission quá hạn
    const overdueCount = await prisma.submission.updateMany({
      where: {
        slaDeadline: { lt: now },
        isOverdue: false,
        status: { notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT'] }
      },
      data: { isOverdue: true }
    })
    
    // Ghi audit log
    await logAudit({
      actorId: 'system',
      action: 'DEADLINE_REMINDER_CRON',
      object: 'cron:deadline-reminders',
      after: {
        remindersSent: results.filter(r => r.sent).length,
        totalChecked: results.length,
        overdueUpdated: overdueCount.count
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        remindersSent: results.filter(r => r.sent).length,
        reminders: results,
        overdueUpdated: overdueCount.count
      }
    })
    
  } catch (error: any) {
    console.error('Deadline reminder error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
