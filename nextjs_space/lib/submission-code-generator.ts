
/**
 * Tự động sinh mã bài báo theo format: NTQS-YYYYMMDD-XXX
 * Ví dụ: NTQS-20251031-001
 * (NTQS = nhận diện Tạp chí Nghệ thuật Quân sự Việt Nam.)
 */

import { prisma } from '@/lib/prisma'

export async function generateSubmissionCode(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  const prefix = `NTQS-${year}${month}${day}`
  
  // Tìm số thứ tự cuối cùng trong ngày hôm nay
  const lastSubmission = await prisma.submission.findFirst({
    where: {
      code: {
        startsWith: prefix
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  let sequence = 1
  if (lastSubmission) {
    // Extract sequence number from code (NTQS-20251031-001 -> 001)
    const parts = lastSubmission.code.split('-')
    if (parts.length === 3) {
      sequence = parseInt(parts[2]) + 1
    }
  }
  
  const sequenceStr = String(sequence).padStart(3, '0')
  return `${prefix}-${sequenceStr}`
}

/**
 * Kiểm tra mã bài có hợp lệ không
 */
export function isValidSubmissionCode(code: string): boolean {
  // Format: NTQS-YYYYMMDD-XXX
  const regex = /^NTQS-\d{8}-\d{3}$/
  return regex.test(code)
}
