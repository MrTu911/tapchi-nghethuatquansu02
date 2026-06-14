/**
 * POST /api/plagiarism/check-pdf
 * Nhận file PDF upload, extract text, kiểm tra đạo văn với toàn bộ CSDL.
 * Không lưu vào DB — chỉ trả kết quả tức thì.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { extractPdfText } from '@/lib/pdf-metadata'
import { checkTextPlagiarism } from '@/lib/plagiarism'

const ALLOWED_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN']
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const method = (formData.get('method') as string) || 'cosine'

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'Chỉ chấp nhận file PDF' }, { status: 400 })
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ success: false, error: 'File quá lớn (tối đa 20MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extractedText = await extractPdfText(buffer)

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Không thể extract text từ PDF. File có thể bị scan dạng ảnh hoặc bị mã hóa.',
      }, { status: 422 })
    }

    const result = await checkTextPlagiarism(
      extractedText,
      method as 'cosine' | 'jaccard'
    )

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        extractedLength: extractedText.trim().length,
        score: result.score,
        averageScore: result.averageScore,
        totalCompared: result.totalCompared,
        matchCount: result.matches.length,
        matches: result.matches,
        method: result.method,
        checkedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('POST /api/plagiarism/check-pdf error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi kiểm tra PDF' },
      { status: 500 }
    )
  }
}
