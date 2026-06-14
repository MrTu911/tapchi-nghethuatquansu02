import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { saveFile } from '@/lib/local-storage'
import {
  listHistoricalArticles,
  createHistoricalArticle,
} from '@/lib/services/press-archive.service'

const MANAGE_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

const authorSchema = z.object({
  name: z.string().min(1),
  militaryRank: z.string().optional(),
  academicTitle: z.string().optional(),
  degree: z.string().optional(),
  organization: z.string().optional(),
  order: z.number().int().min(0),
})

const createSchema = z.object({
  issueId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  authorsText: z.string().min(1, 'Thông tin tác giả không được để trống'),
  authors: z.array(authorSchema).min(1, 'Cần ít nhất một tác giả'),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  pageStart: z.number().int().min(1),
  pageEnd: z.number().int().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})

/**
 * GET /api/repository/press-archive
 * Danh sách bài báo lịch sử (JournalArticle), có filter & phân trang
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || undefined
    const year = searchParams.get('year') || undefined
    const issueId = searchParams.get('issueId') || undefined
    const sectionId = searchParams.get('sectionId') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)

    const result = await listHistoricalArticles({ keyword, year, issueId, sectionId, status, page, pageSize })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('GET /api/repository/press-archive error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách' }, { status: 500 })
  }
}

/**
 * POST /api/repository/press-archive
 * Tạo bài báo lịch sử mới (multipart/form-data vì có upload PDF)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!MANAGE_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const rawJson = formData.get('data') as string

    if (!rawJson) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu bài báo' }, { status: 400 })
    }

    const parsed = createSchema.safeParse(JSON.parse(rawJson))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const input = parsed.data

    // Upload PDF nếu có
    let articlePdfUrl: string | undefined
    const pdfFile = formData.get('pdf') as File | null
    if (pdfFile && pdfFile.size > 0) {
      const saved = await saveFile(pdfFile, 'manuscript')
      articlePdfUrl = saved.filePath
    }

    const article = await createHistoricalArticle(
      { ...input, articlePdfUrl },
      session.uid,
    )

    return NextResponse.json({ success: true, data: { id: article.id } }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/repository/press-archive error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Lỗi tạo bài báo' }, { status: 500 })
  }
}
