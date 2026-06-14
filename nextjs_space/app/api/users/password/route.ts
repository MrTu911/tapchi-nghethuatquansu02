
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit-logger'
import {
  getSessionByToken,
  invalidateAllSessionsOnPasswordChange,
} from '@/lib/session-manager'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }
    const { currentPassword, newPassword } = parsed.data

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { id: true, passwordHash: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không đúng' },
        { status: 400 }
      )
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.uid },
      data: { passwordHash: hashedPassword }
    })

    // Invalidate all OTHER sessions — the current one stays active so the user
    // is not abruptly logged out immediately after changing their own password.
    const cookieStore = await cookies()
    const rawToken = cookieStore.get('auth-token')?.value
    const currentSession = rawToken ? await getSessionByToken(rawToken) : null
    await invalidateAllSessionsOnPasswordChange(session.uid, currentSession?.id)

    await logAudit({
      action: 'CHANGE_PASSWORD',
      object: 'user_password',
      actorId: session.uid,
      after: { message: 'Password changed, other sessions invalidated' }
    })

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Tất cả phiên đăng nhập khác đã bị vô hiệu hóa.'
    })
  } catch (error: unknown) {
    console.error('[CHANGE_PASSWORD]', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đổi mật khẩu' },
      { status: 500 }
    )
  }
}
