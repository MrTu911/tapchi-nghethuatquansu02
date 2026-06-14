

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, issueAuthSession, signPreAuthToken, setPreAuthCookie } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { loginSchema, sanitizeEmail } from '@/lib/validation'
import { checkBruteForce } from '@/lib/security-monitor'
import { has2FAEnabled, get2FAConfig, createOTPToken, sendOTPEmail, TwoFactorMethod } from '@/lib/two-factor'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const requestInfo = auditLogger.extractRequestInfo(request)

  try {
    // Validate input with enhanced security
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Validation error',
        {
          userEmail: body.email,
          ...requestInfo,
          details: { errors }
        }
      )
      
      return validationErrorResponse(errors, 'Dữ liệu không hợp lệ')
    }

    const { email, password } = validation.data

    // ✅ Check brute force attempts (both email and IP)
    const emailBruteForce = await checkBruteForce(email, 'email')
    const ipBruteForce = await checkBruteForce(requestInfo.ipAddress, 'ip')

    if (emailBruteForce.blocked || ipBruteForce.blocked) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Brute force protection triggered',
        {
          userEmail: email,
          ...requestInfo,
          details: {
            emailAttempts: emailBruteForce.attempts,
            ipAttempts: ipBruteForce.attempts
          }
        }
      )
      
      return errorResponse(
        'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        429
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'User không tồn tại',
        {
          userEmail: email,
          ...requestInfo
        }
      )
      return errorResponse('Email hoặc mật khẩu không đúng', 401)
    }

    // Check account status
    if ((user as any).status === 'PENDING') {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đang chờ phê duyệt',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản của bạn đang chờ Ban biên tập phê duyệt. Vui lòng kiên nhẫn chờ đợi.', 403)
    }

    if ((user as any).status === 'REJECTED') {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đã bị từ chối',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản của bạn đã bị từ chối. Vui lòng liên hệ Ban biên tập để biết thêm chi tiết.', 403)
    }

    if (!user.isActive) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đã bị tạm khóa',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.', 403)
    }

    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Mật khẩu không đúng',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Email hoặc mật khẩu không đúng', 401)
    }

    const tokenPayload = {
      uid: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    }

    // ✅ Bảo mật 2 lớp: nếu user đã bật 2FA, KHÔNG cấp phiên đầy đủ ở đây.
    // Chỉ cấp pre-auth token (sống ngắn) và yêu cầu bước nhập mã lớp 2.
    if (await has2FAEnabled(user.id)) {
      const config = await get2FAConfig(user.id)

      // Với Email OTP: gửi mã ngay. Với TOTP: người dùng tự đọc mã từ app.
      if (config?.method === TwoFactorMethod.EMAIL_OTP) {
        const otp = await createOTPToken(user.id)
        await sendOTPEmail(user.email, otp, user.fullName)
      }

      // Mật khẩu đúng nhưng CHƯA qua lớp 2 — chỉ log app-level, KHÔNG phát audit
      // LOGIN_SUCCESS (sự kiện đó chỉ phát khi đã xác thực đủ 2 lớp ở /api/auth/2fa/login-verify).
      logger.info({
        message: '2FA challenge issued after password verification',
        userId: user.id,
        method: config?.method
      })

      const pendingToken = signPreAuthToken(tokenPayload)
      const pendingResponse = successResponse(
        { requires2FA: true, method: config?.method ?? null },
        'Cần xác thực 2 lớp'
      )
      return setPreAuthCookie(pendingResponse, pendingToken)
    }

    // ✅ Không bật 2FA: cấp phiên đầy đủ như cũ
    await auditLogger.logSuccess(
      AuditEventType.LOGIN_SUCCESS,
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ...requestInfo,
        details: { org: user.org }
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

    return issueAuthSession(response, user)
  } catch (error) {
    console.error('❌ Login error:', error)
    
    await auditLogger.logFailure(
      AuditEventType.LOGIN_FAILED,
      'Server error',
      {
        ...requestInfo,
        details: { error: String(error) }
      }
    )
    
    return errorResponse('Lỗi server')
  }
}

