/**
 * Service: Xuất báo cáo kiểm tra đạo văn (DOCX / PDF).
 *
 * Dựng văn bản báo cáo từ một bản ghi PlagiarismReport đã lưu, theo mẫu hành chính
 * của Tạp chí NTQS. Tái dùng font NotoSerif (tiếng Việt có dấu) và định danh tạp chí
 * dùng chung. Air-gapped friendly: không gọi dịch vụ ngoài.
 *
 * Phân lớp: service nhận PAYLOAD thuần (route đã nạp DB + chuẩn hóa), chỉ lo dựng tài liệu.
 */

import { JOURNAL_IDENTITY } from '@/lib/constants/journal-identity'
import { PDF_FONT_NAME, registerNotoFonts } from '@/lib/pdf/noto-fonts'
import { sourceTypeLabel, severityLabel } from '@/lib/plagiarism/labels'

export type PlagiarismExportFormat = 'pdf' | 'docx'

export interface PlagiarismExportMatch {
  title: string
  type: string
  similarity: number
  phraseOverlap: number
  sameAuthor?: boolean
  matchedPhrases: string[]
}

export interface PlagiarismExportSourceBreakdown {
  type: string
  matchCount: number
  maxScore: number
}

export interface PlagiarismReportExportPayload {
  submissionCode: string
  submissionTitle: string
  authorName: string
  score: number
  originalityScore: number
  method: string
  totalCompared: number
  checkedAt: Date
  checkerName?: string
  notes?: string | null
  matches: PlagiarismExportMatch[]
  sourceBreakdown: PlagiarismExportSourceBreakdown[]
  generatedAt: Date
}

const REPORT_TITLE = 'BÁO CÁO KIỂM TRA TRÙNG LẶP / ĐẠO VĂN'
const METHOD_LABELS: Record<string, string> = {
  cosine: 'TF-IDF Cosine + trùng cụm n-gram',
  jaccard: 'Jaccard + trùng cụm n-gram',
}

const formatDateTime = (date: Date): string => {
  // Định dạng dd/MM/yyyy HH:mm ổn định (không phụ thuộc locale máy chủ).
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${d}/${m}/${y} ${hh}:${mm}`
}

const methodLabel = (method: string): string => METHOD_LABELS[method] ?? method

// ── PDF builder ──────────────────────────────────────────────────────────────

export async function buildPlagiarismReportPdf(payload: PlagiarismReportExportPayload): Promise<Buffer> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF('portrait', 'mm', 'a4')
  registerNotoFonts(doc as any)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
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
  doc.setFontSize(15)
  doc.text(REPORT_TITLE, pageWidth / 2, 34, { align: 'center' })

  // Khối thông tin bài + kết quả
  let cursorY = 46
  doc.setFontSize(11)
  doc.setFont(PDF_FONT_NAME, 'normal')
  const infoLines = [
    `Mã bài nộp: ${payload.submissionCode}`,
    `Tên bài: ${payload.submissionTitle}`,
    `Tác giả: ${payload.authorName}`,
    `Phương pháp: ${methodLabel(payload.method)}`,
    `Số bản ghi đã so sánh: ${payload.totalCompared}`,
    `Thời điểm kiểm tra: ${formatDateTime(payload.checkedAt)}${payload.checkerName ? ` — ${payload.checkerName}` : ''}`,
  ]
  for (const line of infoLines) {
    const wrapped = doc.splitTextToSize(line, pageWidth - leftX * 2)
    doc.text(wrapped, leftX, cursorY)
    cursorY += 6 * wrapped.length
  }

  cursorY += 2
  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(12)
  doc.text(
    `Độ tương đồng cao nhất: ${payload.score}%  (Mức: ${severityLabel(payload.score)})  —  Độ độc đáo: ${payload.originalityScore}%`,
    leftX,
    cursorY,
  )
  cursorY += 8

  // Mục I — Danh sách nguồn trùng
  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(12)
  doc.text('I. DANH SÁCH NGUỒN NGHI TRÙNG LẶP', leftX, cursorY)
  cursorY += 3

  const matchHead = [['STT', 'Nguồn nghi trùng', 'Loại', 'Tương đồng (%)', 'Trùng cụm (%)']]
  const matchBody = payload.matches.length
    ? payload.matches.map((m, idx) => {
        const phraseLine = m.matchedPhrases.length
          ? `\nCụm trùng: "${m.matchedPhrases.slice(0, 3).join('" · "')}"`
          : ''
        const sameAuthorLine = m.sameAuthor ? '\n⚠ Nghi tự đạo văn (cùng tác giả)' : ''
        return [
          String(idx + 1),
          `${m.title}${sameAuthorLine}${phraseLine}`,
          sourceTypeLabel(m.type),
          m.similarity.toFixed(1),
          m.phraseOverlap.toFixed(1),
        ]
      })
    : [[{ content: 'Không tìm thấy nguồn nào vượt ngưỡng tương đồng.', colSpan: 5 }]]

  autoTable(doc, {
    startY: cursorY + 2,
    head: matchHead,
    body: matchBody as any,
    styles: { font: PDF_FONT_NAME, fontSize: 8, cellPadding: 1.5, valign: 'middle' },
    headStyles: { font: PDF_FONT_NAME, fontStyle: 'bold', fillColor: [30, 57, 36], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  })

  let afterY = (doc as any).lastAutoTable.finalY + 8

  // Mục II — Phân tích theo nguồn
  if (afterY > pageHeight - 50) {
    doc.addPage()
    afterY = 24
  }
  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(12)
  doc.text('II. PHÂN TÍCH THEO NGUỒN', leftX, afterY)

  autoTable(doc, {
    startY: afterY + 3,
    head: [['Loại nguồn', 'Số nguồn trùng', 'Mức cao nhất (%)']],
    body: payload.sourceBreakdown.length
      ? payload.sourceBreakdown.map((s) => [sourceTypeLabel(s.type), String(s.matchCount), s.maxScore.toFixed(1)])
      : [[{ content: 'Không có dữ liệu.', colSpan: 3 }]],
    styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 2 },
    headStyles: { font: PDF_FONT_NAME, fontStyle: 'bold', fillColor: [30, 57, 36], textColor: 255 },
    columnStyles: { 1: { halign: 'center', cellWidth: 36 }, 2: { halign: 'center', cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  })

  let signY = (doc as any).lastAutoTable.finalY + 14
  if (signY > pageHeight - 40) {
    doc.addPage()
    signY = 30
  }

  // Chữ ký
  doc.setFont(PDF_FONT_NAME, 'bold')
  doc.setFontSize(11)
  doc.text('CÁN BỘ KIỂM TRA', midLeft, signY, { align: 'center' })
  doc.text('XÁC NHẬN CỦA TÒA SOẠN', midRight, signY, { align: 'center' })
  doc.setFont(PDF_FONT_NAME, 'normal')
  doc.setFontSize(10)
  doc.text('(Ký, ghi rõ họ tên)', midLeft, signY + 6, { align: 'center' })
  doc.text('(Ký, ghi rõ họ tên)', midRight, signY + 6, { align: 'center' })

  // Footer số trang + ghi chú phương pháp
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont(PDF_FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.text(`Trang ${i}/${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ── DOCX builder ───────────────────────────────────────────────────────────────

export async function buildPlagiarismReportDocx(payload: PlagiarismReportExportPayload): Promise<Buffer> {
  const docx = await import('docx')
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, HeadingLevel,
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
        new TextRun({ text: value, size: 24 }),
      ],
    })

  const cell = (text: string, opts?: { bold?: boolean; align?: any; width?: number }) =>
    new TableCell({
      width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          alignment: opts?.align,
          children: [new TextRun({ text, bold: opts?.bold, size: 20 })],
        }),
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

  const headerRow = (labels: string[]) =>
    new TableRow({
      tableHeader: true,
      children: labels.map(
        (label) =>
          new TableCell({
            shading: { fill: '1E3924' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: label, bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
      ),
    })

  // Bảng nguồn trùng
  const matchRows: InstanceType<typeof TableRow>[] = [
    headerRow(['STT', 'Nguồn nghi trùng', 'Loại', 'Tương đồng (%)', 'Trùng cụm (%)', 'Ghi chú']),
  ]
  if (payload.matches.length) {
    payload.matches.forEach((m, idx) => {
      const note =
        (m.sameAuthor ? 'Nghi tự đạo văn (cùng tác giả). ' : '') +
        (m.matchedPhrases.length ? `Cụm trùng: "${m.matchedPhrases.slice(0, 3).join('" · "')}"` : '')
      matchRows.push(
        new TableRow({
          children: [
            cell(String(idx + 1), { align: AlignmentType.CENTER, width: 6 }),
            cell(m.title, { width: 40 }),
            cell(sourceTypeLabel(m.type), { align: AlignmentType.CENTER, width: 12 }),
            cell(m.similarity.toFixed(1), { align: AlignmentType.CENTER, width: 13 }),
            cell(m.phraseOverlap.toFixed(1), { align: AlignmentType.CENTER, width: 13 }),
            cell(note || '—', { width: 16 }),
          ],
        }),
      )
    })
  } else {
    matchRows.push(
      new TableRow({
        children: [cell('Không tìm thấy nguồn nào vượt ngưỡng tương đồng.', { width: 100 })],
      }),
    )
  }

  // Bảng phân tích theo nguồn
  const breakdownRows: InstanceType<typeof TableRow>[] = [
    headerRow(['Loại nguồn', 'Số nguồn trùng', 'Mức cao nhất (%)']),
  ]
  if (payload.sourceBreakdown.length) {
    payload.sourceBreakdown.forEach((s) => {
      breakdownRows.push(
        new TableRow({
          children: [
            cell(sourceTypeLabel(s.type), { width: 50 }),
            cell(String(s.matchCount), { align: AlignmentType.CENTER, width: 25 }),
            cell(s.maxScore.toFixed(1), { align: AlignmentType.CENTER, width: 25 }),
          ],
        }),
      )
    })
  } else {
    breakdownRows.push(new TableRow({ children: [cell('Không có dữ liệu.', { width: 100 })] }))
  }

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    headerTable,
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: REPORT_TITLE, bold: true, size: 30 })],
    }),
    labelValue('Mã bài nộp:', payload.submissionCode),
    labelValue('Tên bài:', payload.submissionTitle),
    labelValue('Tác giả:', payload.authorName),
    labelValue('Phương pháp:', methodLabel(payload.method)),
    labelValue('Số bản ghi đã so sánh:', String(payload.totalCompared)),
    labelValue(
      'Thời điểm kiểm tra:',
      `${formatDateTime(payload.checkedAt)}${payload.checkerName ? ` — ${payload.checkerName}` : ''}`,
    ),
    new Paragraph({
      spacing: { before: 80, after: 120 },
      children: [
        new TextRun({
          text: `Độ tương đồng cao nhất: ${payload.score}% (Mức: ${severityLabel(payload.score)}) — Độ độc đáo: ${payload.originalityScore}%`,
          bold: true,
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: 'I. DANH SÁCH NGUỒN NGHI TRÙNG LẶP', bold: true, size: 26 })],
    }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: matchRows }),
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: 'II. PHÂN TÍCH THEO NGUỒN', bold: true, size: 26 })],
    }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: breakdownRows }),
  ]

  if (payload.notes) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: 'III. GHI CHÚ', bold: true, size: 26 })],
      }),
      new Paragraph({ children: [new TextRun({ text: payload.notes, size: 22 })] }),
    )
  }

  // Khối chữ ký
  children.push(
    new Paragraph({ text: '', spacing: { before: 240 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [centered('CÁN BỘ KIỂM TRA', { bold: true }), centered('(Ký, ghi rõ họ tên)')],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [centered('XÁC NHẬN CỦA TÒA SOẠN', { bold: true }), centered('(Ký, ghi rõ họ tên)')],
            }),
          ],
        }),
      ],
    }),
  )

  const doc = new Document({
    creator: JOURNAL_IDENTITY.nameVi,
    title: REPORT_TITLE,
    styles: { default: { document: { run: { font: 'Times New Roman' } } } },
    sections: [{ properties: {}, children }],
  })

  return Packer.toBuffer(doc)
}

/** Dựng file báo cáo đạo văn theo định dạng yêu cầu. */
export async function buildPlagiarismReportFile(
  payload: PlagiarismReportExportPayload,
  format: PlagiarismExportFormat,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (format === 'pdf') {
    return {
      buffer: await buildPlagiarismReportPdf(payload),
      contentType: 'application/pdf',
      ext: 'pdf',
    }
  }
  return {
    buffer: await buildPlagiarismReportDocx(payload),
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: 'docx',
  }
}
