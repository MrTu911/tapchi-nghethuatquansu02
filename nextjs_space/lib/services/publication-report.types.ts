/**
 * Kiểu dữ liệu + hàm thuần (pure) cho báo cáo tổng hợp công bố khoa học.
 *
 * Tách riêng khỏi service để: (1) test đơn vị không cần Prisma/exceljs/fs,
 * (2) tái dùng cho cả builder và route. KHÔNG import side-effect ở file này.
 */

import type { JournalArticleStatus, JournalClassification } from '@prisma/client'

export type ReportMode = 'author' | 'aggregate'
export type ReportRole = 'all' | 'chu-tri' | 'dong-tac-gia'
export type ReportFormat = 'docx' | 'xlsx' | 'pdf'

// Nhãn hiển thị cho cột "Loại tạp chí"
export const CLASSIFICATION_LABELS: Record<JournalClassification, string> = {
  SCI: 'SCI',
  SCIE: 'SCIE',
  SCOPUS: 'Scopus',
  ESCI: 'ESCI',
  DOMESTIC_PEER_REVIEWED: 'Trong nước (có phản biện)',
  CONFERENCE: 'Hội nghị khoa học',
  OTHER: 'Khác',
}

const INTERNATIONAL_CLASSES = new Set<string>(['SCI', 'SCIE', 'SCOPUS', 'ESCI'])

export function isInternationalClass(c: string): boolean {
  return INTERNATIONAL_CLASSES.has(c)
}

export function classificationLabel(c: JournalClassification): string {
  return CLASSIFICATION_LABELS[c] ?? CLASSIFICATION_LABELS.OTHER
}

export const ROLE_MAIN = 'Chủ trì'
export const ROLE_CO = 'Đồng tác giả'
export const ROLE_NONE = '—'
export type RowRole = typeof ROLE_MAIN | typeof ROLE_CO | typeof ROLE_NONE

export const MAX_ROWS = 2000
export const REPORT_TITLE = 'BÁO CÁO TỔNG HỢP'
export const REPORT_SUBTITLE = 'Danh mục các bài báo khoa học đã công bố trên tạp chí'

export interface PublicationReportFilters {
  mode: ReportMode
  authorName?: string
  // Khớp tác giả chính xác theo tài khoản (báo cáo cá nhân). Ưu tiên hơn authorName.
  authorUserId?: string
  sectionName?: string
  issueId?: string
  volumeId?: string
  year?: number
  yearFrom?: number
  yearTo?: number
  role?: ReportRole
  journalType?: JournalClassification
  status?: JournalArticleStatus
  keyword?: string
}

export interface PublicationReportRow {
  tt: number
  title: string
  journalName: string
  issueRef: string
  pages: string
  role: RowRole
  journalType: string // nhãn hiển thị "Loại tạp chí"
  classification: string // mã enum JournalClassification (để đếm số liệu)
  sectionName: string
  year: number
}

export interface PublicationReportSummary {
  total: number
  international: number
  domesticPeerReviewed: number
  conference: number
  asMainAuthor: number
  asCoAuthor: number
}

export interface AuthorHeader {
  fullName: string
  rankTitle: string
  organization: string
  researchField: string
  yearFrom?: number
  yearTo?: number
}

export interface PublicationReportPayload {
  generatedAt: Date
  mode: ReportMode
  filtersApplied: PublicationReportFilters
  authorHeader?: AuthorHeader
  rows: PublicationReportRow[]
  summary: PublicationReportSummary
  truncated: boolean
}

/** Suy vai trò từ thứ tự tác giả: order 0 = chủ trì, còn lại = đồng tác giả. */
export function deriveRoleFromOrder(order: number | null | undefined): RowRole {
  if (order === null || order === undefined) return ROLE_NONE
  return order === 0 ? ROLE_MAIN : ROLE_CO
}

export function computeSummary(rows: PublicationReportRow[]): PublicationReportSummary {
  // Đếm theo phân loại tạp chí thực tế (cột journalType của từng bài).
  return {
    total: rows.length,
    international: rows.filter((r) => isInternationalClass(r.classification)).length,
    domesticPeerReviewed: rows.filter((r) => r.classification === 'DOMESTIC_PEER_REVIEWED').length,
    conference: rows.filter((r) => r.classification === 'CONFERENCE').length,
    asMainAuthor: rows.filter((r) => r.role === ROLE_MAIN).length,
    asCoAuthor: rows.filter((r) => r.role === ROLE_CO).length,
  }
}

export function statisticsPeriod(header?: AuthorHeader): string {
  if (!header?.yearFrom && !header?.yearTo) return ''
  return `Từ năm ${header?.yearFrom ?? '...'} đến năm ${header?.yearTo ?? '...'}`
}

export function summaryRows(
  summary: PublicationReportSummary
): { label: string; value: number }[] {
  return [
    { label: 'Tổng số bài báo đã công bố', value: summary.total },
    { label: 'Tạp chí quốc tế (SCI/SCIE/Scopus)', value: summary.international },
    { label: 'Tạp chí khoa học trong nước (có phản biện)', value: summary.domesticPeerReviewed },
    { label: 'Bài báo Hội nghị khoa học (Quốc tế/trong nước)', value: summary.conference },
    { label: 'Bài báo là tác giả chính/chủ trì', value: summary.asMainAuthor },
    { label: 'Bài báo là đồng tác giả', value: summary.asCoAuthor },
  ]
}

export function detailHeaders(mode: ReportMode): string[] {
  const base = ['TT', 'Tên bài báo', 'Tên tạp chí / Hội nghị', 'Số, tập, năm xuất bản', 'Trang']
  if (mode === 'author') base.push('Vai trò')
  base.push('Loại tạp chí')
  return base
}

export function detailRow(row: PublicationReportRow, mode: ReportMode): string[] {
  const base = [String(row.tt), row.title, row.journalName, row.issueRef, row.pages]
  if (mode === 'author') base.push(row.role)
  base.push(row.journalType)
  return base
}
