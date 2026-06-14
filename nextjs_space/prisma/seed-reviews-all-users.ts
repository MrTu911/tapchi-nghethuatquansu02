/**
 * seed-reviews-all-users.ts
 * Seed 12 review records cho TẤT CẢ users trong hệ thống.
 * Mục đích: test trang reviewer/assignments với bất kỳ account nào.
 *
 * Run: npx tsx --require dotenv/config prisma/seed-reviews-all-users.ts
 */
import { PrismaClient, Prisma, Recommendation } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()
const DAY_MS = 86_400_000

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS)
}

const FORM_JSON = {
  novelty: 'Bài báo trình bày phương pháp tối ưu hóa chuỗi cung ứng hậu cần sử dụng thuật toán học tăng cường, có đóng góp mới so với các công trình trước.',
  methodology: 'Phương pháp thực nghiệm được thiết kế chặt chẽ, có nhóm đối chứng. Dữ liệu được thu thập từ 3 đơn vị trong 6 tháng.',
  results: 'Kết quả cho thấy giảm 23% chi phí vận chuyển, tăng 18% tỷ lệ giao đúng hạn. Số liệu rõ ràng.',
  presentation: 'Cấu trúc bài viết logic, ngôn ngữ học thuật phù hợp. Tóm tắt đủ thông tin.',
  references: 'Trích dẫn đầy đủ, cập nhật đến năm 2024. Tham khảo công trình quốc tế liên quan.',
  strengths: '1. Phương pháp AI ứng dụng thực tiễn cao\n2. Dataset lớn và đa dạng\n3. So sánh với baseline rõ ràng',
  weaknesses: '1. Chưa thử nghiệm trên môi trường thực chiến\n2. Phần giới hạn nghiên cứu cần bổ sung',
  comments: 'Bài viết có chất lượng tốt. Cần bổ sung phần thảo luận về tính ứng dụng thực tế.',
  confidentialComments: 'Đề xuất chấp nhận sau hiệu chỉnh nhỏ.',
}

type ReviewCfg = {
  deadlineOffset: number | null
  invitedOffset: number
  completed: boolean
  recommendation?: Recommendation
  score?: number
  roundNo: number
}

const CONFIGS: ReviewCfg[] = [
  // Pending - Quá hạn
  { invitedOffset: 20, deadlineOffset: -5, completed: false, roundNo: 1 },
  { invitedOffset: 18, deadlineOffset: -2, completed: false, roundNo: 1 },
  // Pending - Gấp
  { invitedOffset: 11, deadlineOffset: 2, completed: false, roundNo: 1 },
  { invitedOffset: 9, deadlineOffset: 1, completed: false, roundNo: 2 },
  // Pending - Bình thường
  { invitedOffset: 5, deadlineOffset: 10, completed: false, roundNo: 1 },
  { invitedOffset: 3, deadlineOffset: 14, completed: false, roundNo: 1 },
  { invitedOffset: 1, deadlineOffset: null, completed: false, roundNo: 1 },
  // Completed
  { invitedOffset: 30, deadlineOffset: null, completed: true, recommendation: 'ACCEPT', score: 85, roundNo: 1 },
  { invitedOffset: 45, deadlineOffset: null, completed: true, recommendation: 'MINOR', score: 72, roundNo: 1 },
  { invitedOffset: 60, deadlineOffset: null, completed: true, recommendation: 'MAJOR', score: 55, roundNo: 1 },
  { invitedOffset: 25, deadlineOffset: null, completed: true, recommendation: 'MINOR', score: 78, roundNo: 2 },
  { invitedOffset: 40, deadlineOffset: null, completed: true, recommendation: 'REJECT', score: 35, roundNo: 1 },
]

async function seedForUser(
  userId: string,
  label: string,
  submissions: { id: string }[]
) {
  await db.review.deleteMany({ where: { reviewerId: userId } })

  for (let i = 0; i < CONFIGS.length; i++) {
    const cfg = CONFIGS[i]
    const submission = submissions[i % submissions.length]
    const invitedAt = daysFromNow(-cfg.invitedOffset)
    const deadline = cfg.deadlineOffset !== null ? daysFromNow(cfg.deadlineOffset) : null
    const rawSubmittedAt = cfg.completed
      ? new Date(invitedAt.getTime() + Math.floor(cfg.invitedOffset * 0.7) * DAY_MS)
      : null
    const submittedAt = rawSubmittedAt && rawSubmittedAt > new Date() ? new Date() : rawSubmittedAt

    await db.review.create({
      data: {
        submissionId: submission.id,
        reviewerId: userId,
        roundNo: cfg.roundNo,
        invitedAt,
        deadline,
        submittedAt,
        score: cfg.score ?? null,
        recommendation: cfg.recommendation ?? null,
        formJson: cfg.completed ? FORM_JSON : Prisma.JsonNull,
      },
    })
  }
  console.log(`  ✅ ${label}`)
}

async function main() {
  console.log('📝 Seed reviews cho TẤT CẢ users (test bất kỳ account nào)\n')

  const submissions = await db.submission.findMany({ select: { id: true }, take: 12 })
  if (submissions.length === 0) {
    console.error('❌ Không có submission. Chạy seed chính trước.')
    process.exit(1)
  }

  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true, role: true },
  })

  console.log(`Tạo reviews cho ${users.length} users × ${CONFIGS.length} records = ${users.length * CONFIGS.length} total\n`)

  for (const user of users) {
    await seedForUser(user.id, `${user.role.padEnd(18)} — ${user.fullName}`, submissions)
  }

  const total = await db.review.count()
  const pending = await db.review.count({ where: { submittedAt: null, declinedAt: null } })
  const completed = await db.review.count({ where: { submittedAt: { not: null } } })

  console.log(`\n📊 Tổng Review trong DB: ${total} (${pending} pending, ${completed} completed)`)
  console.log('✅ Đăng nhập bằng bất kỳ account nào đều thấy dữ liệu trên /dashboard/reviewer/assignments\n')

  console.log('🔑 Tất cả accounts dùng password: TapChi@2025')
  for (const u of users) {
    console.log(`   ${u.role.padEnd(18)} ${u.fullName}`)
  }

  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
