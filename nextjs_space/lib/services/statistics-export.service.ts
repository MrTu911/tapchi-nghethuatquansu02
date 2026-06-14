/**
 * Service: Statistics Export
 * Aggregates report data from existing analytics functions
 * and builds workbook/document structures for XLSX export.
 */

// ExcelJS 4.x ships its own types but TSC may not resolve them as a namespace.
// Use dynamic import for the runtime instance; cast the shapes we need explicitly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExcelJS = require('exceljs')
import { getSubmissionAnalytics, getReviewerAnalytics } from '@/lib/advanced-analytics'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExportReportData {
  generatedAt: Date
  overview: {
    totalSubmissions: number
    thisMonth: number
    lastMonth: number
    growthRate: number
    totalPublished: number
    avgReviewDays: number
    acceptanceRate: number
    activeReviewers: number
  }
  byMonth: { month: string; count: number; accepted: number; rejected: number }[]
  byCategory: { category: string; count: number; acceptanceRate: number }[]
  reviewers: {
    name: string
    completionRate: number
    avgResponseDays: number
    score: number
    activeReviews: number
    completedReviews: number
    onTimeRate: number
  }[]
}

// ── Data aggregation ──────────────────────────────────────────────────────────

export async function buildExportReportData(): Promise<ExportReportData> {
  const [subAnalytics, reviewerAnalytics] = await Promise.all([
    getSubmissionAnalytics(),
    getReviewerAnalytics(),
  ])

  const { overview, byMonth, byCategory, rejectionRate, averageReviewDays } = subAnalytics

  const totalDecided = rejectionRate.total
  const accepted = totalDecided - rejectionRate.rejected
  const acceptanceRate = totalDecided > 0 ? (accepted / totalDecided) * 100 : 0

  // Build reviewer combined view
  const reliabilityMap = new Map(
    reviewerAnalytics.reliabilityScore.map(r => [r.reviewerId, r])
  )
  const onTimeMap = new Map(
    reviewerAnalytics.onTimeRate.byReviewer.map(r => [r.reviewerId, r])
  )
  const loadMap = new Map(
    reviewerAnalytics.loadDistribution.map(r => [r.reviewerId, r])
  )

  const reviewers = reviewerAnalytics.reliabilityScore.map(r => {
    const ot = onTimeMap.get(r.reviewerId)
    const ld = loadMap.get(r.reviewerId)
    return {
      name: r.reviewerName,
      completionRate: Math.round(r.completionRate),
      avgResponseDays: Math.round(r.avgResponseDays * 10) / 10,
      score: Math.round(r.score),
      activeReviews: ld?.activeReviews ?? 0,
      completedReviews: ld?.completedReviews ?? 0,
      onTimeRate: ot ? Math.round(ot.rate) : 0,
    }
  })

  return {
    generatedAt: new Date(),
    overview: {
      totalSubmissions: overview.totalSubmissions,
      thisMonth: overview.thisMonth,
      lastMonth: overview.lastMonth,
      growthRate: Math.round(overview.growthRate * 10) / 10,
      totalPublished: 0, // filled from prisma separately if needed
      avgReviewDays: Math.round(averageReviewDays.overall * 10) / 10,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      activeReviewers: reviewerAnalytics.overview.activeReviewers,
    },
    byMonth,
    byCategory,
    reviewers,
  }
}

// ── XLSX builder ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HEADER_FILL: any = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1B3A5C' },
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HEADER_FONT: any = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACCENT_FILL: any = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyHeaderRow(row: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row.eachCell((cell: any) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1B3A5C' } },
      bottom: { style: 'thin', color: { argb: 'FF1B3A5C' } },
    }
  })
  row.height = 22
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function autoWidth(sheet: any, minWidth = 12, maxWidth = 50) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sheet.columns.forEach((col: any) => {
    let maxLen = minWidth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    col.eachCell({ includeEmpty: false }, (cell: any) => {
      const len = cell.value ? String(cell.value).length + 2 : 0
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen, maxWidth)
  })
}

export async function buildXlsxWorkbook(report: ExportReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Tạp chí KHHLQS - Học viện Quốc phòng'
  wb.created = report.generatedAt

  // ── Sheet 1: Tổng quan ────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Tổng quan')
  ws1.mergeCells('A1:C1')
  const title1 = ws1.getCell('A1')
  title1.value = 'BÁO CÁO TỔNG QUAN - TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM'
  title1.font = { bold: true, size: 13, color: { argb: 'FF1B3A5C' } }
  title1.alignment = { horizontal: 'center' }
  ws1.getRow(1).height = 28

  ws1.addRow([])
  ws1.addRow(['Ngày xuất báo cáo:', report.generatedAt.toLocaleDateString('vi-VN')])

  ws1.addRow([])
  const kpiHeader = ws1.addRow(['Chỉ số', 'Giá trị', 'Ghi chú'])
  applyHeaderRow(kpiHeader)

  const kpiRows = [
    ['Tổng bài nộp', report.overview.totalSubmissions, ''],
    ['Bài nộp tháng này', report.overview.thisMonth, `${report.overview.growthRate >= 0 ? '+' : ''}${report.overview.growthRate}% so với tháng trước`],
    ['Bài nộp tháng trước', report.overview.lastMonth, ''],
    ['Tỷ lệ chấp nhận (%)', report.overview.acceptanceRate, ''],
    ['Thời gian review trung bình (ngày)', report.overview.avgReviewDays, ''],
    ['Phản biện viên đang hoạt động', report.overview.activeReviewers, ''],
  ]

  kpiRows.forEach((row, i) => {
    const r = ws1.addRow(row)
    if (i % 2 === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.eachCell((cell: any) => { cell.fill = ACCENT_FILL })
    }
  })

  autoWidth(ws1)

  // ── Sheet 2: Bài nộp theo tháng ───────────────────────────────────────────
  const ws2 = wb.addWorksheet('Bài nộp theo tháng')
  const h2 = ws2.addRow(['Tháng', 'Tổng bài nộp', 'Đã chấp nhận', 'Đã từ chối', 'Tỷ lệ chấp nhận (%)'])
  applyHeaderRow(h2)

  report.byMonth.forEach((row, i) => {
    const rate = row.count > 0 ? Math.round((row.accepted / row.count) * 100 * 10) / 10 : 0
    const r = ws2.addRow([row.month, row.count, row.accepted, row.rejected, rate])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (i % 2 === 0) r.eachCell((cell: any) => { cell.fill = ACCENT_FILL })
  })

  autoWidth(ws2)

  // ── Sheet 3: Theo chuyên mục ──────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Theo chuyên mục')
  const h3 = ws3.addRow(['Chuyên mục', 'Tổng bài nộp', 'Tỷ lệ chấp nhận (%)'])
  applyHeaderRow(h3)

  report.byCategory.forEach((row, i) => {
    const r = ws3.addRow([row.category, row.count, Math.round(row.acceptanceRate * 10) / 10])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (i % 2 === 0) r.eachCell((cell: any) => { cell.fill = ACCENT_FILL })
  })

  autoWidth(ws3)

  // ── Sheet 4: Phản biện viên ───────────────────────────────────────────────
  const ws4 = wb.addWorksheet('Phản biện viên')
  const h4 = ws4.addRow([
    'Phản biện viên',
    'Tỷ lệ hoàn thành (%)',
    'Thời gian phản hồi TB (ngày)',
    'Đúng hạn (%)',
    'Điểm chất lượng',
    'Đang phản biện',
    'Đã hoàn thành',
  ])
  applyHeaderRow(h4)

  report.reviewers.forEach((row, i) => {
    const r = ws4.addRow([
      row.name,
      row.completionRate,
      row.avgResponseDays,
      row.onTimeRate,
      row.score,
      row.activeReviews,
      row.completedReviews,
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (i % 2 === 0) r.eachCell((cell: any) => { cell.fill = ACCENT_FILL })
  })

  autoWidth(ws4)

  return wb.xlsx.writeBuffer()
}
