

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { prisma } from './prisma'
import { auditLogger, AuditEventType } from './audit-logger'

export interface JWTPayload {
  uid: string
  role: string
  email: string
  fullName: string
  // ✅ Phân biệt loại token: access (phiên đầy đủ), refresh, và 2fa_pending
  // (đã đúng mật khẩu nhưng đang chờ xác thực lớp 2 — KHÔNG được dùng để vào dashboard)
  type?: 'access' | 'refresh' | '2fa_pending'
  iat?: number
  exp?: number
}

/** Thông tin tối thiểu để cấp phiên đăng nhập */
type SessionUser = {
  id: string
  role: string
  email: string
  fullName: string
}

// Tên cookie cho pre-auth token (bước chờ xác thực 2FA)
export const TWO_FACTOR_PENDING_COOKIE = '2fa-pending'
// Pre-auth token sống ngắn, khớp với hiệu lực OTP (10 phút)
const TWO_FACTOR_PENDING_TTL_SECONDS = 10 * 60

// ⚠️ SECURITY: JWT_SECRET phải được cấu hình trong .env
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('❌ CRITICAL: JWT_SECRET must be set in environment variables')
  }
  return secret
}

// ✅ Refresh token secret riêng biệt (nên dùng secret khác với access token)
function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('❌ CRITICAL: JWT_REFRESH_SECRET must be set in environment variables')
  }
  return secret
}

const BCRYPT_SALT_ROUNDS = 12

/**
 * ✅ Tạo Access Token (thời gian ngắn - 8 giờ)
 */
export function signToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: 'access' }, 
    getJWTSecret(), 
    { expiresIn: '8h' }
  )
}

/**
 * ✅ Tạo Refresh Token (thời gian dài - 7 ngày)
 */
export function signRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    getRefreshSecret(),
    { expiresIn: '7d' }
  )
}

/**
 * ✅ Tạo Pre-Auth Token cho bước chờ xác thực 2FA
 * Token này chỉ cho phép hoàn tất bước nhập mã lớp 2, KHÔNG cấp quyền truy cập hệ thống.
 */
export function signPreAuthToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: '2fa_pending' },
    getJWTSecret(),
    { expiresIn: `${TWO_FACTOR_PENDING_TTL_SECONDS}s` }
  )
}

/**
 * ✅ Verify Pre-Auth Token (bước chờ 2FA)
 * Trả null nếu token không phải loại 2fa_pending hoặc đã hết hạn.
 */
export function verifyPreAuthToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload

    if (decoded.type !== '2fa_pending') {
      return null
    }

    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logFailure(AuditEventType.TOKEN_EXPIRED, 'Pre-auth token (2FA) đã hết hạn', {
        details: { expiredAt: error.expiredAt }
      })
    }
    return null
  }
}

/**
 * ✅ Verify Access Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload
    
    // Kiểm tra xem đây có phải access token không
    if (decoded.type && decoded.type !== 'access') {
      return null
    }
    
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logFailure(AuditEventType.TOKEN_EXPIRED, 'Token đã hết hạn', {
        details: { expiredAt: error.expiredAt }
      })
    } else if (error.name === 'JsonWebTokenError') {
      auditLogger.logFailure(AuditEventType.TOKEN_INVALID, 'Token không hợp lệ', {
        details: { message: error.message }
      })
    }
    return null
  }
}

/**
 * ✅ Verify Refresh Token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as JWTPayload
    
    // Kiểm tra xem đây có phải refresh token không
    if (decoded.type !== 'refresh') {
      return null
    }
    
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logFailure(AuditEventType.TOKEN_EXPIRED, 'Refresh token đã hết hạn', {
        details: { expiredAt: error.expiredAt }
      })
    }
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * ✅ Cookie options với security flags
 */
export function getSecureCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    httpOnly: true,
    secure: isProduction, // Chỉ bật HTTPS ở production
    sameSite: 'lax' as const, // Bảo vệ CSRF
    path: '/',
  }
}

/**
 * ✅ Cấp phiên đăng nhập đầy đủ: ký access + refresh token và set cookie lên response.
 * Dùng chung cho nhánh login không-2FA và nhánh hoàn tất xác thực 2FA, tránh lặp logic.
 */
export function issueAuthSession(response: NextResponse, user: SessionUser): NextResponse {
  const tokenPayload = {
    uid: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  }

  const accessToken = signToken(tokenPayload)
  const refreshToken = signRefreshToken(tokenPayload)
  const cookieOptions = getSecureCookieOptions()

  response.cookies.set('auth-token', accessToken, {
    ...cookieOptions,
    maxAge: 8 * 60 * 60, // 8 giờ
  })

  response.cookies.set('refresh-token', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  })

  return response
}

/**
 * ✅ Set cookie pre-auth (bước chờ 2FA) lên response.
 */
export function setPreAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(TWO_FACTOR_PENDING_COOKIE, token, {
    ...getSecureCookieOptions(),
    maxAge: TWO_FACTOR_PENDING_TTL_SECONDS,
  })
  return response
}

/**
 * ✅ Xóa cookie pre-auth sau khi đã hoàn tất hoặc hủy luồng 2FA.
 */
export function clearPreAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(TWO_FACTOR_PENDING_COOKIE, '', {
    ...getSecureCookieOptions(),
    maxAge: 0,
  })
  return response
}

export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) return null
    
    return verifyToken(token)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getServerSession()
  if (!session) {
    auditLogger.logFailure(AuditEventType.ACCESS_DENIED, 'Unauthorized access attempt', {})
    throw new Error('Unauthorized')
  }
  return session
}

export async function getCurrentUser() {
  const session = await getServerSession()
  if (!session) return null

  // ✅ Chỉ lấy user còn active
  const user = await prisma.user.findUnique({
    where: { 
      id: session.uid,
      isActive: true
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      org: true,
      isActive: true,
      createdAt: true
    }
  })

  if (!user) {
    auditLogger.logFailure(
      AuditEventType.ACCESS_DENIED, 
      'User không tồn tại hoặc đã bị vô hiệu hóa',
      { userId: session.uid, userEmail: session.email }
    )
    return null
  }

  return user
}

