/**
 * Single source of truth cho trạng thái bài nộp (SubmissionStatus).
 *
 * Trước đây có 3 bảng map status trùng & lệch nhau:
 *  - app/dashboard/author/page.tsx (STATUS_MAP, có `step`)
 *  - app/dashboard/author/submissions/page.tsx (STATUS_CONFIG + WORKFLOW_STAGES)
 *  - components/ui/status-badge.tsx (dùng SAI key, không khớp enum thật)
 *
 * File này gộp lại theo đúng 8 giá trị enum Prisma `SubmissionStatus`.
 * Lưu ý: lib/ đã được thêm vào Tailwind `content` để class ở đây không bị purge.
 */
import type { SubmissionStatus } from '@prisma/client'
import {
  Send,
  Users,
  FileEdit,
  CheckCircle,
  BookOpen,
  XCircle,
  Ban,
  Globe,
  type LucideIcon,
} from 'lucide-react'

export interface SubmissionStatusConfig {
  /** Nhãn tiếng Việt hiển thị cho tác giả */
  label: string
  /** Mô tả ngắn cho tooltip / phụ đề */
  description: string
  icon: LucideIcon
  /** Class cho badge inline: nền + chữ + viền (light & dark) */
  badgeClass: string
  /** Class nền cho dot/accent nhỏ (vd. thanh tiến độ) */
  dotClass: string
  /** Class chữ thuần để tô màu text */
  textClass: string
  /** Vị trí trên pipeline tuyến tính (0 = nhánh từ chối, không nằm trên trục chính) */
  step: number
  /** Tác giả cần hành động (nộp bản chỉnh sửa) */
  isActionNeeded: boolean
  /** Trạng thái kết thúc (không chuyển tiếp được nữa) */
  isTerminal: boolean
}

/**
 * Map đúng 8 giá trị enum thật.
 * Quy ước màu: giữ màu ngữ nghĩa cho các trạng thái cảnh báo/trung gian
 * (đỏ = từ chối, hổ phách = phản biện), dùng tông thương hiệu cho mốc tích cực
 * (xanh brand = chấp nhận/công bố, vàng gold = cần chỉnh sửa — nổi bật hành động).
 */
export const SUBMISSION_STATUS_CONFIG: Record<SubmissionStatus, SubmissionStatusConfig> = {
  NEW: {
    label: 'Mới nộp',
    description: 'Đã nộp, chờ biên tập viên xét sơ bộ',
    icon: Send,
    badgeClass: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-300',
    step: 1,
    isActionNeeded: false,
    isTerminal: false,
  },
  DESK_REJECT: {
    label: 'Từ chối sơ bộ',
    description: 'Bị từ chối ở vòng xét sơ bộ, không qua phản biện',
    icon: Ban,
    badgeClass: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-300',
    step: 0,
    isActionNeeded: false,
    isTerminal: true,
  },
  UNDER_REVIEW: {
    label: 'Đang phản biện',
    description: 'Đang được các phản biện viên đánh giá',
    icon: Users,
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
    step: 2,
    isActionNeeded: false,
    isTerminal: false,
  },
  REVISION: {
    label: 'Cần chỉnh sửa',
    description: 'Cần chỉnh sửa theo yêu cầu phản biện và nộp lại',
    icon: FileEdit,
    badgeClass: 'border-gold/60 bg-gold/15 text-yellow-800 dark:border-gold/40 dark:bg-gold/10 dark:text-gold',
    dotClass: 'bg-gold',
    textClass: 'text-yellow-800 dark:text-gold',
    step: 3,
    isActionNeeded: true,
    isTerminal: false,
  },
  ACCEPTED: {
    label: 'Đã chấp nhận',
    description: 'Được duyệt, chuẩn bị vào khâu xuất bản',
    icon: CheckCircle,
    badgeClass: 'border-brand/40 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/20 dark:text-emerald-300',
    dotClass: 'bg-brand',
    textClass: 'text-brand dark:text-emerald-300',
    step: 4,
    isActionNeeded: false,
    isTerminal: false,
  },
  REJECTED: {
    label: 'Từ chối',
    description: 'Bị từ chối sau phản biện',
    icon: XCircle,
    badgeClass: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-300',
    step: 0,
    isActionNeeded: false,
    isTerminal: true,
  },
  IN_PRODUCTION: {
    label: 'Đang xuất bản',
    description: 'Đang biên tập, dàn trang để xuất bản',
    icon: BookOpen,
    badgeClass: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300',
    dotClass: 'bg-violet-500',
    textClass: 'text-violet-700 dark:text-violet-300',
    step: 5,
    isActionNeeded: false,
    isTerminal: false,
  },
  PUBLISHED: {
    label: 'Đã công bố',
    description: 'Đã xuất bản công khai trên tạp chí',
    icon: Globe,
    badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    step: 6,
    isActionNeeded: false,
    isTerminal: true,
  },
}

/** Pipeline tuyến tính của vòng đời bài nộp (dùng cho thanh tiến độ). */
export const WORKFLOW_STAGES: { key: SubmissionStatus; label: string; icon: LucideIcon }[] = [
  { key: 'NEW', label: 'Nộp bài', icon: Send },
  { key: 'UNDER_REVIEW', label: 'Phản biện', icon: Users },
  { key: 'REVISION', label: 'Chỉnh sửa', icon: FileEdit },
  { key: 'ACCEPTED', label: 'Chấp nhận', icon: CheckCircle },
  { key: 'IN_PRODUCTION', label: 'Xuất bản', icon: BookOpen },
  { key: 'PUBLISHED', label: 'Công bố', icon: Globe },
]

const FALLBACK_CONFIG: SubmissionStatusConfig = {
  label: 'Không rõ',
  description: '',
  icon: FileEdit,
  badgeClass: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  dotClass: 'bg-slate-400',
  textClass: 'text-slate-600 dark:text-slate-300',
  step: 0,
  isActionNeeded: false,
  isTerminal: false,
}

/** Lấy config an toàn cho 1 status (nhận string để tương thích dữ liệu cũ). */
export function getSubmissionStatusConfig(status: string): SubmissionStatusConfig {
  return SUBMISSION_STATUS_CONFIG[status as SubmissionStatus] ?? { ...FALLBACK_CONFIG, label: status }
}

/** % tiến độ trên pipeline; trạng thái từ chối trả 0. */
export function getStageProgress(status: string): number {
  const cfg = getSubmissionStatusConfig(status)
  if (cfg.isTerminal && cfg.step === 0) return 0
  if (cfg.step === 0) return 0
  return Math.round((cfg.step / WORKFLOW_STAGES.length) * 100)
}
