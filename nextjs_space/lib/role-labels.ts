/**
 * SSOT (Single Source Of Truth) nhãn hiển thị vai trò — Tạp chí NTQS.
 *
 * Trước đây nhãn vai trò bị rải rác và lệch nhau ở nhiều file (lib/email.ts,
 * lib/chat-guard.ts, components/dashboard/*). Ví dụ EIC từng hiển thị 3 kiểu:
 * "Tổng biên tập trưởng" / "Tổng Chủ biên" / "Tổng biên tập". File này là nguồn
 * duy nhất để mọi nơi (chat, email, control gán biên tập, banner, dashboard)
 * dùng CÙNG một nhãn — tránh lệch identity.
 *
 * Ánh xạ chức danh tòa soạn (xem .claude/CLAUDE.md mục 5):
 *   SECTION_EDITOR   → Biên tập viên chuyên mục
 *   MANAGING_EDITOR  → Thư ký tòa soạn / Biên tập viên chính
 *   DEPUTY_EIC       → Phó Tổng biên tập
 *   EIC              → Tổng biên tập
 */

export type RoleKey =
  | 'READER'
  | 'AUTHOR'
  | 'REVIEWER'
  | 'SECTION_EDITOR'
  | 'MANAGING_EDITOR'
  | 'DEPUTY_EIC'
  | 'EIC'
  | 'LAYOUT_EDITOR'
  | 'SYSADMIN'
  | 'SECURITY_AUDITOR'
  | 'COMMANDER'

interface RoleLabel {
  /** Nhãn tiếng Việt đầy đủ (dùng cho hồ sơ, email, tiêu đề). */
  vi: string
  /** Nhãn rút gọn (dùng cho badge, danh sách hẹp). */
  short: string
  /** Nhãn tiếng Anh. */
  en: string
}

export const ROLE_LABELS: Record<RoleKey, RoleLabel> = {
  READER: { vi: 'Độc giả', short: 'Độc giả', en: 'Reader' },
  AUTHOR: { vi: 'Tác giả', short: 'Tác giả', en: 'Author' },
  REVIEWER: { vi: 'Phản biện viên', short: 'Phản biện', en: 'Reviewer' },
  SECTION_EDITOR: { vi: 'Biên tập viên chuyên mục', short: 'BTV chuyên mục', en: 'Section Editor' },
  MANAGING_EDITOR: { vi: 'Thư ký tòa soạn', short: 'Thư ký tòa soạn', en: 'Managing Editor' },
  DEPUTY_EIC: { vi: 'Phó Tổng biên tập', short: 'Phó TBT', en: 'Deputy Editor-in-Chief' },
  EIC: { vi: 'Tổng biên tập', short: 'Tổng biên tập', en: 'Editor-in-Chief' },
  LAYOUT_EDITOR: { vi: 'Biên tập viên dàn trang', short: 'BT Dàn trang', en: 'Layout Editor' },
  SYSADMIN: { vi: 'Quản trị hệ thống', short: 'Quản trị', en: 'System Admin' },
  SECURITY_AUDITOR: { vi: 'Kiểm định bảo mật', short: 'Kiểm định', en: 'Security Auditor' },
  COMMANDER: { vi: 'Chỉ huy Học viện', short: 'Chỉ huy', en: 'Commander' },
}

/** Nhãn tiếng Việt đầy đủ; fallback về chính role nếu không khớp. */
export function getRoleLabelVi(role?: string | null): string {
  if (!role) return ''
  return ROLE_LABELS[role as RoleKey]?.vi ?? role
}

/** Nhãn rút gọn cho badge/danh sách hẹp. */
export function getRoleLabelShort(role?: string | null): string {
  if (!role) return ''
  return ROLE_LABELS[role as RoleKey]?.short ?? role
}

/** Nhãn theo ngôn ngữ (vi mặc định). */
export function getRoleLabelByLang(role?: string | null, lang: 'vi' | 'en' = 'vi'): string {
  if (!role) return ''
  return ROLE_LABELS[role as RoleKey]?.[lang] ?? role
}
