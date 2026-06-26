/**
 * Quy tắc kiểm soát quyết định trên bài nộp CÓ ĐỘ MẬT (SECRET / TOP_SECRET).
 *
 * Nghiệp vụ: bài có độ mật phải tuân thủ nguyên tắc "hai người" — chỉ Tổng biên tập
 * (EIC) và Kiểm định bảo mật (SECURITY_AUDITOR) được ra quyết định, và quyết định
 * có tính chung thẩm (chấp nhận / từ chối / xuất bản) cần ĐỦ HAI chữ ký của cả hai
 * vai trò trước khi có hiệu lực.
 *
 * SSOT để mọi route (decision, workflow, publish) enforce cùng một quy tắc — tránh
 * lệch nhau giữa các luồng (ví dụ chặn ACCEPT nhưng quên chặn REJECT/desk-reject).
 *
 * Lưu ý bảo mật: phải enforce ở BACKEND, không chỉ ẩn nút ở UI.
 */

import type { Role } from '@/lib/rbac'
import type { SecurityLevel } from '@prisma/client'

/** Mức độ mật cần áp dụng nguyên tắc hai người. */
export const CLASSIFIED_LEVELS: SecurityLevel[] = ['SECRET', 'TOP_SECRET']

/** Hai vai trò duy nhất được ra quyết định trên bài có độ mật. */
export const CLASSIFIED_DECISION_ROLES: Role[] = ['EIC', 'SECURITY_AUDITOR']

export function isClassified(level?: SecurityLevel | null): boolean {
  return !!level && (CLASSIFIED_LEVELS as string[]).includes(level)
}

/** Vai trò có được phép ra quyết định trên bài mật không. */
export function canDecideClassified(role?: string | null): boolean {
  return !!role && (CLASSIFIED_DECISION_ROLES as string[]).includes(role)
}

/**
 * Kiểm tra đã đủ hai chữ ký (EIC + SECURITY_AUDITOR) trong danh sách phê duyệt
 * cho cùng một loại quyết định chung thẩm.
 */
export function hasDualSignature(
  approvals: Array<{ editor?: { role?: Role | string | null } | null }>,
): boolean {
  const hasEIC = approvals.some((a) => a.editor?.role === 'EIC')
  const hasSecurityAuditor = approvals.some((a) => a.editor?.role === 'SECURITY_AUDITOR')
  return hasEIC && hasSecurityAuditor
}
