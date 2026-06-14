/**
 * Single source of truth cho TRẠNG THÁI PHẢN BIỆN (Review).
 *
 * Model `Review` không có cột `status` riêng — trạng thái được SUY RA từ các mốc
 * thời gian (invitedAt / acceptedAt / declinedAt / submittedAt / deadline) cộng
 * với việc đã có `EditorDecision` cho vòng đó hay chưa (`hasDecision`).
 *
 * File này gộp toàn bộ logic suy luận + nhãn + màu để các trang reviewer dùng
 * chung, tránh mỗi nơi tự map một kiểu (giống `lib/submission-status.ts`).
 * Lưu ý: `lib/` đã nằm trong Tailwind `content` nên class ở đây không bị purge.
 */
import {
  MailQuestion,
  Pencil,
  FileCheck2,
  Lock,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

/** Các trạng thái nghiệp vụ của một lượt phản biện. */
export type ReviewState =
  | 'INVITED' // Đã được mời, chưa nhận/từ chối lời
  | 'IN_PROGRESS' // Đã nhận lời hoặc đang soạn nháp, chưa nộp
  | 'SUBMITTED_EDITABLE' // Đã nộp nhưng BTV chưa ra quyết định → còn sửa được
  | 'LOCKED' // Đã nộp và BTV đã ra quyết định cho vòng → khóa
  | 'DECLINED' // Đã từ chối lời mời

export interface ReviewStateConfig {
  label: string
  description: string
  icon: LucideIcon
  /** Badge inline: nền + chữ + viền (light & dark). */
  badgeClass: string
  /** Màu chấm/accent nhỏ. */
  dotClass: string
  /** Màu chữ thuần. */
  textClass: string
}

/** Hình dạng tối thiểu của Review mà helper cần (tương thích cả dữ liệu include). */
export interface ReviewLike {
  acceptedAt?: Date | string | null
  declinedAt?: Date | string | null
  submittedAt?: Date | string | null
  deadline?: Date | string | null
  formJson?: unknown
}

export const REVIEW_STATE_CONFIG: Record<ReviewState, ReviewStateConfig> = {
  INVITED: {
    label: 'Chờ nhận lời',
    description: 'Bạn được mời phản biện — hãy đồng ý hoặc từ chối lời mời',
    icon: MailQuestion,
    badgeClass:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    description: 'Đang phản biện — chưa nộp',
    icon: Pencil,
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  SUBMITTED_EDITABLE: {
    label: 'Đã nộp · còn sửa được',
    description: 'Đã nộp; vẫn có thể chỉnh sửa cho tới khi biên tập ra quyết định',
    icon: FileCheck2,
    badgeClass:
      'border-brand/40 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/20 dark:text-emerald-300',
    dotClass: 'bg-brand',
    textClass: 'text-brand dark:text-emerald-300',
  },
  LOCKED: {
    label: 'Đã hoàn thành',
    description: 'Đã nộp và biên tập đã ra quyết định — không thể chỉnh sửa',
    icon: Lock,
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  DECLINED: {
    label: 'Đã từ chối',
    description: 'Bạn đã từ chối lời mời phản biện này',
    icon: XCircle,
    badgeClass:
      'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-300',
  },
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

/** Suy ra trạng thái nghiệp vụ của một lượt phản biện. */
export function getReviewState(
  review: ReviewLike,
  hasDecision: boolean,
): ReviewState {
  if (toDate(review.declinedAt)) return 'DECLINED'
  if (toDate(review.submittedAt)) {
    return hasDecision ? 'LOCKED' : 'SUBMITTED_EDITABLE'
  }
  // Chưa nộp: phân biệt đã nhận lời / đang soạn nháp với chưa phản hồi lời mời.
  const hasDraft = !!review.formJson
  if (toDate(review.acceptedAt) || hasDraft) return 'IN_PROGRESS'
  return 'INVITED'
}

/** Lấy config hiển thị theo trạng thái. */
export function getReviewStateConfig(
  review: ReviewLike,
  hasDecision: boolean,
): ReviewStateConfig {
  return REVIEW_STATE_CONFIG[getReviewState(review, hasDecision)]
}

/**
 * Reviewer còn được chỉnh sửa khi: chưa từ chối VÀ chưa bị khóa bởi quyết định.
 * (Quy tắc nghiệp vụ: được sửa tới khi biên tập ra quyết định cho vòng đó.)
 */
export function canEditReview(review: ReviewLike, hasDecision: boolean): boolean {
  if (toDate(review.declinedAt)) return false
  if (toDate(review.submittedAt) && hasDecision) return false
  return true
}

/** Đã nộp (ít nhất một lần) hay chưa. */
export function isReviewSubmitted(review: ReviewLike): boolean {
  return !!toDate(review.submittedAt)
}

/** Quá hạn: có deadline, đã qua hạn, và chưa nộp/chưa từ chối. */
export function isReviewOverdue(
  review: ReviewLike,
  now: Date = new Date(),
): boolean {
  const deadline = toDate(review.deadline)
  if (!deadline) return false
  if (toDate(review.submittedAt) || toDate(review.declinedAt)) return false
  return now.getTime() > deadline.getTime()
}

/** Số ngày còn lại tới hạn (âm = quá hạn); null nếu không có deadline. */
export function getDaysUntilDeadline(
  review: ReviewLike,
  now: Date = new Date(),
): number | null {
  const deadline = toDate(review.deadline)
  if (!deadline) return null
  const ms = deadline.getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// ── Khuyến nghị phản biện (Recommendation) — 1 nguồn nhãn + màu ──────────────

export type RecommendationKey = 'ACCEPT' | 'MINOR' | 'MAJOR' | 'REJECT'

export interface RecommendationConfig {
  label: string
  /** Badge inline (light & dark). */
  badgeClass: string
  /** Màu nền đặc cho chip lựa chọn. */
  solidClass: string
}

export const RECOMMENDATION_CONFIG: Record<RecommendationKey, RecommendationConfig> = {
  ACCEPT: {
    label: 'Chấp nhận',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    solidClass: 'bg-emerald-600 text-white',
  },
  MINOR: {
    label: 'Sửa đổi nhỏ',
    badgeClass:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300',
    solidClass: 'bg-sky-600 text-white',
  },
  MAJOR: {
    label: 'Sửa đổi lớn',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
    solidClass: 'bg-amber-500 text-white',
  },
  REJECT: {
    label: 'Từ chối',
    badgeClass:
      'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    solidClass: 'bg-red-600 text-white',
  },
}

const FALLBACK_RECOMMENDATION: RecommendationConfig = {
  label: 'Chưa có',
  badgeClass:
    'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  solidClass: 'bg-slate-500 text-white',
}

export function getRecommendationConfig(value?: string | null): RecommendationConfig {
  if (!value) return FALLBACK_RECOMMENDATION
  return RECOMMENDATION_CONFIG[value as RecommendationKey] ?? FALLBACK_RECOMMENDATION
}

/** Màu chữ cho điểm tổng thể (0-100). */
export function getScoreTextClass(score?: number | null): string {
  if (score == null) return 'text-slate-500'
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-sky-600 dark:text-sky-400'
  return 'text-red-600 dark:text-red-400'
}
