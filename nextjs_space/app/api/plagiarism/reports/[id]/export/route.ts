/**
 * GET /api/plagiarism/reports/[id]/export?format=pdf|docx
 * Xuất báo cáo kiểm tra đạo văn của MỘT bản ghi PlagiarismReport ra file (PDF / DOCX).
 *
 * runtime=nodejs vì cần fs (font PDF) + thư viện docx/jspdf chạy server.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/responses'
import { createAuditLog, AuditEventType } from '@/lib/audit-logger'
import {
  buildPlagiarismReportFile,
  type PlagiarismExportFormat,
  type PlagiarismExportMatch,
  type PlagiarismReportExportPayload,
} from '@/lib/services/plagiarism-report-export.service'

const ALLOWED_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN']

const round1 = (value: number): number => Math.round(value * 10) / 10

/** Chuẩn hóa mảng matches JSON (chống dữ liệu cũ khác shape). */
function normalizeMatches(raw: unknown): PlagiarismExportMatch[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m: any) => ({
    title: typeof m?.title === 'string' ? m.title : 'Không rõ',
    type: typeof m?.type === 'string' ? m.type : 'submission',
    similarity: Number(m?.similarity ?? 0),
    phraseOverlap: Number(m?.phraseOverlap ?? 0),
    sameAuthor: Boolean(m?.sameAuthor),
    matchedPhrases: Array.isArray(m?.matchedPhrases) ? m.matchedPhrases.filter((p: unknown) => typeof p === 'string') : [],
  }))
}

function buildSourceBreakdown(matches: PlagiarismExportMatch[]) {
  const map = new Map<string, { matchCount: number; maxScore: number }>()
  for (const m of matches) {
    const severity = Math.max(m.similarity, m.phraseOverlap)
    const entry = map.get(m.type) ?? { matchCount: 0, maxScore: 0 }
    entry.matchCount += 1
    entry.maxScore = Math.max(entry.maxScore, severity)
    map.set(m.type, entry)
  }
  return [...map.entries()].map(([type, entry]) => ({
    type,
    matchCount: entry.matchCount,
    maxScore: round1(entry.maxScore),
  }))
}

function sanitizeForFileName(value: string): string {
  return (value || 'bao-cao')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'bao-cao'
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401)
    }
    if (!ALLOWED_ROLES.includes(session.role)) {
      return errorResponse('Không có quyền xuất báo cáo', 403)
    }

    const formatParam = (new URL(req.url).searchParams.get('format') || 'pdf').toLowerCase()
    const format: PlagiarismExportFormat = formatParam === 'docx' ? 'docx' : 'pdf'

    const report = await prisma.plagiarismReport.findUnique({
      where: { id: params.id },
      include: {
        checker: { select: { fullName: true } },
        submission: { select: { code: true, title: true, author: { select: { fullName: true } } } },
        article: {
          select: {
            submission: { select: { code: true, title: true, author: { select: { fullName: true } } } },
          },
        },
      },
    })

    if (!report) {
      return errorResponse('Không tìm thấy báo cáo', 404)
    }

    const linkedSubmission = report.submission ?? report.article?.submission ?? null
    const matches = normalizeMatches(report.matches)

    const payload: PlagiarismReportExportPayload = {
      submissionCode: linkedSubmission?.code ?? '—',
      submissionTitle: linkedSubmission?.title ?? '(Không rõ tiêu đề)',
      authorName: linkedSubmission?.author?.fullName ?? '—',
      score: round1(report.score),
      originalityScore: round1(Math.max(0, 100 - report.score)),
      method: report.method,
      totalCompared: report.totalCompared,
      checkedAt: report.checkedAt,
      checkerName: report.checker?.fullName ?? undefined,
      notes: report.notes,
      matches,
      sourceBreakdown: buildSourceBreakdown(matches),
      generatedAt: new Date(),
    }

    const { buffer, contentType, ext } = await buildPlagiarismReportFile(payload, format)

    await createAuditLog({
      userId: session.uid,
      action: AuditEventType.DATA_EXPORT,
      entity: 'PlagiarismReport',
      entityId: report.id,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      metadata: { format, score: report.score, matchCount: matches.length },
    })

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const fileName = `bao-cao-dao-van-${sanitizeForFileName(payload.submissionCode)}-${stamp}.${ext}`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[plagiarism/reports/[id]/export] error:', error)
    return errorResponse('Lỗi khi xuất báo cáo đạo văn', 500)
  }
}
