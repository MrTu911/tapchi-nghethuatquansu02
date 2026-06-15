import type { Prisma } from '@prisma/client'

/**
 * Thứ tự "Số mới nhất" THỐNG NHẤT toàn hệ thống.
 *
 * "Số mới nhất" = số xuất bản GẦN ĐÂY NHẤT theo NGÀY xuất bản, KHÔNG phải số có
 * `number` lớn nhất. Lý do: số đặc biệt ("Số đặc biệt N") được đánh `number` riêng
 * (lệch khỏi dãy tháng 1–12) để không đụng unique [volumeId, number]; nếu sắp theo
 * `number` thì số đặc biệt sẽ bị coi nhầm là "mới nhất".
 *
 * publishDate là mốc thời gian đúng nghĩa; year + createdAt làm tiebreaker khi thiếu
 * publishDate. Dùng CHUNG ở: trang chủ (góc phải), trang /issues/latest (menu),
 * và API /api/issues/latest — để mọi nơi luôn ra cùng một số.
 */
export const LATEST_ISSUE_ORDER: Prisma.IssueOrderByWithRelationInput[] = [
  { publishDate: { sort: 'desc', nulls: 'last' } },
  { year: 'desc' },
  { createdAt: 'desc' },
]
