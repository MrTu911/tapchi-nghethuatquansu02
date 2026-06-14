import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
  const password = 'TapChi@2025'
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email: 'chihuy@tapchintqsvn.edu.vn' },
    update: {
      passwordHash: hashedPassword,
      status: 'APPROVED',
      emailVerified: true,
      isActive: true,
    },
    create: {
      email: 'chihuy@tapchintqsvn.edu.vn',
      passwordHash: hashedPassword,
      fullName: 'Chỉ huy Học viện',
      role: 'COMMANDER',
      status: 'APPROVED',
      emailVerified: true,
      isActive: true,
      org: 'Học viện Quốc phòng',
      phone: '0123456789',
      approvedAt: new Date(),
      approvedBy: 'system',
    },
  })

  console.log('✅ Đã tạo/cập nhật tài khoản COMMANDER:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Họ tên: ${user.fullName}`)
  console.log(`   Vai trò: ${user.role}`)
  console.log(`   Mật khẩu: ${password}`)
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
