export const dynamic = 'force-dynamic'

/**
 * Nhận xét/annotation biên tập theo TRANG trên bản thảo của một bài nộp.
 *
 * Đây là trao đổi NỘI BỘ trong quá trình phản biện/biên tập (khác ArticleComment —
 * bình luận công khai trên bài đã xuất bản). Lưu thật vào model SubmissionComment.
 *
 * RBAC: chỉ vai trò biên tập (quyết định/dàn trang) và phản biện viên ĐƯỢC GÁN cho
 * bài này mới xem/ghi được. CỐ Ý loại trừ tác giả để không lộ annotation nội bộ và
 * định danh phản biện.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can, type Role } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { canEditorAccessSubmission } from '@/lib/editor-scope'

const MAX_CONTENT_LENGTH = 2000

/** Vai trò biên tập được phép xem/ghi nhận xét nội bộ trên bản thảo. */
function isEditorialRole(role: string): boolean {
  return can.decide(role as Role) || role === 'LAYOUT_EDITOR' || role === 'SECURITY_AUDITOR'
}

/** Tải bài + xác định quyền truy cập nhận xét nội bộ của người dùng hiện tại. */
async function resolveAccess(submissionId: string, uid: string, role: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, createdBy: true, assignedEditorId: true, reviews: { select: { reviewerId: true } } },
  })
  if (!submission) return { found: false as const, allowed: false }
  const isAssignedReviewer = submission.reviews.some((r) => r.reviewerId === uid)
  // Vai trò biên tập phải nằm trong phạm vi phụ trách (BTV chuyên mục chỉ bài của mình).
  const isScopedEditor = isEditorialRole(role) && canEditorAccessSubmission(role, uid, submission.assignedEditorId)
  const allowed = isScopedEditor || isAssignedReviewer
  return { found: true as const, allowed }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const access = await resolveAccess(params.id, session.uid, session.role)
    if (!access.found) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài nộp' }, { status: 404 })
    }
    if (!access.allowed) {
      return NextResponse.json({ success: false, error: 'Không có quyền xem nhận xét' }, { status: 403 })
    }

    const comments = await prisma.submissionComment.findMany({
      where: { submissionId: params.id },
      include: { author: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        pageNumber: c.pageNumber,
        content: c.content,
        author: c.author.fullName,
        resolved: c.resolved,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error({ context: 'SUBMISSION_COMMENTS_GET', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const body = await req.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const pageNumberRaw = Number(body.pageNumber)
    const pageNumber = Number.isInteger(pageNumberRaw) && pageNumberRaw >= 1 ? pageNumberRaw : 1

    if (!content) {
      return NextResponse.json({ success: false, error: 'Nội dung nhận xét không được để trống' }, { status: 400 })
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Nhận xét quá dài (tối đa ${MAX_CONTENT_LENGTH} ký tự)` },
        { status: 400 },
      )
    }

    const access = await resolveAccess(params.id, session.uid, session.role)
    if (!access.found) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài nộp' }, { status: 404 })
    }
    if (!access.allowed) {
      return NextResponse.json({ success: false, error: 'Không có quyền thêm nhận xét' }, { status: 403 })
    }

    const created = await prisma.submissionComment.create({
      data: { submissionId: params.id, authorId: session.uid, pageNumber, content },
      include: { author: { select: { fullName: true } } },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        pageNumber: created.pageNumber,
        content: created.content,
        author: created.author.fullName,
        resolved: created.resolved,
        createdAt: created.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error({ context: 'SUBMISSION_COMMENTS_POST', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra' }, { status: 500 })
  }
}
