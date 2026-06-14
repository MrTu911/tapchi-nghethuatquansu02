/**
 * Service: Báo cáo tổng hợp công bố khoa học (Publication Report)
 *
 * Tổng hợp danh mục bài báo đã đăng trên các số tạp chí (model JournalArticle)
 * và dựng văn bản báo cáo đúng mẫu hành chính (DOCX / XLSX / PDF).
 *
 * Nguồn dữ liệu: JournalArticle + JournalArticleAuthor — nơi duy nhất có đồng
 * tác giả, cấp bậc/học vị, đơn vị, và thứ tự tác giả (order) để suy ra vai trò
 * Chủ trì / Đồng tác giả.
 *
 * Phân lớp: service chứa truy vấn (qua prisma) + orchestration + dựng tài liệu.
 * Logic thuần (map/đếm/trình bày) nằm ở ./publication-report.types để test được.
 */

import path from 'path'
import fs from 'fs'
import { Prisma, JournalArticleStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { JOURNAL_IDENTITY, REPORT_DEFAULTS } from '@/lib/constants/journal-identity'
import {
  ROLE_NONE,
  MAX_ROWS,
  REPORT_TITLE,
  REPORT_SUBTITLE,
  deriveRoleFromOrder,
  computeSummary,
  classificationLabel,
  statisticsPeriod,
  summaryRows,
  detailHeaders,
  detailRow,
  type ReportMode,
  type ReportFormat,
  type PublicationReportFilters,
  type PublicationReportRow,
  type AuthorHeader,
  type PublicationReportPayload,
} from './publication-report.types'

// Re-export để route/validator tiếp tục import từ service như cũ
export type {
  ReportMode,
  ReportRole,
  ReportFormat,
  PublicationReportFilters,
  PublicationReportRow,
  PublicationReportSummary,
  AuthorHeader,
  PublicationReportPayload,
} from './publication-report.types'

// ── Prisma include + kiểu phái sinh ─────────────────────────────────────────

const reportSelect = {
  title: true,
  pageStart: true,
  pageEnd: true,
  journalType: true,
  journalNameOverride: true,
  issue: {
    select: {
      number: true,
      year: true,
      issueCode: true,
      publishDate: true,
      volume: { select: { volumeNo: true, issn: true } },
    },
  },
  section: { select: { name: true } },
  authors: {
    orderBy: { order: 'asc' as const },
    select: {
      name: true,
      order: true,
      userId: true,
      militaryRank: true,
      academicTitle: true,
      degree: true,
      organization: true,
    },
  },
} satisfies Prisma.JournalArticleSelect

type ReportArticle = Prisma.JournalArticleGetPayload<{ select: typeof reportSelect }>
type ReportAuthor = ReportArticle['authors'][number]

// ── Data aggregation ────────────────────────────────────────────────────────

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function buildWhereClause(
  filters: PublicationReportFilters
): Prisma.JournalArticleWhereInput {
  const where: Prisma.JournalArticleWhereInput = {
    status: filters.status ?? JournalArticleStatus.PUBLISHED,
  }

  // Khớp tác giả: ưu tiên userId (chính xác), nếu không có thì so khớp tên free-text
  if (filters.authorUserId) {
    where.authors = { some: { userId: filters.authorUserId } }
  } else if (filters.authorName) {
    where.authors = {
      some: { name: { contains: filters.authorName, mode: 'insensitive' } },
    }
  }

  if (filters.journalType) {
    where.journalType = filters.journalType
  }

  if (filters.sectionName) {
    where.section = { name: filters.sectionName }
  }

  if (filters.issueId) {
    where.issueId = filters.issueId
  }

  const issueWhere: Prisma.IssueWhereInput = {}
  if (filters.volumeId) issueWhere.volumeId = filters.volumeId
  if (filters.year) {
    issueWhere.year = filters.year
  } else if (filters.yearFrom || filters.yearTo) {
    issueWhere.year = {
      gte: filters.yearFrom ?? undefined,
      lte: filters.yearTo ?? undefined,
    }
  }
  if (Object.keys(issueWhere).length > 0) where.issue = issueWhere

  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: 'insensitive' } },
      { keywords: { has: filters.keyword } },
    ]
  }

  return where
}

/**
 * Tìm bản ghi tác giả được chọn trong một bài.
 * Ưu tiên khớp theo userId (chính xác), nếu không có thì khớp theo tên free-text.
 */
function findMatchedAuthor(
  article: ReportArticle,
  filters: PublicationReportFilters
): ReportAuthor | undefined {
  if (filters.authorUserId) {
    return article.authors.find((a) => a.userId === filters.authorUserId)
  }
  if (filters.authorName) {
    const target = normalize(filters.authorName)
    return article.authors.find((a) => normalize(a.name).includes(target))
  }
  return undefined
}

function formatIssueRef(article: ReportArticle): string {
  const { number, year, issueCode, volume } = article.issue
  const codePart = issueCode ? ` (${issueCode})` : ''
  return `Số ${number}${codePart}, tập ${volume.volumeNo}, ${year}`
}

function formatPages(article: ReportArticle): string {
  if (article.pageEnd && article.pageEnd !== article.pageStart) {
    return `${article.pageStart}-${article.pageEnd}`
  }
  return `${article.pageStart}`
}

function mapArticleToRow(
  article: ReportArticle,
  index: number,
  filters: PublicationReportFilters
): PublicationReportRow {
  const matched = filters.mode === 'author' ? findMatchedAuthor(article, filters) : undefined

  return {
    tt: index + 1,
    title: article.title,
    // Tên tạp chí/hội nghị: dùng override nếu có (vd bài hội nghị), ngược lại tên NTQS
    journalName: article.journalNameOverride?.trim() || REPORT_DEFAULTS.defaultJournalName,
    issueRef: formatIssueRef(article),
    pages: formatPages(article),
    role: filters.mode === 'author' ? deriveRoleFromOrder(matched?.order) : ROLE_NONE,
    journalType: classificationLabel(article.journalType),
    classification: article.journalType,
    sectionName: article.section?.name ?? '',
    year: article.issue.year,
  }
}

/** Chọn bản ghi tác giả đầy đủ thông tin nhất để dựng header báo cáo cá nhân. */
function composeAuthorHeader(
  articles: ReportArticle[],
  filters: PublicationReportFilters
): AuthorHeader | undefined {
  if (!filters.authorName && !filters.authorUserId) return undefined

  let best: ReportAuthor | undefined
  let bestScore = -1
  for (const article of articles) {
    const matched = findMatchedAuthor(article, filters)
    if (!matched) continue
    const score =
      (matched.militaryRank ? 1 : 0) +
      (matched.academicTitle ? 1 : 0) +
      (matched.degree ? 1 : 0) +
      (matched.organization ? 1 : 0)
    if (score > bestScore) {
      bestScore = score
      best = matched
    }
  }

  const rankParts = [best?.militaryRank, best?.academicTitle, best?.degree].filter(
    Boolean
  ) as string[]

  const years = articles.map((a) => a.issue.year)
  const yearFrom = filters.yearFrom ?? (years.length ? Math.min(...years) : undefined)
  const yearTo = filters.yearTo ?? (years.length ? Math.max(...years) : undefined)

  return {
    fullName: best?.name ?? filters.authorName ?? '',
    rankTitle: rankParts.join(', '),
    organization: best?.organization ?? '',
    researchField: '', // Không có trong schema — để trống cho người dùng tự điền
    yearFrom,
    yearTo,
  }
}

export async function buildPublicationReport(
  filters: PublicationReportFilters
): Promise<PublicationReportPayload> {
  const where = buildWhereClause(filters)

  const articles = await prisma.journalArticle.findMany({
    where,
    select: reportSelect,
    orderBy: [
      { issue: { year: 'desc' } },
      { issue: { number: 'desc' } },
      { pageStart: 'asc' },
    ],
    take: MAX_ROWS + 1,
  })

  const truncated = articles.length > MAX_ROWS
  const limited = truncated ? articles.slice(0, MAX_ROWS) : articles

  let rows = limited.map((article, index) => mapArticleToRow(article, index, filters))

  // Lọc vai trò là hậu truy vấn, chỉ áp dụng ở chế độ cá nhân tác giả
  if (filters.mode === 'author' && filters.role && filters.role !== 'all') {
    const wanted = filters.role === 'chu-tri' ? 'Chủ trì' : 'Đồng tác giả'
    rows = rows.filter((r) => r.role === wanted).map((r, i) => ({ ...r, tt: i + 1 }))
  }

  return {
    generatedAt: new Date(),
    mode: filters.mode,
    filtersApplied: filters,
    authorHeader:
      filters.mode === 'author' ? composeAuthorHeader(limited, filters) : undefined,
    rows,
    summary: computeSummary(rows),
    truncated,
  }
}

// ── DOCX builder ─────────────────────────────────────────────────────────────

export async function buildPublicationReportDocx(
  report: PublicationReportPayload
): Promise<Buffer> {
  const docx = await import('docx')
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, VerticalAlign, HeadingLevel,
  } = docx

  const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = {
    top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
    insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
  }

  const centered = (text: string, opts?: { bold?: boolean; size?: number }) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: opts?.bold, size: opts?.size ?? 24 })],
    })

  const labelValue = (label: string, value: string) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${label} `, bold: true, size: 24 }),
        new TextRun({ text: value || '.'.repeat(40), size: 24 }),
      ],
    })

  // Header quốc hiệu 2 cột (không viền)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              centered(JOURNAL_IDENTITY.parentOrg.toUpperCase(), { bold: true, size: 22 }),
              centered(JOURNAL_IDENTITY.nameVi.toUpperCase(), { bold: true, size: 22 }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              centered(JOURNAL_IDENTITY.nation, { bold: true, size: 22 }),
              centered(JOURNAL_IDENTITY.motto, { bold: true, size: 22 }),
            ],
          }),
        ],
      }),
    ],
  })

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    headerTable,
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [new TextRun({ text: REPORT_TITLE, bold: true, size: 32 })],
    }),
    centered(REPORT_SUBTITLE, { bold: true, size: 24 }),
    new Paragraph({ text: '', spacing: { after: 120 } }),
  ]

  // Header thông tin tác giả (chế độ cá nhân)
  if (report.mode === 'author' && report.authorHeader) {
    const h = report.authorHeader
    children.push(
      labelValue('1. Họ và tên:', h.fullName),
      labelValue('2. Học hàm, học vị / Cấp bậc, chức vụ:', h.rankTitle),
      labelValue('3. Đơn vị công tác:', h.organization),
      labelValue('4. Lĩnh vực nghiên cứu chính:', h.researchField),
      labelValue('5. Thời gian thống kê:', statisticsPeriod(h)),
      new Paragraph({ text: '', spacing: { after: 120 } })
    )
  }

  // Mục I — Danh mục chi tiết
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'I. DANH MỤC CHI TIẾT CÁC BÀI BÁO KHOA HỌC', bold: true, size: 26 }),
      ],
    })
  )

  const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: '000000' }
  const allBorders = {
    top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder,
    insideHorizontal: thinBorder, insideVertical: thinBorder,
  }

  const headers = detailHeaders(report.mode)
  const headerCells = headers.map(
    (text) =>
      new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'D9E2F3' },
        children: [centered(text, { bold: true, size: 22 })],
      })
  )

  const bodyRows = report.rows.length
    ? report.rows.map(
        (row) =>
          new TableRow({
            children: detailRow(row, report.mode).map(
              (cell, colIdx) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: colIdx === 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
                      children: [new TextRun({ text: cell, size: 22 })],
                    }),
                  ],
                })
            ),
          })
      )
    : [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: headers.length,
              children: [centered('Không có bài báo phù hợp với bộ lọc.', { size: 22 })],
            }),
          ],
        }),
      ]

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allBorders,
      rows: [new TableRow({ tableHeader: true, children: headerCells }), ...bodyRows],
    }),
    new Paragraph({ text: '', spacing: { after: 160 } })
  )

  // Mục II — Tổng hợp số liệu
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: 'II. TỔNG HỢP SỐ LIỆU', bold: true, size: 26 })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allBorders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Phân loại', 'Số lượng bài'].map(
            (t) =>
              new TableCell({
                shading: { fill: 'D9E2F3' },
                children: [centered(t, { bold: true, size: 22 })],
              })
          ),
        }),
        ...summaryRows(report.summary).map(
          (s) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: s.label, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [centered(String(s.value), { size: 22 })],
                }),
              ],
            })
        ),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 160 } })
  )

  // Mục III — Nhận xét + chữ ký
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: 'III. NHẬN XÉT, ĐÁNH GIÁ CHUNG', bold: true, size: 26 })],
    }),
    new Paragraph({ text: '.'.repeat(90), spacing: { after: 60 } }),
    new Paragraph({ text: '.'.repeat(90), spacing: { after: 60 } }),
    new Paragraph({ text: '.'.repeat(90), spacing: { after: 240 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                centered('XÁC NHẬN CỦA ĐƠN VỊ', { bold: true, size: 24 }),
                centered('(Ký, ghi rõ họ tên)', { size: 22 }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                centered(
                  `..........., ngày ..... tháng ..... năm ${report.generatedAt.getFullYear()}`,
                  { size: 22 }
                ),
                centered('NGƯỜI BÁO CÁO', { bold: true, size: 24 }),
                centered('(Ký, ghi rõ họ tên)', { size: 22 }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  const doc = new Document({
    creator: JOURNAL_IDENTITY.nameVi,
    title: REPORT_TITLE,
    styles: { default: { document: { run: { font: 'Times New Roman' } } } },
    sections: [{ properties: {}, children }],
  })

  return Packer.toBuffer(doc)
}

// ── XLSX builder ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExcelJS = require('exceljs')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XLSX_HEADER_FILL: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3924' } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XLSX_HEADER_FONT: any = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyXlsxHeader(row: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row.eachCell((cell: any) => {
    cell.fill = XLSX_HEADER_FILL
    cell.font = XLSX_HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  row.height = 24
}

export async function buildPublicationReportXlsx(
  report: PublicationReportPayload
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = JOURNAL_IDENTITY.nameVi
  wb.created = report.generatedAt

  // Sheet 1 — Danh mục chi tiết
  const ws = wb.addWorksheet('Danh mục chi tiết')
  const headers = detailHeaders(report.mode)

  ws.mergeCells(1, 1, 1, headers.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = `${REPORT_TITLE} — ${REPORT_SUBTITLE}`
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF1E3924' } }
  titleCell.alignment = { horizontal: 'center' }
  ws.getRow(1).height = 26

  if (report.mode === 'author' && report.authorHeader) {
    const h = report.authorHeader
    ws.addRow([`Họ và tên: ${h.fullName}`])
    ws.addRow([`Học hàm/học vị/Cấp bậc, chức vụ: ${h.rankTitle}`])
    ws.addRow([`Đơn vị công tác: ${h.organization}`])
    ws.addRow([`Thời gian thống kê: ${statisticsPeriod(h)}`])
  }
  ws.addRow([])

  const headerRow = ws.addRow(headers)
  applyXlsxHeader(headerRow)

  report.rows.forEach((row) => {
    ws.addRow(detailRow(row, report.mode))
  })

  // Đặt độ rộng cột hợp lý (cột tên bài rộng nhất)
  const widths = report.mode === 'author'
    ? [6, 55, 32, 24, 10, 14, 22]
    : [6, 55, 32, 24, 10, 22]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ws.columns.forEach((col: any, i: number) => {
    col.width = widths[i] ?? 18
  })
  ws.getColumn(2).alignment = { wrapText: true, vertical: 'top' }

  // Sheet 2 — Tổng hợp số liệu
  const ws2 = wb.addWorksheet('Tổng hợp số liệu')
  const h2 = ws2.addRow(['Phân loại', 'Số lượng bài'])
  applyXlsxHeader(h2)
  summaryRows(report.summary).forEach((s) => ws2.addRow([s.label, s.value]))
  ws2.getColumn(1).width = 50
  ws2.getColumn(2).width = 16

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

// ── PDF builder ──────────────────────────────────────────────────────────────

const PDF_FONT_NAME = 'NotoSerif'
const FONT_REGULAR = 'NotoSerif-Regular.ttf'
const FONT_BOLD = 'NotoSerif-Bold.ttf'
let cachedFonts: { regular: string; bold: string } | null = null

/**
 * Tìm thư mục chứa font, thử nhiều vị trí để bền vững với mọi kiểu deploy
 * (next start, standalone, cwd khác nhau). Không phụ thuộc một đường dẫn cứng.
 */
function resolveFontDir(): string {
  const candidates: string[] = [
    path.join(process.cwd(), 'lib', 'fonts'),
    path.join(process.cwd(), 'nextjs_space', 'lib', 'fonts'),
  ]
  if (typeof __dirname !== 'undefined') {
    candidates.push(
      path.join(__dirname, 'fonts'),
      path.join(__dirname, '..', 'fonts'),
      path.join(__dirname, '..', '..', 'lib', 'fonts'),
      path.join(__dirname, '..', '..', '..', 'lib', 'fonts'),
    )
  }
  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, FONT_REGULAR))) return dir
    } catch {
      // bỏ qua, thử ứng viên tiếp theo
    }
  }
  throw new Error(
    `Không tìm thấy font tiếng Việt cho PDF (${FONT_REGULAR}). Đã thử: ${candidates.join(' | ')}`
  )
}

function loadPdfFonts(): { regular: string; bold: string } {
  if (cachedFonts) return cachedFonts
  const dir = resolveFontDir()
  cachedFonts = {
    regular: fs.readFileSync(path.join(dir, FONT_REGULAR)).toString('base64'),
    bold: fs.readFileSync(path.join(dir, FONT_BOLD)).toString('base64'),
  }
  return cachedFonts
}

export async function buildPublicationReportPdf(
  report: PublicationReportPayload
): Promise<Buffer> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF('portrait', 'mm', 'a4')
  const fonts = loadPdfFonts()
  doc.addFileToVFS('NotoSerif-Regular.ttf', fonts.regular)
  doc.addFont('NotoSerif-Regular.ttf', PDF_FONT_NAME, 'normal')
  doc.addFileToVFS('NotoSerif-Bold.ttf', fonts.bold)
  doc.addFont('NotoSerif-Bold.ttf', PDF_FONT_NAME, 'bold')
  doc.setFont(PDF_FONT_NAME, 'normal')

  const pageWidth = doc.internal.pageSize.getWidth()
  const leftX = 14
  const midLeft = pageWidth * 0.28
  const midRight = pageWidth * 0.72

  // Header quốc hiệu 2 cột
  doc.setFontSize(10)
  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.text(JOURNAL_IDENTITY.parentOrg.toUpperCase(), midLeft, 16, { align: 'center' })
  doc.text(JOURNAL_IDENTITY.nation, midRight, 16, { align: 'center' })
  doc.setFontSize(9)
  doc.text(JOURNAL_IDENTITY.shortNameVi.toUpperCase(), midLeft, 21, { align: 'center' })
  doc.text(JOURNAL_IDENTITY.motto, midRight, 21, { align: 'center' })

  // Tiêu đề
  doc.setFontSize(16)
  doc.text(REPORT_TITLE, pageWidth / 2, 34, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont(PDF_FONT_NAME, 'normal')
  doc.text(REPORT_SUBTITLE, pageWidth / 2, 41, { align: 'center' })

  let cursorY = 50

  if (report.mode === 'author' && report.authorHeader) {
    const h = report.authorHeader
    doc.setFontSize(11)
    const lines = [
      `1. Họ và tên: ${h.fullName}`,
      `2. Học hàm, học vị / Cấp bậc, chức vụ: ${h.rankTitle}`,
      `3. Đơn vị công tác: ${h.organization}`,
      `4. Lĩnh vực nghiên cứu chính: ${h.researchField}`,
      `5. Thời gian thống kê: ${statisticsPeriod(h)}`,
    ]
    lines.forEach((line) => {
      doc.text(line, leftX, cursorY)
      cursorY += 6
    })
    cursorY += 2
  }

  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(12)
  doc.text('I. DANH MỤC CHI TIẾT CÁC BÀI BÁO KHOA HỌC', leftX, cursorY)
  cursorY += 4

  const headers = detailHeaders(report.mode)
  const body = report.rows.length
    ? report.rows.map((row) => detailRow(row, report.mode))
    : [[{ content: 'Không có bài báo phù hợp với bộ lọc.', colSpan: headers.length }]]

  autoTable(doc, {
    startY: cursorY,
    head: [headers],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: body as any,
    styles: { font: PDF_FONT_NAME, fontSize: 8, cellPadding: 1.5, valign: 'middle' },
    headStyles: {
      font: PDF_FONT_NAME, fontStyle: 'bold', fillColor: [30, 57, 36], textColor: 255, halign: 'center',
    },
    columnStyles: { 0: { halign: 'center', cellWidth: 8 }, 1: { cellWidth: 'auto' } },
    margin: { left: 14, right: 14 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterDetailY = (doc as any).lastAutoTable.finalY + 8

  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(12)
  doc.text('II. TỔNG HỢP SỐ LIỆU', leftX, afterDetailY)

  autoTable(doc, {
    startY: afterDetailY + 4,
    head: [['Phân loại', 'Số lượng bài']],
    body: summaryRows(report.summary).map((s) => [s.label, String(s.value)]),
    styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 2 },
    headStyles: { font: PDF_FONT_NAME, fontStyle: 'bold', fillColor: [30, 57, 36], textColor: 255 },
    columnStyles: { 1: { halign: 'center', cellWidth: 30 } },
    margin: { left: 14, right: 14 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let signY = (doc as any).lastAutoTable.finalY + 12
  const pageHeight = doc.internal.pageSize.getHeight()
  if (signY > pageHeight - 40) {
    doc.addPage()
    signY = 30
  }

  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(11)
  doc.text('III. NHẬN XÉT, ĐÁNH GIÁ CHUNG', leftX, signY)
  signY += 16

  doc.text('XÁC NHẬN CỦA ĐƠN VỊ', midLeft, signY, { align: 'center' })
  doc.text('NGƯỜI BÁO CÁO', midRight, signY, { align: 'center' })
  doc.setFont(PDF_FONT_NAME, 'normal')
  doc.setFontSize(10)
  doc.text('(Ký, ghi rõ họ tên)', midLeft, signY + 6, { align: 'center' })
  doc.text('(Ký, ghi rõ họ tên)', midRight, signY + 6, { align: 'center' })

  // Footer số trang
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont(PDF_FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.text(`Trang ${i}/${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

/** Dựng file báo cáo theo định dạng yêu cầu. */
export async function buildPublicationReportFile(
  report: PublicationReportPayload,
  format: ReportFormat
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  switch (format) {
    case 'docx':
      return {
        buffer: await buildPublicationReportDocx(report),
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx',
      }
    case 'xlsx':
      return {
        buffer: await buildPublicationReportXlsx(report),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ext: 'xlsx',
      }
    case 'pdf':
      return {
        buffer: await buildPublicationReportPdf(report),
        contentType: 'application/pdf',
        ext: 'pdf',
      }
  }
}
