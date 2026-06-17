/**
 * check-password.ts
 *
 * Kiểm tra mật khẩu của một tài khoản đã tạo trong DB.
 *
 * Mật khẩu lưu dưới dạng bcrypt hash (một chiều) → KHÔNG giải ngược được.
 * Script này chỉ verify: mật khẩu ứng viên có khớp hash trong DB không,
 * đồng thời in ngày tạo/cập nhật và trạng thái tài khoản (lịch sử tạo).
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/check-password.ts <email> <password>
 *
 * Ví dụ:
 *   npx tsx --require dotenv/config scripts/check-password.ts le-ngoc-bao@tacgia.ntqs.local Tacgia@2026
 *
 * Bỏ trống <password> để chỉ xem thông tin/lịch sử tài khoản (không verify).
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'

async function main(): Promise<void> {
  const [email, password] = process.argv.slice(2)

  if (!email) {
    console.error('Cú pháp: npx tsx --require dotenv/config scripts/check-password.ts <email> [password]')
    process.exitCode = 1
    return
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      isActive: true,
      emailVerified: true,
      passwordHash: true,
      createdAt: true,
      approvedAt: true,
    },
  })

  if (!user) {
    console.log(`❌ Không tìm thấy tài khoản với email: ${email}`)
    return
  }

  console.log('\n=== THÔNG TIN TÀI KHOẢN ===')
  console.log(`Họ tên:        ${user.fullName}`)
  console.log(`Email:         ${user.email}`)
  console.log(`Role:          ${user.role}`)
  console.log(`Status:        ${user.status}`)
  console.log(`Active:        ${user.isActive}`)
  console.log(`Email verified:${user.emailVerified}`)
  console.log(`Ngày tạo:      ${user.createdAt.toISOString()}`)
  console.log(`Duyệt lúc:     ${user.approvedAt ? user.approvedAt.toISOString() : 'N/A'}`)

  if (!password) {
    console.log('\n(Không truyền mật khẩu → chỉ xem thông tin.)')
    return
  }

  if (!user.passwordHash) {
    console.log('\n⚠️  Tài khoản chưa có passwordHash (không đăng nhập bằng mật khẩu được).')
    return
  }

  const ok = await comparePassword(password, user.passwordHash)
  console.log('\n=== KẾT QUẢ VERIFY ===')
  console.log(ok ? `✅ ĐÚNG: mật khẩu "${password}" khớp với tài khoản này.` : `❌ SAI: mật khẩu "${password}" KHÔNG khớp.`)
}

main()
  .catch((error) => {
    console.error('❌ Lỗi kiểm tra mật khẩu:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
