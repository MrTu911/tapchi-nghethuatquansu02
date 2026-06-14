/**
 * seed-review-assignments.ts — Tapchi-HCQS
 *
 * Tạo dữ liệu mẫu Review để test trang /dashboard/reviewer/assignments:
 *  - Pending reviews: quá hạn, gấp, bình thường
 *  - Completed reviews: đã nộp với formJson đầy đủ
 *
 * Idempotent: xóa review cũ của target reviewer trước khi insert
 *
 * Run (mặc định - seed cho reviewer đầu tiên):
 *   npx tsx --require dotenv/config prisma/seed-review-assignments.ts
 *
 * Run (seed cho user cụ thể theo email):
 *   npx tsx --require dotenv/config prisma/seed-review-assignments.ts --email admin@tapchintqsvn.edu.vn
 */

import { PrismaClient, Prisma, Recommendation } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// Đọc email target từ CLI argument --email
const emailArgIndex = process.argv.findIndex(a => a === '--email')
const targetEmail: string | null = emailArgIndex !== -1 ? (process.argv[emailArgIndex + 1] ?? null) : null

const DAY_MS = 86_400_000

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS)
}

const COMPLETED_FORM = {
  novelty:
    'Bài báo trình bày phương pháp tối ưu hóa chuỗi cung ứng hậu cần sử dụng thuật toán học tăng cường, có đóng góp mới so với các công trình trước.',
  methodology:
    'Phương pháp thực nghiệm được thiết kế chặt chẽ, có nhóm đối chứng. Dữ liệu được thu thập từ 3 đơn vị trong 6 tháng. Phân tích thống kê đầy đủ.',
  results:
    'Kết quả cho thấy giảm 23% chi phí vận chuyển, tăng 18% tỷ lệ giao đúng hạn. Số liệu rõ ràng, biểu đồ trực quan.',
  presentation:
    'Cấu trúc bài viết logic, ngôn ngữ học thuật phù hợp. Phần tóm tắt đủ thông tin. Tài liệu tham khảo trình bày chuẩn APA.',
  references:
    'Trích dẫn đầy đủ, cập nhật đến năm 2024. Có tham khảo các công trình quốc tế liên quan đến logistics quân sự và AI.',
  strengths:
    '1. Phương pháp AI ứng dụng thực tiễn cao\n2. Dataset lớn và đa dạng\n3. So sánh với baseline rõ ràng\n4. Kết quả có thể triển khai ngay',
  weaknesses:
    '1. Chưa thử nghiệm trên môi trường thực chiến\n2. Phần giới hạn nghiên cứu cần bổ sung\n3. Một số ký hiệu toán học chưa định nghĩa rõ',
  comments:
    'Bài viết có chất lượng tốt, phù hợp với hướng nghiên cứu của tạp chí. Tác giả cần bổ sung phần thảo luận về tính ứng dụng trong điều kiện chiến đấu thực tế và làm rõ các ký hiệu toán học ở mục 3.2.',
  confidentialComments:
    'Bài đạt chất lượng đăng sau khi tác giả sửa các điểm nhỏ đã nêu. Đề xuất chấp nhận sau hiệu chỉnh nhỏ.',
}

async function main() {
  console.log('📝 seed-review-assignments.ts — Tạo dữ liệu Review mẫu\n')

  // ── Tìm target user ───────────────────────────────────────────────────────
  let primaryUser: { id: string; fullName: string } | null = null

  if (targetEmail) {
    // Seed cho email cụ thể (bất kỳ role nào)
    primaryUser = await db.user.findFirst({
      where: { email: targetEmail },
      select: { id: true, fullName: true },
    })
    if (!primaryUser) {
      console.error(`❌ Không tìm thấy user với email: ${targetEmail}`)
      process.exit(1)
    }
    console.log(`  🎯 Target user: ${primaryUser.fullName} (${targetEmail})`)
  } else {
    // Mặc định: lấy reviewer đầu tiên
    primaryUser = await db.user.findFirst({
      where: { role: 'REVIEWER', isActive: true },
      select: { id: true, fullName: true },
    })
    if (!primaryUser) {
      console.error('❌ Không tìm thấy REVIEWER user. Hãy chạy seed chính trước hoặc dùng --email.')
      process.exit(1)
    }
    console.log(`  🎯 Target user (mặc định): ${primaryUser.fullName}`)
  }

  const reviewerUsers = [primaryUser]

  // ── Tìm submissions phù hợp ───────────────────────────────────────────────
  const submissions = await db.submission.findMany({
    where: {
      status: { in: ['UNDER_REVIEW', 'NEW', 'REVISION'] },
    },
    select: { id: true, code: true, title: true },
    take: 12,
  })

  // Nếu không đủ submissions UNDER_REVIEW, lấy thêm bất kỳ submission nào
  let allSubmissions = submissions
  if (allSubmissions.length < 6) {
    const extras = await db.submission.findMany({
      select: { id: true, code: true, title: true },
      take: 12,
      orderBy: { createdAt: 'desc' },
    })
    const existingIds = new Set(allSubmissions.map(s => s.id))
    for (const s of extras) {
      if (!existingIds.has(s.id)) allSubmissions.push(s)
      if (allSubmissions.length >= 10) break
    }
  }

  if (allSubmissions.length === 0) {
    console.error('❌ Không tìm thấy submission nào. Hãy chạy seed chính trước.')
    process.exit(1)
  }
  console.log(`  Tìm thấy ${allSubmissions.length} submission(s) để gán phản biện\n`)

  // ── Cấu hình dữ liệu mẫu ─────────────────────────────────────────────────
  type ReviewConfig = {
    deadlineOffset: number | null  // ngày từ hôm nay, null = không có deadline
    invitedOffset: number          // ngày trước hôm nay khi được gán
    completed: boolean
    recommendation?: Recommendation
    score?: number
    roundNo: number
  }

  const reviewConfigs: ReviewConfig[] = [
    // Pending - Quá hạn (deadline đã qua)
    { invitedOffset: 20, deadlineOffset: -5, completed: false, roundNo: 1 },
    { invitedOffset: 18, deadlineOffset: -2, completed: false, roundNo: 1 },

    // Pending - Gấp (còn 1-3 ngày)
    { invitedOffset: 11, deadlineOffset: 2, completed: false, roundNo: 1 },
    { invitedOffset: 9, deadlineOffset: 1, completed: false, roundNo: 2 },

    // Pending - Bình thường
    { invitedOffset: 5, deadlineOffset: 10, completed: false, roundNo: 1 },
    { invitedOffset: 3, deadlineOffset: 14, completed: false, roundNo: 1 },
    { invitedOffset: 1, deadlineOffset: null, completed: false, roundNo: 1 },

    // Completed - với kết quả đa dạng
    { invitedOffset: 30, deadlineOffset: null, completed: true, recommendation: 'ACCEPT', score: 85, roundNo: 1 },
    { invitedOffset: 45, deadlineOffset: null, completed: true, recommendation: 'MINOR', score: 72, roundNo: 1 },
    { invitedOffset: 60, deadlineOffset: null, completed: true, recommendation: 'MAJOR', score: 55, roundNo: 1 },
    { invitedOffset: 25, deadlineOffset: null, completed: true, recommendation: 'MINOR', score: 78, roundNo: 2 },
    { invitedOffset: 40, deadlineOffset: null, completed: true, recommendation: 'REJECT', score: 35, roundNo: 1 },
  ]

  // ── Assign configs → (reviewer, submission) pairs ─────────────────────────
  let created = 0
  const primaryReviewer = reviewerUsers[0]

  // Xóa reviews cũ của target user trước
  const deleted = await db.review.deleteMany({
    where: { reviewerId: primaryReviewer.id },
  })
  console.log(`  🗑️  Đã xóa ${deleted.count} review cũ của ${primaryReviewer.fullName}\n`)

  for (let i = 0; i < reviewConfigs.length; i++) {
    const cfg = reviewConfigs[i]
    // Xoay vòng submissions, đảm bảo đủ dữ liệu
    const submission = allSubmissions[i % allSubmissions.length]

    const invitedAt = daysFromNow(-cfg.invitedOffset)
    const deadline = cfg.deadlineOffset !== null ? daysFromNow(cfg.deadlineOffset) : null
    const submittedAt = cfg.completed
      ? new Date(invitedAt.getTime() + Math.floor(cfg.invitedOffset * 0.7) * DAY_MS)
      : null

    // Đảm bảo submittedAt không vượt quá hiện tại
    const finalSubmittedAt =
      submittedAt && submittedAt > new Date() ? new Date() : submittedAt

    // Tất cả seed cho primaryReviewer
    const reviewer = primaryReviewer

    await db.review.create({
      data: {
        submissionId: submission.id,
        reviewerId: reviewer.id,
        roundNo: cfg.roundNo,
        invitedAt,
        deadline,
        submittedAt: finalSubmittedAt,
        score: cfg.score ?? null,
        recommendation: cfg.recommendation ?? null,
        formJson: cfg.completed ? COMPLETED_FORM : Prisma.JsonNull,
      },
    })
    created++
  }

  console.log(`  ✅ Đã tạo ${created} review records`)

  // ── Cập nhật ReviewerProfile statistics nếu có ────────────────────────────
  for (const reviewer of reviewerUsers.slice(0, 2)) {
    const profile = await db.reviewerProfile.findFirst({ where: { userId: reviewer.id } })
    if (profile) {
      const allReviews = await db.review.findMany({ where: { reviewerId: reviewer.id } })
      const completed = allReviews.filter(r => r.submittedAt)
      await db.reviewerProfile.update({
        where: { id: profile.id },
        data: {
          totalReviews: allReviews.length,
          completedReviews: completed.length,
          lastReviewAt: completed.length > 0
            ? completed.sort((a, b) =>
                new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
              )[0].submittedAt
            : null,
        },
      })
      console.log(`  ✅ Cập nhật ReviewerProfile cho ${reviewer.fullName}: ${allReviews.length} total, ${completed.length} completed`)
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalReviews = await db.review.count()
  const pendingCount = await db.review.count({ where: { submittedAt: null, declinedAt: null } })
  const completedCount = await db.review.count({ where: { submittedAt: { not: null } } })

  console.log('\n📊 Tổng kết:')
  console.log(`   Tổng Review:    ${totalReviews}`)
  console.log(`   Đang chờ:       ${pendingCount}`)
  console.log(`   Hoàn thành:     ${completedCount}`)
  console.log('\n✅ Seed hoàn thành! Vào /dashboard/reviewer/assignments để test.\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
