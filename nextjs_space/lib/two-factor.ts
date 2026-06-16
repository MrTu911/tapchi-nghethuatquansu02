
/**
 * ✅ Phase 2: Two-Factor Authentication Service
 * Hỗ trợ Email OTP (legacy) và TOTP (ứng dụng xác thực mã nguồn mở/nội bộ:
 * FreeOTP, Aegis... — chuẩn RFC 6238, sinh mã offline, không phụ thuộc internet).
 */

import { prisma } from './prisma'
import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { sendEmail } from './email'

export enum TwoFactorMethod {
  EMAIL_OTP = 'EMAIL_OTP',
  TOTP = 'TOTP',
  SMS = 'SMS'
}

// Cho phép sai lệch ±1 bước thời gian (±30s) để chịu được lệch đồng hồ giữa server và app
authenticator.options = { window: 1 }

// Tên issuer hiển thị trong ứng dụng xác thực TOTP (FreeOTP/Aegis/nội bộ...)
const TOTP_ISSUER = 'Tạp chí Nghệ thuật Quân sự Việt Nam'

/** Kết quả xác thực 2FA ở bước đăng nhập */
export interface TwoFactorLoginResult {
  ok: boolean
  via?: 'EMAIL_OTP' | 'TOTP' | 'BACKUP_CODE'
}

/**
 * Tạo OTP code 6 chữ số
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Tạo backup codes (10 codes, mỗi code 8 ký tự)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

/**
 * Hash backup code để lưu trữ an toàn
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  return hashBackupCode(code) === hashedCode
}

/**
 * Gửi OTP qua email
 */
export async function sendOTPEmail(email: string, otp: string, userName: string) {
  const subject = '🔐 Mã xác thực đăng nhập - Tạp chí Nghệ thuật Quân sự Việt Nam'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Mã xác thực đăng nhập</h2>
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Mã OTP của bạn là:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #059669; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
      </div>
      <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
      <p style="color: #dc2626;">⚠️ Không chia sẻ mã này với bất kỳ ai!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
      </p>
    </div>
  `
  
  await sendEmail({
    to: email,
    subject,
    html,
    text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 10 phút.`
  })
}

/**
 * Tạo và lưu OTP token
 */
export async function createOTPToken(userId: string): Promise<string> {
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 phút
  
  // Xóa các token cũ chưa sử dụng
  await prisma.twoFactorToken.deleteMany({
    where: {
      userId,
      used: false,
      expiresAt: { lt: new Date() }
    }
  })
  
  // Tạo token mới
  await prisma.twoFactorToken.create({
    data: {
      userId,
      token: otp,
      expiresAt
    }
  })
  
  return otp
}

/**
 * Verify OTP token
 */
export async function verifyOTPToken(userId: string, otp: string): Promise<boolean> {
  const token = await prisma.twoFactorToken.findFirst({
    where: {
      userId,
      token: otp,
      used: false,
      expiresAt: { gte: new Date() }
    }
  })
  
  if (!token) {
    return false
  }
  
  // Đánh dấu token đã sử dụng
  await prisma.twoFactorToken.update({
    where: { id: token.id },
    data: { used: true }
  })
  
  return true
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: string, method: TwoFactorMethod) {
  // Check if 2FA already exists
  const existing = await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
  
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)
  
  if (existing) {
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        method,
        isEnabled: true,
        backupCodes: hashedBackupCodes
      }
    })
  } else {
    await prisma.twoFactorAuth.create({
      data: {
        userId,
        method,
        isEnabled: true,
        backupCodes: hashedBackupCodes
      }
    })
  }
  
  return backupCodes // Return unhashed codes to show user once
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string) {
  await prisma.twoFactorAuth.updateMany({
    where: { userId },
    data: { isEnabled: false }
  })
}

/**
 * Check if user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
  
  return twoFactor?.isEnabled ?? false
}

/**
 * Get 2FA config for user
 */
export async function get2FAConfig(userId: string) {
  return await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
}

// ──────────────────────────────────────────────────────────────────────────
// TOTP (ứng dụng xác thực mã nguồn mở/nội bộ: FreeOTP, Aegis... — RFC 6238)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Tạo secret TOTP (base32)
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Tạo otpauth:// URI để nạp vào app Authenticator
 */
export function buildTotpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, TOTP_ISSUER, secret)
}

/**
 * Tạo ảnh QR (data URL) từ otpauth URI để hiển thị cho người dùng quét
 */
export async function generateTotpQrDataUrl(keyUri: string): Promise<string> {
  return QRCode.toDataURL(keyUri)
}

/**
 * Verify mã TOTP 6 số dựa trên secret đã lưu
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}

/**
 * Bắt đầu thiết lập TOTP: sinh secret, lưu ở trạng thái pending (isEnabled=false),
 * trả về secret + QR để người dùng nạp vào app rồi xác nhận.
 * Yêu cầu: tài khoản chưa bật 2FA (đổi phương thức phải tắt 2FA hiện tại trước).
 */
export async function setupTotp(userId: string, email: string): Promise<{ secret: string; qrDataUrl: string }> {
  const existing = await prisma.twoFactorAuth.findUnique({ where: { userId } })
  if (existing?.isEnabled) {
    throw new Error('Tài khoản đang bật 2FA. Vui lòng tắt phương thức hiện tại trước khi thiết lập lại.')
  }

  const secret = generateTotpSecret()

  await prisma.twoFactorAuth.upsert({
    where: { userId },
    create: {
      userId,
      method: TwoFactorMethod.TOTP,
      secret,
      isEnabled: false,
      backupCodes: [],
    },
    update: {
      method: TwoFactorMethod.TOTP,
      secret,
      isEnabled: false,
    },
  })

  const keyUri = buildTotpKeyUri(email, secret)
  const qrDataUrl = await generateTotpQrDataUrl(keyUri)

  return { secret, qrDataUrl }
}

/**
 * Xác nhận mã TOTP đầu tiên để kích hoạt: verify token theo secret pending,
 * nếu đúng thì bật 2FA và sinh backup codes (trả về bản chưa hash để hiển thị 1 lần).
 */
export async function confirmAndEnableTotp(userId: string, token: string): Promise<string[]> {
  const config = await prisma.twoFactorAuth.findUnique({ where: { userId } })
  if (!config?.secret || config.method !== TwoFactorMethod.TOTP) {
    throw new Error('Chưa có phiên thiết lập TOTP. Vui lòng bắt đầu lại.')
  }

  if (!verifyTotpCode(config.secret, token)) {
    throw new Error('Mã xác thực không đúng. Vui lòng thử lại.')
  }

  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { isEnabled: true, backupCodes: hashedBackupCodes },
  })

  return backupCodes
}

// ──────────────────────────────────────────────────────────────────────────
// Backup code & xác thực 2FA ở bước đăng nhập
// ──────────────────────────────────────────────────────────────────────────

/**
 * Verify backup code và tiêu thụ (xóa) nó khỏi danh sách — mỗi mã chỉ dùng được 1 lần.
 */
export async function verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
  const config = await prisma.twoFactorAuth.findUnique({ where: { userId } })
  if (!config || !config.isEnabled || config.backupCodes.length === 0) {
    return false
  }

  const hashed = hashBackupCode(code.trim().toUpperCase())
  if (!config.backupCodes.includes(hashed)) {
    return false
  }

  const remaining = config.backupCodes.filter((c) => c !== hashed)
  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { backupCodes: remaining },
  })

  return true
}

/**
 * Xác thực 2FA ở bước đăng nhập theo phương thức đã bật.
 * Thử đúng phương thức trước (EMAIL_OTP/TOTP), nếu trượt thì thử backup code.
 */
export async function verifyTwoFactorForLogin(userId: string, code: string): Promise<TwoFactorLoginResult> {
  const config = await prisma.twoFactorAuth.findUnique({ where: { userId } })
  if (!config || !config.isEnabled) {
    return { ok: false }
  }

  const normalized = code.trim()

  if (config.method === TwoFactorMethod.EMAIL_OTP) {
    if (await verifyOTPToken(userId, normalized)) {
      return { ok: true, via: 'EMAIL_OTP' }
    }
  } else if (config.method === TwoFactorMethod.TOTP) {
    if (config.secret && verifyTotpCode(config.secret, normalized)) {
      return { ok: true, via: 'TOTP' }
    }
  }

  // Fallback: backup code (dùng được cho mọi phương thức)
  if (await verifyAndConsumeBackupCode(userId, normalized)) {
    return { ok: true, via: 'BACKUP_CODE' }
  }

  return { ok: false }
}
