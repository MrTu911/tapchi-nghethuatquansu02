
/**
 * Deadline Manager
 * Quản lý deadline cho từng giai đoạn của submission
 */

import { PrismaClient, DeadlineType, SubmissionStatus } from '@prisma/client'
import { createNotification } from './notification-manager'
import { getStepConfig } from './services/workflow-config.service'

const prisma = new PrismaClient()

/**
 * Tạo deadline cho submission
 */
export async function createDeadline(
  submissionId: string,
  type: DeadlineType,
  dueDate: Date,
  assignedTo?: string,
  note?: string
): Promise<void> {
  await prisma.deadline.create({
    data: {
      submissionId,
      type,
      dueDate,
      assignedTo,
      note
    }
  })
  
  // Gửi thông báo cho người được giao
  if (assignedTo) {
    await createNotification({
      userId: assignedTo,
      type: 'DEADLINE_APPROACHING',
      title: 'Nhiệm vụ mới được giao',
      message: `Bạn có một deadline ${getDeadlineTypeName(type)} cần hoàn thành trước ${dueDate.toLocaleDateString('vi-VN')}`,
      link: `/dashboard/submissions/${submissionId}`,
      sendEmail: true
    })
  }
}

/**
 * Cập nhật deadline khi hoàn thành
 */
export async function completeDeadline(deadlineId: string): Promise<void> {
  await prisma.deadline.update({
    where: { id: deadlineId },
    data: {
      completedAt: new Date()
    }
  })
}

/**
 * Kiểm tra và đánh dấu deadlines quá hạn
 */
export async function checkOverdueDeadlines(): Promise<void> {
  const now = new Date()
  
  const overdueDeadlines = await prisma.deadline.findMany({
    where: {
      dueDate: {
        lt: now
      },
      completedAt: null,
      isOverdue: false
    },
    include: {
      submission: true,
      assignedUser: true
    }
  })
  
  for (const deadline of overdueDeadlines) {
    // Đánh dấu overdue
    await prisma.deadline.update({
      where: { id: deadline.id },
      data: { isOverdue: true }
    })
    
    // Gửi thông báo
    if (deadline.assignedTo) {
      await createNotification({
        userId: deadline.assignedTo,
        type: 'DEADLINE_OVERDUE',
        title: '⚠️ Deadline đã quá hạn',
        message: `Deadline ${getDeadlineTypeName(deadline.type)} cho bài "${deadline.submission.title}" đã quá hạn`,
        link: `/dashboard/submissions/${deadline.submissionId}`,
        sendEmail: true
      })
    }
  }
}

/**
 * Gửi reminder cho deadlines sắp đến hạn.
 * Số ngày cảnh báo và số lần nhắc tối đa đọc từ WorkflowStepConfig.
 */
export async function sendDeadlineReminders(): Promise<void> {
  const now = new Date()

  // Lấy tất cả deadlines chưa hoàn thành, chưa quá hạn, còn trong tương lai
  const pendingDeadlines = await prisma.deadline.findMany({
    where: {
      dueDate: { gte: now },
      completedAt: null,
    },
    include: {
      submission: true,
      assignedUser: true,
    },
  })

  for (const deadline of pendingDeadlines) {
    const config = await getStepConfig(deadline.type)

    const reminderWindowMs = config.reminderDays * 24 * 60 * 60 * 1000
    const dueMs = deadline.dueDate.getTime()
    const isWithinWindow = dueMs - now.getTime() <= reminderWindowMs
    const belowMaxReminders = deadline.remindersSent < config.maxReminders

    if (!isWithinWindow || !belowMaxReminders || !deadline.assignedTo) continue

    const daysLeft = Math.floor((dueMs - now.getTime()) / (1000 * 60 * 60 * 24))

    await createNotification({
      userId: deadline.assignedTo,
      type: 'DEADLINE_APPROACHING',
      title: 'Nhắc nhở deadline',
      message: `Còn ${daysLeft} ngày để hoàn thành ${getDeadlineTypeName(deadline.type)} cho bài "${deadline.submission.title}"`,
      link: `/dashboard/submissions/${deadline.submissionId}`,
      sendEmail: true,
    })

    await prisma.deadline.update({
      where: { id: deadline.id },
      data: { remindersSent: deadline.remindersSent + 1 },
    })
  }
}

/**
 * Lấy tên tiếng Việt của deadline type
 */
function getDeadlineTypeName(type: DeadlineType): string {
  const names: Record<DeadlineType, string> = {
    INITIAL_REVIEW: 'Phản biện ban đầu',
    REVISION_SUBMIT: 'Nộp bản sửa',
    RE_REVIEW: 'Phản biện lại',
    EDITOR_DECISION: 'Quyết định biên tập',
    PRODUCTION: 'Sản xuất/Dàn trang',
    PUBLICATION: 'Xuất bản'
  }
  return names[type]
}

/**
 * Tự động tạo deadlines khi submission chuyển status.
 * Số ngày deadline đọc từ WorkflowStepConfig thay vì hard-code.
 */
export async function autoCreateDeadlinesOnStatusChange(
  submissionId: string,
  newStatus: SubmissionStatus
): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  })

  if (!submission) return

  const now = new Date()

  switch (newStatus) {
    case 'UNDER_REVIEW': {
      const config = await getStepConfig('INITIAL_REVIEW')
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + config.deadlineDays)
      await createDeadline(submissionId, 'INITIAL_REVIEW', dueDate, undefined, 'Hoàn thành phản biện')
      break
    }

    case 'REVISION': {
      const config = await getStepConfig('REVISION_SUBMIT')
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + config.deadlineDays)
      await createDeadline(submissionId, 'REVISION_SUBMIT', dueDate, submission.createdBy, 'Nộp bản chỉnh sửa')
      break
    }

    case 'IN_PRODUCTION': {
      const config = await getStepConfig('PRODUCTION')
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + config.deadlineDays)
      await createDeadline(submissionId, 'PRODUCTION', dueDate, undefined, 'Hoàn thành dàn trang')
      break
    }
  }
}
