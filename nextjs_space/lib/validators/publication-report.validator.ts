/**
 * Validator + RBAC scope cho báo cáo tổng hợp công bố khoa học.
 * Dùng chung cho route preview và route export để giữ nhất quán.
 */

import { z } from 'zod'
import { JournalArticleStatus, JournalClassification } from '@prisma/client'
import type { PublicationReportFilters } from '@/lib/services/publication-report.service'

// Vai trò được phép xem mọi tác giả + chế độ tổng hợp tòa soạn
export const EDITORIAL_ROLES = [
  'SECTION_EDITOR',
  'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC',
  'SYSADMIN',
  'COMMANDER',
] as const

export const reportFiltersSchema = z.object({
  mode: z.enum(['author', 'aggregate']).default('author'),
  authorName: z.string().trim().min(1).optional(),
  sectionName: z.string().trim().min(1).optional(),
  issueId: z.string().trim().min(1).optional(),
  volumeId: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  role: z.enum(['all', 'chu-tri', 'dong-tac-gia']).default('all'),
  journalType: z.nativeEnum(JournalClassification).optional(),
  status: z.nativeEnum(JournalArticleStatus).default(JournalArticleStatus.PUBLISHED),
  keyword: z.string().trim().min(1).optional(),
})

export const exportQuerySchema = reportFiltersSchema.extend({
  format: z.enum(['docx', 'xlsx', 'pdf']).default('docx'),
})

export type ParsedReportQuery = z.infer<typeof reportFiltersSchema>

export function isEditorialRole(role: string): boolean {
  return (EDITORIAL_ROLES as readonly string[]).includes(role)
}

/**
 * Ép phạm vi truy cập theo vai trò:
 *  - Vai trò biên tập: giữ nguyên bộ lọc (toàn quyền).
 *  - Vai trò khác (tác giả...): chỉ chế độ cá nhân + khóa về CHÍNH TÀI KHOẢN của họ
 *    (authorUserId = uid) — khớp chính xác, chống dò công bố của người khác. Vẫn giữ
 *    fullName làm nhãn hiển thị cho header báo cáo.
 *
 * Enforce ở backend, không tin frontend.
 */
export function enforceAuthorScope(
  parsed: ParsedReportQuery,
  session: { uid: string; role: string; fullName: string }
): PublicationReportFilters {
  if (isEditorialRole(session.role)) {
    return parsed
  }
  return {
    ...parsed,
    mode: 'author',
    authorUserId: session.uid,
    authorName: session.fullName,
  }
}
