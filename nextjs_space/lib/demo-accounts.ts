import type { Role } from '@/lib/rbac'
import { ROLE_LABELS } from '@/lib/role-labels'

/**
 * SSOT (Single Source Of Truth) tài khoản demo theo vai trò — Tạp chí NTQS.
 *
 * Dùng chung cho:
 *   - app/auth/login/page.tsx  → panel "tài khoản demo" tự điền (client)
 *   - scripts/seed-demo-accounts.ts → tạo/cập nhật tài khoản trong DB
 *   - scripts/verify-role-access.ts → kiểm tra đăng nhập + quyền
 *
 * File THUẦN (không import Prisma/Node) để client component import an toàn.
 * Mật khẩu chung giữ nguyên như demo hiện tại để không phá quy ước cũ.
 *
 * Lưu ý branding NTQS: tất cả email dùng domain @tapchintqsvn.edu.vn
 * (KHÔNG dùng domain email của codebase nguồn cũ).
 */
export const DEMO_PASSWORD = 'TapChi@2025'

/** Nhóm hiển thị trên trang đăng nhập. */
export type DemoGroup = 'leadership' | 'editorial' | 'operations' | 'system'

export interface DemoAccount {
  role: Role
  /** Nhãn tiếng Việt (đồng bộ ROLE_LABELS). */
  label: string
  email: string
  password: string
  /** Đơn vị mặc định khi tạo mới (không ghi đè nếu tài khoản đã tồn tại). */
  org: string
  group: DemoGroup
  /** Emoji minh hoạ trên nút demo. */
  icon: string
  /** Mô tả ngắn phạm vi quyền (1 dòng). */
  description: string
}

export const DEMO_GROUP_LABELS: Record<DemoGroup, string> = {
  leadership: 'Lãnh đạo tòa soạn',
  editorial: 'Biên tập & Sản xuất',
  operations: 'Tác nghiệp',
  system: 'Hệ thống & Giám sát',
}

/** Thứ tự hiển thị các nhóm trên trang đăng nhập. */
export const DEMO_GROUP_ORDER: DemoGroup[] = ['leadership', 'editorial', 'operations', 'system']

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // ── Lãnh đạo tòa soạn ──────────────────────────────────────────────
  {
    role: 'EIC',
    label: ROLE_LABELS.EIC.vi,
    email: 'tongbientap@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'leadership',
    icon: '👑',
    description: 'Quyết định & ký xuất bản',
  },
  {
    role: 'DEPUTY_EIC',
    label: ROLE_LABELS.DEPUTY_EIC.vi,
    email: 'photongbientap@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'leadership',
    icon: '🎖️',
    description: 'Giám sát, trình duyệt (không ký xuất bản)',
  },
  {
    role: 'COMMANDER',
    label: ROLE_LABELS.COMMANDER.vi,
    email: 'chihuy@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'leadership',
    icon: '⭐',
    description: 'Xem báo cáo điều hành tổng hợp',
  },

  // ── Biên tập & Sản xuất ────────────────────────────────────────────
  {
    role: 'MANAGING_EDITOR',
    label: ROLE_LABELS.MANAGING_EDITOR.vi,
    email: 'bientapchinh@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'editorial',
    icon: '📋',
    description: 'Điều phối quy trình, phân công',
  },
  {
    role: 'SECTION_EDITOR',
    label: ROLE_LABELS.SECTION_EDITOR.vi,
    email: 'bientap@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'editorial',
    icon: '✏️',
    description: 'Xử lý bài được phân công, gán phản biện',
  },
  {
    role: 'LAYOUT_EDITOR',
    label: ROLE_LABELS.LAYOUT_EDITOR.vi,
    email: 'dangtrang@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'editorial',
    icon: '🖨️',
    description: 'Dàn trang, hàng đợi sản xuất',
  },

  // ── Tác nghiệp ─────────────────────────────────────────────────────
  {
    role: 'AUTHOR',
    label: ROLE_LABELS.AUTHOR.vi,
    email: 'tacgia@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'operations',
    icon: '📝',
    description: 'Nộp & theo dõi bài',
  },
  {
    role: 'REVIEWER',
    label: ROLE_LABELS.REVIEWER.vi,
    email: 'phanbien@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Đại học Quốc phòng',
    group: 'operations',
    icon: '🔍',
    description: 'Đánh giá bài nộp (phản biện kín)',
  },
  {
    role: 'READER',
    label: ROLE_LABELS.READER.vi,
    email: 'docgia@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Quân khu 2',
    group: 'operations',
    icon: '👁️',
    description: 'Xem nội dung công khai',
  },

  // ── Hệ thống & Giám sát ────────────────────────────────────────────
  {
    role: 'SYSADMIN',
    label: ROLE_LABELS.SYSADMIN.vi,
    email: 'admin@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'system',
    icon: '🛡️',
    description: 'Toàn quyền hệ thống',
  },
  {
    role: 'SECURITY_AUDITOR',
    label: ROLE_LABELS.SECURITY_AUDITOR.vi,
    email: 'baomat@tapchintqsvn.edu.vn',
    password: DEMO_PASSWORD,
    org: 'Học viện Quốc phòng',
    group: 'system',
    icon: '🔐',
    description: 'Giám sát an toàn, đồng ký bài mật',
  },
]

/** Tên đầy đủ mặc định khi tạo mới tài khoản demo (dùng cho seed). */
export const DEMO_DEFAULT_FULLNAME: Record<Role, string> = {
  EIC: 'Tổng Biên Tập',
  DEPUTY_EIC: 'Phó Tổng Biên Tập',
  COMMANDER: 'Chỉ huy Học viện',
  MANAGING_EDITOR: 'Biên Tập Chính',
  SECTION_EDITOR: 'Biên Tập Chuyên Mục',
  LAYOUT_EDITOR: 'Biên tập dàn trang',
  AUTHOR: 'Tác giả',
  REVIEWER: 'Phản biện viên',
  READER: 'Độc giả',
  SYSADMIN: 'Quản trị viên hệ thống',
  SECURITY_AUDITOR: 'Kiểm định bảo mật',
}

/** Trả về các tài khoản demo theo nhóm, đúng thứ tự DEMO_GROUP_ORDER. */
export function getDemoAccountsByGroup(): { group: DemoGroup; label: string; accounts: DemoAccount[] }[] {
  return DEMO_GROUP_ORDER.map((group) => ({
    group,
    label: DEMO_GROUP_LABELS[group],
    accounts: DEMO_ACCOUNTS.filter((a) => a.group === group),
  })).filter((g) => g.accounts.length > 0)
}
