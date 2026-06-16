import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { saveFile } from '@/lib/local-storage'
import { generateSubmissionCode } from '@/lib/submission-code-generator'

/**
 * Create a new article manually (for external/imported articles)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).role
    if (!['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const title = formData.get('title') as string
    const authorName = formData.get('authorName') as string
    const authorOrg = formData.get('authorOrg') as string
    const categoryId = formData.get('categoryId') as string
    const issueId = formData.get('issueId') as string
    const abstractVn = formData.get('abstractVn') as string
    const abstractEn = formData.get('abstractEn') as string
    const keywords = formData.get('keywords') as string
    const doi = formData.get('doi') as string
    const pages = formData.get('pages') as string
    const pdfFile = formData.get('pdf') as File | null

    if (!title || !authorName) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tiêu đề hoặc tác giả' },
        { status: 400 }
      )
    }

    // Find or create a system author for imported articles
    let author = await prisma.user.findFirst({
      where: { fullName: authorName, role: 'AUTHOR' }
    })

    if (!author) {
      // Create a placeholder author
      author = await prisma.user.create({
        data: {
          email: `imported_${Date.now()}@placeholder.local`,
          passwordHash: 'IMPORTED_NO_LOGIN',
          fullName: authorName,
          org: authorOrg || null,
          role: 'AUTHOR',
          isActive: true,
        }
      })
    }

    // Upload PDF if provided
    let pdfPath: string | null = null
    if (pdfFile && pdfFile.size > 0) {
      const result = await saveFile(pdfFile, 'manuscript')
      pdfPath = result.filePath
    }

    // Parse keywords
    const keywordArray = keywords 
      ? keywords.split(',').map(k => k.trim()).filter(Boolean)
      : []

    // Sinh mã bài báo qua generator chuẩn (NTQS-YYYYMMDD-NNN)
    const code = await generateSubmissionCode()

    // Create submission first
    const submission = await prisma.submission.create({
      data: {
        code,
        author: { connect: { id: author.id } },
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        title,
        abstractVn: abstractVn || null,
        abstractEn: abstractEn || null,
        keywords: keywordArray,
        status: 'ACCEPTED',
        securityLevel: 'PUBLIC',
      }
    })

    // Create article
    const article = await prisma.article.create({
      data: {
        submissionId: submission.id,
        issueId: issueId || null,
        pdfFile: pdfPath,
        doiLocal: doi || null,
        pages: pages || null,
        approvalStatus: 'APPROVED',
        publishedAt: new Date(),
        approvedBy: session.uid,
        approvedAt: new Date(),
      }
    })

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ARTICLE_PUBLISHED,
      object: `Article:${article.id}`,
    })

    return NextResponse.json({
      success: true,
      data: { id: article.id, message: 'Thêm bài báo thành công' }
    })
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tạo bài báo' }, { status: 500 })
  }
}
