/**
 * Scope truy cập bài nộp theo phân công cho khu vực BIÊN TẬP.
 *
 * Nghiệp vụ: "Biên tập viên chuyên mục" (SECTION_EDITOR) chỉ phụ trách những bài
 * được Thư ký tòa soạn PHÂN CÔNG cho mình (Submission.assignedEditorId). Các vai trò
 * biên tập cấp cao (Thư ký tòa soạn, Tổng biên tập, SYSADMIN, dàn trang, kiểm định
 * bảo mật) có quyền giám sát TOÀN BỘ.
 *
 * SSOT để mọi nơi (dashboard, danh sách, chi tiết, gán phản biện, quyết định,
 * nhận xét) enforce cùng một quy tắc — tránh lệch scope giữa UI và API.
 *
 * Lưu ý bảo mật: scope phải enforce ở BACKEND (query + guard), không chỉ ẩn ở UI.
 */

import type { Role } from '@/lib/rbac'

/** Vai trò biên tập thấy TẤT CẢ bài (giám sát toàn tòa soạn). */
export const EDITOR_SEE_ALL_ROLES: Role[] = [
  'MANAGING_EDITOR',
  'DEPUTY_EIC',
  'EIC',
  'SYSADMIN',
  'LAYOUT_EDITOR',
  'SECURITY_AUDITOR',
  'COMMANDER',
]

/** Giá trị không bao giờ khớp — dùng để chặn sạch khi vai trò không có scope. */
const NO_ACCESS_SENTINEL = '__no_access__'

export function editorSeesAll(role?: string): boolean {
  return !!role && (EDITOR_SEE_ALL_ROLES as string[]).includes(role)
}

/**
 * Where-fragment Prisma cho danh sách Submission theo scope của biên tập.
 * - vai trò giám sát: {} (thấy tất cả)
 * - SECTION_EDITOR: chỉ bài được phân công cho mình
 * - vai trò khác: không thấy gì (an toàn mặc định)
 */
export function submissionScopeWhere(role: string, uid: string): Record<string, unknown> {
  if (editorSeesAll(role)) return {}
  if (role === 'SECTION_EDITOR') return { assignedEditorId: uid }
  return { id: NO_ACCESS_SENTINEL }
}

/**
 * Nested where-fragment lọc theo submission được phân công — dùng cho các query
 * Review/Deadline cần giới hạn theo bài của biên tập viên.
 */
export function submissionRelationScope(role: string, uid: string): Record<string, unknown> {
  if (editorSeesAll(role)) return {}
  if (role === 'SECTION_EDITOR') return { submission: { assignedEditorId: uid } }
  return { submission: { assignedEditorId: NO_ACCESS_SENTINEL } }
}

/** Guard cho MỘT bài cụ thể (dùng ở route/trang chi tiết). */
export function canEditorAccessSubmission(
  role: string,
  uid: string,
  assignedEditorId: string | null | undefined,
): boolean {
  if (editorSeesAll(role)) return true
  if (role === 'SECTION_EDITOR') return assignedEditorId === uid
  return false
}
