export const dynamic = "force-dynamic"

/**
 * ✅ Bảo mật 2 lớp: hoàn tất bước nhập mã lớp 2 khi đăng nhập.
 * Đọc pre-auth token (cookie 2fa-pending) do bước login cấp, xác thực mã OTP/TOTP/backup,
 * nếu đúng thì cấp phiên đăng nhập đầy đủ.
 *
 * Route nằm dưới /api/auth/2fa/* nên tự hưởng rate-limit "auth-otp" (5 lần/10 phút/IP) ở middleware.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyPreAuthToken,
  issueAuthSession,
  clearPreAuthCookie,
  TWO_FACTOR_PENDING_COOKIE,
} from '@/lib/auth'
import { verifyTwoFactorForLogin } from '@/lib/two-factor'
import { successResponse, errorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  const requestInfo = auditLogger.extractRequestInfo(request)

  try {
    const pendingToken = request.cookies.get(TWO_FACTOR_PENDING_COOKIE)?.value
    if (!pendingToken) {
      return errorResponse('Phiên xác thực 2 lớp không tồn tại. Vui lòng đăng nhập lại.', 401)
    }

    const payload = verifyPreAuthToken(pendingToken)
    if (!payload) {
      return errorResponse('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.', 401)
    }

    const body = await request.json()
    const code = typeof body?.code === 'string' ? body.code : ''
    if (!code) {
      return errorResponse('Vui lòng nhập mã xác thực', 400)
    }

    // User phải còn tồn tại và còn active
    const user = await prisma.user.findUnique({ where: { id: payload.uid } })
    if (!user || !user.isActive) {
      return errorResponse('Tài khoản không hợp lệ hoặc đã bị khóa', 403)
    }

    const result = await verifyTwoFactorForLogin(user.id, code)

    if (!result.ok) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Mã xác thực 2 lớp không hợp lệ',
        {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          ...requestInfo,
          details: { stage: '2fa_verify' }
        }
      )
      return errorResponse('Mã xác thực không đúng hoặc đã hết hạn', 401)
    }

    // ✅ Qua đủ 2 lớp — cấp phiên đầy đủ
    await auditLogger.logSuccess(
      AuditEventType.LOGIN_SUCCESS,
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ...requestInfo,
        details: { stage: '2fa_passed', via: result.via }
      }
    )

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role
      }
    }, 'Đăng nhập thành công')

    issueAuthSession(response, user)
    clearPreAuthCookie(response)
    return response
  } catch (error) {
    console.error('❌ 2FA login-verify error:', error)
    await auditLogger.logFailure(
      AuditEventType.LOGIN_FAILED,
      'Server error (2FA verify)',
      { ...requestInfo, details: { error: String(error) } }
    )
    return errorResponse('Lỗi server')
  }
}
