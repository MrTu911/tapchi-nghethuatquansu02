import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { slugify } from '@/lib/services/journal-issue-import.service'
import { buildMetaSlug } from '@/lib/services/journal-corpus-import.service'
import { startCorpusIngest } from '@/lib/services/journal-issue-ingest.service'
import type { Corpus } from '@/types/corpus'

/**
 * POST /api/repository/ingest/import-corpus
 *
 * Số hóa số báo cũ — LUỒNG BẢN CHUẨN (tcvn3-extractor): nhận corpus.json (hoặc .zip chứa
 * corpus.json + articles_pdf/ + cover) đã trích sẵn glyph-perfect, ghi vào thư mục số báo
 * rồi chạy nền: nhập CSDL (DRAFT) → EPUB → đối chiếu trùng → xuất bản. Trả slug để UI theo dõi.
 *
 * Body: FormData {
 *   file: corpus.json | .zip,
 *   number?, year?, month?, issueCode?, isSpecial?  // tuỳ chọn — override slug; nếu trống suy từ corpus
 * }
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']
const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')
// Zip có thể chứa nhiều PDF từng bài → giới hạn rộng hơn PDF số báo đơn.
const MAX_BYTES = 200 * 1024 * 1024

function parseIntOrUndefined(value: FormDataEntryValue | null): number | undefined {
  if (value == null) return undefined
  const n = parseInt(String(value), 10)
  return Number.isFinite(n) ? n : undefined
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return errorResponse('Thiếu file corpus (.json hoặc .zip)', 400)
    if (file.size > MAX_BYTES) return errorResponse('File quá lớn (tối đa 200MB)', 400)

    const lowerName = file.name.toLowerCase()
    const isZip =
      lowerName.endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed'
    const isJson = lowerName.endsWith('.json') || file.type === 'application/json'
    if (!isZip && !isJson) return errorResponse('File phải là .json hoặc .zip', 400)

    const buffer = Buffer.from(await file.arrayBuffer())

    // Tách corpus + (nếu zip) các PDF từng bài + cover.
    let corpus: Corpus
    const articlePdfs: { name: string; data: Buffer }[] = []
    let coverData: Buffer | null = null

    if (isZip) {
      const zip = await JSZip.loadAsync(buffer)
      const entries = Object.values(zip.files).filter((e) => !e.dir)
      const corpusEntry = entries.find((e) => /(^|\/)corpus\.json$/i.test(e.name))
      if (!corpusEntry) return errorResponse('Trong .zip không tìm thấy corpus.json', 400)
      corpus = JSON.parse(await corpusEntry.async('string')) as Corpus

      for (const entry of entries) {
        const pdfMatch = entry.name.match(/(?:^|\/)articles_pdf\/([^/]+\.pdf)$/i)
        if (pdfMatch) {
          articlePdfs.push({ name: pdfMatch[1], data: await entry.async('nodebuffer') })
        } else if (!coverData && /(?:^|\/)cover\.(jpe?g|png|webp)$/i.test(entry.name)) {
          coverData = await entry.async('nodebuffer')
        }
      }
    } else {
      corpus = JSON.parse(buffer.toString('utf-8')) as Corpus
    }

    if (!corpus || !Array.isArray(corpus.articles) || corpus.articles.length === 0) {
      return errorResponse('corpus.json không hợp lệ (thiếu mảng "articles")', 400)
    }

    // Suy slug: ưu tiên meta biên tập viên nhập, rồi slug/tên trong corpus.
    const metaSlug = buildMetaSlug({
      number: parseIntOrUndefined(formData.get('number')),
      year: parseIntOrUndefined(formData.get('year')),
      issueCode: parseIntOrUndefined(formData.get('issueCode')),
      isSpecial: formData.get('isSpecial') === 'true',
    })
    const slug =
      metaSlug ??
      (corpus.issue?.slug ? slugify(corpus.issue.slug) : slugify(corpus.issue?.name ?? `so-${Date.now()}`))

    // Ghi corpus + PDF từng bài + cover vào thư mục số báo (Thư viện số phục vụ trực tiếp).
    const outDir = path.join(ISSUES_DATA_DIR, slug)
    await fs.mkdir(outDir, { recursive: true })
    await fs.writeFile(path.join(outDir, 'corpus.json'), JSON.stringify(corpus), 'utf-8')

    if (articlePdfs.length > 0) {
      const pdfDir = path.join(outDir, 'articles_pdf')
      await fs.mkdir(pdfDir, { recursive: true })
      for (const pdf of articlePdfs) {
        // basename: chống path traversal từ tên entry trong zip.
        await fs.writeFile(path.join(pdfDir, path.basename(pdf.name)), pdf.data)
      }
    }
    if (coverData) {
      await fs.writeFile(path.join(outDir, 'cover.jpg'), coverData)
    }

    await logAudit({
      actorId: session.uid,
      action: 'JOURNAL_ISSUE_INGEST',
      object: `Issue:${slug}`,
      after: { slug, source: 'corpus', totalArticles: corpus.articles.length, articlePdfs: articlePdfs.length },
    })

    // Ghi status khởi tạo + chạy nền pipeline (import → epub → dedup → publish).
    await startCorpusIngest(slug, corpus.articles.length)

    return successResponse(
      { slug, totalArticles: corpus.articles.length, issueName: corpus.issue?.name ?? slug },
      'Đã bắt đầu nhập bản chuẩn',
      202,
    )
  } catch (error) {
    console.error('[ingest.import-corpus] error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Lỗi khi nhập corpus', 500)
  }
}
