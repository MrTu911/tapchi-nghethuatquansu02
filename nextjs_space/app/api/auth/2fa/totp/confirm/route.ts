export const dynamic = "force-dynamic"

/**
 * ✅ Xác nhận TOTP: verify mã 6 số đầu tiên từ app Authenticator để kích hoạt 2FA,
 * trả về backup codes (hiển thị 1 lần). Yêu cầu phiên đăng nhập đầy đủ (auth-token).
 */

import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { confirmAndEnableTotp } from '@/lib/two-factor'
import { successResponse, errorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  const requestInfo = auditLogger.extractRequestInfo(request)

  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return errorResponse('Unauthorized', 401)
    }

    const payload = verifyToken(token)
    if (!payload) {
      return errorResponse('Invalid token', 401)
    }

    const body = await request.json()
    const code = typeof body?.code === 'string' ? body.code : ''
    if (!code) {
      return errorResponse('Vui lòng nhập mã xác thực từ ứng dụng', 400)
    }

    const backupCodes = await confirmAndEnableTotp(payload.uid, code)

    await auditLogger.logSuccess(AuditEventType.USER_UPDATED, {
      userId: payload.uid,
      userEmail: payload.email,
      userRole: payload.role,
      ...requestInfo,
      details: { action: '2FA enabled', method: 'TOTP' }
    })

    return successResponse({ backupCodes }, '2FA (ứng dụng xác thực) đã được kích hoạt')
  } catch (error: any) {
    console.error('❌ TOTP confirm error:', error)
    return errorResponse(error?.message || 'Lỗi server', 400)
  }
}
