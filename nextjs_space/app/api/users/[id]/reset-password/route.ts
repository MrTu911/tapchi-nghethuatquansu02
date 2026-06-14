
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { logAudit } from '@/lib/audit-logger'
import { deleteAllUserSessions } from '@/lib/session-manager'
import { sendEmail } from '@/lib/email'

/**
 * Generate a cryptographically secure random password.
 * Uses crypto.randomBytes to avoid Math.random() bias.
 */
function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols

  // Pick cryptographically secure random index via rejection sampling
  function securePickChar(charset: string): string {
    const max = Math.floor(256 / charset.length) * charset.length
    let byte: number
    do {
      byte = crypto.randomBytes(1)[0]
    } while (byte >= max)
    return charset[byte % charset.length]
  }

  // Guarantee at least one character from each required class
  const parts = [
    securePickChar(uppercase),
    securePickChar(lowercase),
    securePickChar(numbers),
    securePickChar(symbols),
  ]

  for (let i = parts.length; i < length; i++) {
    parts.push(securePickChar(allChars))
  }

  // Shuffle using Fisher-Yates with crypto randomness
  const bytes = crypto.randomBytes(parts.length)
  for (let i = parts.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }

  return parts.join('')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Only SYSADMIN and EIC can reset passwords
    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền reset mật khẩu' },
        { status: 403 }
      )
    }

    // Cannot reset own password through this endpoint
    if (params.id === session.uid) {
      return NextResponse.json(
        { error: 'Không thể reset mật khẩu của chính bạn. Vui lòng sử dụng chức năng đổi mật khẩu.' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Generate new password
    const newPassword = generatePassword(12)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: params.id },
      data: { 
        passwordHash: hashedPassword
      }
    })

    // Force logout — terminate all active sessions for the target user
    await deleteAllUserSessions(params.id)

    // Log the action
    await logAudit({
      action: 'ADMIN_RESET_PASSWORD',
      actorId: session.uid,
      object: params.id,
      after: {
        resetBy: session.email,
        targetUser: user.email,
        timestamp: new Date().toISOString()
      }
    })

    // Send new password directly to the user's email — never expose plaintext in API response
    try {
      await sendEmail({
        to: user.email,
        subject: 'Mật khẩu mới của bạn đã được đặt lại',
        html: `<p>Xin chào ${user.fullName},</p><p>Quản trị viên đã đặt lại mật khẩu của bạn. Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p><p>Vui lòng đổi mật khẩu ngay sau khi đăng nhập.</p>`,
        text: `Xin chào ${user.fullName},\n\nQuản trị viên đã đặt lại mật khẩu của bạn. Mật khẩu mới: ${newPassword}\n\nVui lòng đổi mật khẩu ngay sau khi đăng nhập.`
      })
    } catch (emailError) {
      console.error('Error sending password reset email to user:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Reset mật khẩu thành công. Mật khẩu mới đã được gửi đến email của người dùng.',
      data: {
        userId: user.id,
        email: user.email
      }
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi reset mật khẩu' },
      { status: 500 }
    )
  }
}
