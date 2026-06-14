/**
 * Seed quyền RBAC cho tất cả vai trò của Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Dùng chung nguồn sự thật với nút "Seed" trên dashboard
 * (lib/rbac-seed.ts → cũng được app/api/permissions/seed/route.ts sử dụng).
 *
 * Idempotent, additive. Chạy:
 *   npx tsx --require dotenv/config scripts/seed-permissions.ts
 *
 * Thêm cờ --reset để xóa sạch phân quyền cũ và áp lại ma trận mặc định:
 *   npx tsx --require dotenv/config scripts/seed-permissions.ts --reset
 */
import { PrismaClient } from '@prisma/client'
import { seedPermissions } from '../lib/rbac-seed'

const prisma = new PrismaClient()
const resetGrants = process.argv.includes('--reset')

async function main() {
  console.log(`🔐 Seeding permissions (resetGrants=${resetGrants})...`)
  const result = await seedPermissions(prisma, { resetGrants })

  console.log(`\n✅ Hoàn tất.`)
  console.log(`   - Permission mới thêm: ${result.added}`)
  console.log(`   - Tổng quyền active:   ${result.total}`)
  console.log(`   - Phân quyền theo vai trò (số quyền được cấp):`)
  for (const [role, count] of Object.entries(result.grants).sort()) {
    console.log(`       ${role.padEnd(18)} ${count}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed permissions thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
