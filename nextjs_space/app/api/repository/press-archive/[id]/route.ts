import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { JournalClassification } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { saveFile } from '@/lib/local-storage'
import {
  getHistoricalArticle,
  updateHistoricalArticle,
  withdrawHistoricalArticle,
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

const updateSchema = z.object({
  sectionId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  authorsText: z.string().optional(),
  authors: z.array(authorSchema).optional(),
  abstract: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'WITHDRAWN']).optional(),
  journalType: z.nativeEnum(JournalClassification).optional(),
  journalNameOverride: z.string().nullable().optional(),
  clearPdf: z.boolean().optional(), // Xoá file PDF hiện tại
})

/**
 * GET /api/repository/press-archive/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const article = await getHistoricalArticle(params.id)
    if (!article) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài báo' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('GET /api/repository/press-archive/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải bài báo' }, { status: 500 })
  }
}

/**
 * PATCH /api/repository/press-archive/[id]
 * Cập nhật metadata bài báo lịch sử (multipart/form-data)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!MANAGE_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await getHistoricalArticle(params.id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài báo' }, { status: 404 })
    }

    const formData = await req.formData()
    const rawJson = formData.get('data') as string

    if (!rawJson) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu cập nhật' }, { status: 400 })
    }

    const parsed = updateSchema.safeParse(JSON.parse(rawJson))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const input = parsed.data

    let articlePdfUrl: string | null | undefined = undefined
    const pdfFile = formData.get('pdf') as File | null
    if (pdfFile && pdfFile.size > 0) {
      const saved = await saveFile(pdfFile, 'manuscript')
      articlePdfUrl = saved.filePath
    } else if (input.clearPdf) {
      articlePdfUrl = null
    }

    const { clearPdf, ...updatePayload } = input
    const article = await updateHistoricalArticle(
      params.id,
      { ...updatePayload, ...(articlePdfUrl !== undefined ? { articlePdfUrl } : {}) },
      session.uid,
    )

    return NextResponse.json({ success: true, data: { id: article.id } })
  } catch (error: any) {
    console.error('PATCH /api/repository/press-archive/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Lỗi cập nhật' }, { status: 500 })
  }
}

/**
 * DELETE /api/repository/press-archive/[id]
 * Soft delete — set status = WITHDRAWN
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!MANAGE_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await getHistoricalArticle(params.id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài báo' }, { status: 404 })
    }

    await withdrawHistoricalArticle(params.id, session.uid)

    return NextResponse.json({ success: true, data: { message: 'Đã thu hồi bài báo' } })
  } catch (error: any) {
    console.error('DELETE /api/repository/press-archive/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Lỗi thu hồi' }, { status: 500 })
  }
}
