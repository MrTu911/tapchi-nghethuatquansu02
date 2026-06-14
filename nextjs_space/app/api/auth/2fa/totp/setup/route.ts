export const dynamic = "force-dynamic"

/**
 * ✅ Thiết lập TOTP (Authenticator app): sinh secret + QR ở trạng thái pending.
 * Yêu cầu phiên đăng nhập đầy đủ (auth-token) — chỉ user đã đăng nhập mới được bật 2FA cho chính mình.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { setupTotp } from '@/lib/two-factor'
import { successResponse, errorResponse } from '@/lib/responses'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return errorResponse('Unauthorized', 401)
    }

    const payload = verifyToken(token)
    if (!payload) {
      return errorResponse('Invalid token', 401)
    }

    const user = await prisma.user.findUnique({ where: { id: payload.uid } })
    if (!user) {
      return errorResponse('User not found', 404)
    }

    const { secret, qrDataUrl } = await setupTotp(user.id, user.email)
    return successResponse({ secret, qrDataUrl }, 'Đã tạo mã thiết lập TOTP')
  } catch (error: any) {
    console.error('❌ TOTP setup error:', error)
    return errorResponse(error?.message || 'Lỗi server', 400)
  }
}
