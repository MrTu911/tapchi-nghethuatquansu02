import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { checkDuplicates } from '@/lib/services/duplicate-detector.service'

const checkSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  abstractVn: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})

/**
 * POST /api/repository/duplicate-check
 * Kiểm tra trùng lặp với CSDL báo chí — mọi tài khoản đã đăng nhập
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = checkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await checkDuplicates(parsed.data)

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('POST /api/repository/duplicate-check error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Lỗi kiểm tra' }, { status: 500 })
  }
}
