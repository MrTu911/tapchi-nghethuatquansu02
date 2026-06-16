import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile } from '@/lib/local-storage'

const MANAGE_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

/**
 * GET: nạp dữ liệu một bài báo qua phản biện (model `Article`) để chỉnh sửa.
 *
 * Bài kho số (`JournalArticle`, sourceType JOURNAL_IMPORT) KHÔNG thuộc model này
 * nên sẽ trả 404 — đúng chủ đích: corpus import là dữ liệu chỉ-đọc, không sửa qua
 * CRUD repository. Nút "Sửa" ở UI cũng chỉ hiển thị cho bài PEER_REVIEW.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!MANAGE_ROLES.includes((session as any).role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        submission: {
          include: {
            author: { select: { fullName: true, org: true } },
            category: { select: { id: true } },
          },
        },
      },
    })

    if (!article) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài báo' }, { status: 404 })
    }

    const keywords = Array.isArray(article.submission.keywords)
      ? (article.submission.keywords as string[])
      : []

    return NextResponse.json({
      success: true,
      data: {
        id: article.id,
        title: article.submission.title,
        authorName: article.submission.author.fullName,
        authorOrg: article.submission.author.org ?? '',
        categoryId: article.submission.category?.id ?? '',
        issueId: article.issueId ?? '',
        abstractVn: article.submission.abstractVn ?? '',
        abstractEn: article.submission.abstractEn ?? '',
        keywords: keywords.join(', '),
        doi: article.doiLocal ?? '',
        pages: article.pages ?? '',
        pdfFile: article.pdfFile ?? null,
      },
    })
  } catch (error) {
    console.error('Load repository article error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải bài báo' }, { status: 500 })
  }
}

/**
 * PATCH: cập nhật metadata bài báo (Submission + Article). Nhận multipart/form-data
 * để cho phép thay file PDF (giống luồng create). Khi đổi tên tác giả dùng
 * find-or-create theo họ tên để KHÔNG đổi tên User đang dùng chung với bài khác.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!MANAGE_ROLES.includes((session as any).role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.article.findUnique({
      where: { id: params.id },
      include: { submission: { include: { author: { select: { id: true, fullName: true } } } } },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài báo' }, { status: 404 })
    }

    const formData = await req.formData()
    const title = ((formData.get('title') as string) || '').trim()
    const authorName = ((formData.get('authorName') as string) || '').trim()
    const authorOrg = ((formData.get('authorOrg') as string) || '').trim()
    const categoryId = (formData.get('categoryId') as string) || ''
    const issueId = (formData.get('issueId') as string) || ''
    const abstractVn = (formData.get('abstractVn') as string) || ''
    const abstractEn = (formData.get('abstractEn') as string) || ''
    const keywords = (formData.get('keywords') as string) || ''
    const doi = (formData.get('doi') as string) || ''
    const pages = (formData.get('pages') as string) || ''
    const pdfFile = formData.get('pdf') as File | null

    if (!title || !authorName) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tiêu đề hoặc tác giả' },
        { status: 400 },
      )
    }

    // Đổi tác giả chỉ khi tên khác hiện tại; find-or-create để tránh rename User chia sẻ.
    let authorId = existing.submission.author.id
    if (authorName !== existing.submission.author.fullName) {
      let author = await prisma.user.findFirst({ where: { fullName: authorName, role: 'AUTHOR' } })
      if (!author) {
        author = await prisma.user.create({
          data: {
            email: `imported_${Date.now()}@placeholder.local`,
            passwordHash: 'IMPORTED_NO_LOGIN',
            fullName: authorName,
            org: authorOrg || null,
            role: 'AUTHOR',
            isActive: true,
          },
        })
      }
      authorId = author.id
    }

    // Giữ PDF cũ nếu không upload file mới.
    let pdfPath = existing.pdfFile
    if (pdfFile && pdfFile.size > 0) {
      const result = await saveFile(pdfFile, 'manuscript')
      pdfPath = result.filePath
    }

    const keywordArray = keywords
      ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : []

    await prisma.submission.update({
      where: { id: existing.submissionId },
      data: {
        title,
        abstractVn: abstractVn || null,
        abstractEn: abstractEn || null,
        keywords: keywordArray,
        author: { connect: { id: authorId } },
        // categoryId rỗng → giữ nguyên chuyên mục hiện tại (không vô tình gỡ).
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
    })

    await prisma.article.update({
      where: { id: params.id },
      data: {
        issueId: issueId || null,
        doiLocal: doi || null,
        pages: pages || null,
        pdfFile: pdfPath,
      },
    })

    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ARTICLE_UPDATED,
      object: `Article:${params.id}`,
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id, message: 'Cập nhật bài báo thành công' },
    })
  } catch (error) {
    console.error('Update repository article error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi cập nhật bài báo' }, { status: 500 })
  }
}
