export const dynamic = "force-dynamic"

/**
 * ✅ Bảo mật 2 lớp: gửi lại mã OTP qua email trong bước đăng nhập.
 * Chỉ dùng cho phương thức EMAIL_OTP và chỉ chấp nhận pre-auth token (cookie 2fa-pending).
 * Tự hưởng rate-limit "auth-otp" (5 lần/10 phút/IP) ở middleware.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPreAuthToken, TWO_FACTOR_PENDING_COOKIE } from '@/lib/auth'
import { get2FAConfig, createOTPToken, sendOTPEmail, TwoFactorMethod } from '@/lib/two-factor'
import { successResponse, errorResponse } from '@/lib/responses'

export async function POST(request: NextRequest) {
  try {
    const pendingToken = request.cookies.get(TWO_FACTOR_PENDING_COOKIE)?.value
    if (!pendingToken) {
      return errorResponse('Phiên xác thực 2 lớp không tồn tại. Vui lòng đăng nhập lại.', 401)
    }

    const payload = verifyPreAuthToken(pendingToken)
    if (!payload) {
      return errorResponse('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.', 401)
    }

    const config = await get2FAConfig(payload.uid)
    if (!config?.isEnabled || config.method !== TwoFactorMethod.EMAIL_OTP) {
      return errorResponse('Phương thức xác thực không hỗ trợ gửi lại mã', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: payload.uid } })
    if (!user || !user.isActive) {
      return errorResponse('Tài khoản không hợp lệ', 403)
    }

    const otp = await createOTPToken(user.id)
    await sendOTPEmail(user.email, otp, user.fullName)

    return successResponse({ sent: true }, 'Mã OTP đã được gửi đến email của bạn')
  } catch (error) {
    console.error('❌ 2FA login-resend error:', error)
    return errorResponse('Lỗi server')
  }
}
