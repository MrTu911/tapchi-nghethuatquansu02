export type DateRangeOption = 30 | 90 | 180 | 365

export interface CommanderData {
  overview: {
    totalPublished: number
    totalIssues: number
    totalAuthors: number
    acceptanceRate: number
    avgProcessingDays: number
    overdueCount: number
  }
  comparison: {
    totalPublishedChange: number
    totalIssuesChange: number
    totalAuthorsChange: number
    acceptanceRateChange: number
    avgProcessingDaysChange: number
    overdueCountChange: number
  }
  publicationTrend: Array<{ month: string; submitted: number; accepted: number; published: number }>
  byCategory: Array<{ name: string; count: number; percentage: number }>
  categoryByYear: { years: string[]; data: Array<Record<string, any>> }
  categoryGrowthRate: Array<{ name: string; growthRate: number; currentYear: number; prevYear: number }>
  topKeywords: Array<{ keyword: string; count: number }>
  topOrgs: Array<{ org: string; count: number }>
  securityDistribution: Array<{ level: string; count: number }>
  qualityMetrics: { avgPlagiarismScore: number; avgReviewScore: number }
  acceptanceRateTrend: Array<{ month: string; rate: number }>
  recentIssues: Array<{
    id: string; code: string; year: number; volume: number; articleCount: number; publishedAt: string | null
  }>
  workloadPipeline: Array<{ status: string; count: number }>
  repositoryMetrics: { totalViews: number; totalDownloads: number; totalArticles: number }
  topArticlesByDownload: Array<{ title: string; downloads: number; views: number; publishedAt: string | null }>
  monthlyDownloadTrend: Array<{ month: string; downloads: number; views: number }>
  userEcosystem: Array<{ role: string; label: string; count: number }>
  userGrowthTrend: Array<{ month: string; count: number }>
  reviewerPerformance: Array<{ name: string; org: string; completed: number; onTimeRate: number; avgScore: number }>
  activeUsersLast30Days: number
}

export const CATEGORY_COLORS = [
  '#1e3a5f', '#d4a017', '#c0392b', '#0891b2', '#059669',
  '#7c3aed', '#ea580c', '#0e7490', '#4f46e5', '#be185d',
]

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới nộp',
  DESK_REJECT: 'Loại sơ bộ',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Đang chỉnh sửa',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Đang sản xuất',
  PUBLISHED: 'Đã xuất bản',
}

export const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  DESK_REJECT: '#94a3b8',
  UNDER_REVIEW: '#f59e0b',
  REVISION: '#f97316',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  IN_PRODUCTION: '#8b5cf6',
  PUBLISHED: '#059669',
}

export const SECURITY_COLORS: Record<string, string> = {
  PUBLIC: '#059669',
  CONFIDENTIAL: '#d97706',
  SECRET: '#dc2626',
  TOP_SECRET: '#7c3aed',
}

export const SECURITY_LABELS: Record<string, string> = {
  PUBLIC: 'Công khai',
  CONFIDENTIAL: 'Mật',
  SECRET: 'Tối mật',
  TOP_SECRET: 'Tuyệt mật',
}

export const NAVY = '#0f1f3d'
export const GOLD = '#c9a227'
export const EMERALD = '#059669'
export const PURPLE = '#7c3aed'
export const TEAL = '#0891b2'

// Simple linear regression forecast
export function linearForecast(series: number[], ahead: number): number[] {
  const n = series.length
  if (n < 2) return Array(ahead).fill(0)
  const xMean = (n - 1) / 2
  const yMean = series.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (series[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den ? num / den : 0
  const intercept = yMean - slope * xMean
  return Array.from({ length: ahead }, (_, i) =>
    Math.max(0, Math.round(intercept + slope * (n + i)))
  )
}

export function formatChange(change: number): string {
  if (change === 0) return '—'
  const sign = change > 0 ? '▲' : '▼'
  return `${sign} ${Math.abs(change)}%`
}

export function getChangeColor(change: number, invertPositive = false): string {
  if (change === 0) return 'text-slate-400'
  const isPositive = change > 0
  const isGood = invertPositive ? !isPositive : isPositive
  return isGood ? 'text-emerald-600' : 'text-red-500'
}
