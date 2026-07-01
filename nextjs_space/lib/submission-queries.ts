import type { Prisma } from '@prisma/client'

/**
 * Bộ lọc Prisma dùng chung cho bài "CHỜ QUYẾT ĐỊNH BIÊN TẬP".
 *
 * Nghiệp vụ: một bài đang phản biện (UNDER_REVIEW) chỉ được coi là "đã xong phản
 * biện, chờ biên tập ra quyết định" khi CÓ ÍT NHẤT MỘT phản biện VÀ tất cả phản
 * biện đã nộp (submittedAt != null).
 *
 * Bẫy Prisma cần tránh: `every` trên quan hệ RỖNG trả về `true`. Nếu chỉ dùng
 * `reviews: { every: { submittedAt: { not: null } } }` thì bài UNDER_REVIEW CHƯA
 * được gán phản biện nào vẫn bị tính là "chờ quyết định" → thổi phồng KPI. Phải
 * kèm `some: {}` để yêu cầu tồn tại ít nhất một phản biện.
 *
 * SSOT cho dashboard Thư ký tòa soạn, Phó Tổng biên tập và Tổng biên tập để 3 nơi
 * không lệch số. Object này chỉ đọc, Prisma không mutate nên chia sẻ tham chiếu
 * giữa nhiều query song song là an toàn.
 */
export const PENDING_DECISION_WHERE = {
  status: 'UNDER_REVIEW',
  reviews: { some: {}, every: { submittedAt: { not: null } } },
} satisfies Prisma.SubmissionWhereInput
