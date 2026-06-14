import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { getFileUrl } from '@/lib/local-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Require login for downloads
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để tải bài báo' },
        { status: 401 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: params.id, approvalStatus: 'APPROVED' },
      include: {
        submission: { select: { title: true } },
      },
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bài báo' },
        { status: 404 }
      )
    }

    if (!article.pdfFile) {
      return NextResponse.json(
        { success: false, error: 'Bài báo chưa có file PDF' },
        { status: 404 }
      )
    }

    // Increment download count
    await prisma.article.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.DATA_EXPORT,
      object: `Article:${article.id}`,
    })

    // Get file URL
    const fileUrl = getFileUrl(article.pdfFile, true)
    
    // Redirect to file
    return NextResponse.redirect(fileUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi tải file' },
      { status: 500 }
    )
  }
}
