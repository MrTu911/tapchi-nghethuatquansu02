import { NextRequest, NextResponse } from 'next/server'
import { JournalClassification } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string; articleId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { articleId } = await params
    const existing = await prisma.journalArticle.findUnique({ where: { id: articleId } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    type PatchBody = { title?: string; sectionId?: string | null; authorsText?: string; pageStart?: number; pageEnd?: number | null; abstract?: string | null; keywords?: string[]; status?: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'; journalType?: JournalClassification; journalNameOverride?: string | null; contentText?: string }
    const body = await request.json() as PatchBody

    if (body.status === 'PUBLISHED' && !existing.thumbnailUrl) {
      return NextResponse.json(
        { success: false, error: 'Bài báo chưa có ảnh đại diện (thumbnail). Vui lòng chạy script tách PDF trước khi xuất bản.' },
        { status: 422 },
      )
    }

    const updated = await prisma.journalArticle.update({
      where: { id: articleId },
      data: {
        ...(body.title       !== undefined ? { title:      body.title }       : {}),
        ...(body.sectionId   !== undefined ? { sectionId:  body.sectionId }   : {}),
        ...(body.authorsText !== undefined ? { authorsText: body.authorsText } : {}),
        ...(body.pageStart   !== undefined ? { pageStart:  body.pageStart }   : {}),
        ...(body.pageEnd     !== undefined ? { pageEnd:    body.pageEnd }     : {}),
        ...(body.abstract    !== undefined ? { abstract:   body.abstract }    : {}),
        ...(body.keywords    !== undefined ? { keywords:   body.keywords }    : {}),
        ...(body.status      !== undefined ? { status:     body.status }      : {}),
        ...(body.journalType !== undefined ? { journalType: body.journalType } : {}),
        ...(body.journalNameOverride !== undefined ? { journalNameOverride: body.journalNameOverride } : {}),
        // Biên tập viên sửa toàn văn ở bước review số hóa → nguồn manual-edit; rebuild corpus/EPUB dùng lại.
        ...(body.contentText !== undefined ? { contentText: body.contentText, contentSource: 'manual-edit', extractionStatus: 'DONE' } : {}),
      },
      include: { authors: true, section: { select: { id: true, name: true } } },
    })

    // Nếu sửa chuỗi tác giả → dựng lại danh sách tác giả structured (best-effort, tên tách theo ';' hoặc ',').
    if (body.authorsText !== undefined) {
      const names = body.authorsText.split(/[;\n]|,(?=\s*(?:Đại|Thượng|Trung|Thiếu|GS|PGS|TS|ThS|CN)\b)/)
        .map((s) => s.trim()).filter(Boolean)
      await prisma.journalArticleAuthor.deleteMany({ where: { articleId } })
      for (let i = 0; i < names.length; i++) {
        await prisma.journalArticleAuthor.create({ data: { articleId, name: names[i], order: i } })
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('journal-articles PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi cập nhật bài viết' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { articleId } = await params
    const existing = await prisma.journalArticle.findUnique({ where: { id: articleId } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    // Cascade delete removes JournalArticleAuthor automatically (onDelete: Cascade)
    await prisma.journalArticle.delete({ where: { id: articleId } })

    return NextResponse.json({ success: true, data: { id: articleId } })
  } catch (error) {
    console.error('journal-articles DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi xoá bài viết' }, { status: 500 })
  }
}
