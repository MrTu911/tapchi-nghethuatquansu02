/**
 * Kiểm tra nhanh (smoke test) tài khoản demo theo vai trò — Tạp chí NTQS.
 *
 * Không cần trình duyệt. Với mỗi tài khoản demo (lib/demo-accounts.ts), kiểm:
 *   (a) tồn tại trong DB
 *   (b) status = APPROVED && isActive && emailVerified  → login không bị chặn
 *   (c) mật khẩu demo khớp passwordHash (bcrypt.compare)
 *   (d) role khớp đúng vai trò khai báo
 *   (e) getRoleDashboard(role) trả route hợp lệ (không rơi về fallback sai)
 *
 * In bảng PASS/FAIL; exit code ≠ 0 nếu có FAIL (dùng được trong nghiệm thu/CI).
 *
 * Chạy: npm run verify:roles  (sau khi đã `npm run seed:demo-accounts`)
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts'
import { ROLE_DASHBOARD_MAP, getRoleDashboard } from '@/lib/role-dashboard'

const prisma = new PrismaClient()

interface CheckResult {
  email: string
  role: string
  dashboard: string
  pass: boolean
  problems: string[]
}

async function verifyAccount(account: (typeof DEMO_ACCOUNTS)[number]): Promise<CheckResult> {
  const problems: string[] = []

  const user = await prisma.user.findUnique({
    where: { email: account.email },
    select: {
      role: true, status: true, isActive: true, emailVerified: true, passwordHash: true,
    },
  })

  if (!user) {
    return {
      email: account.email, role: account.role, dashboard: '—', pass: false,
      problems: ['không tồn tại trong DB (chạy: npm run seed:demo-accounts)'],
    }
  }

  if (user.status !== 'APPROVED') problems.push(`status=${user.status} (cần APPROVED)`)
  if (!user.isActive) problems.push('isActive=false (login bị chặn)')
  if (!user.emailVerified) problems.push('emailVerified=false')
  if (user.role !== account.role) problems.push(`role=${user.role} (kỳ vọng ${account.role})`)

  const passwordOk = user.passwordHash
    ? await bcrypt.compare(account.password, user.passwordHash)
    : false
  if (!passwordOk) problems.push('mật khẩu demo KHÔNG khớp')

  // Route dashboard phải có ánh xạ tường minh (không rơi về fallback do thiếu map).
  const dashboard = getRoleDashboard(user.role)
  if (!(user.role in ROLE_DASHBOARD_MAP)) {
    problems.push(`thiếu ánh xạ dashboard cho role ${user.role}`)
  }

  return { email: account.email, role: account.role, dashboard, pass: problems.length === 0, problems }
}

async function main(): Promise<void> {
  console.log('▶ Kiểm tra tài khoản demo theo vai trò (Tạp chí Nghệ thuật Quân sự Việt Nam)\n')

  const results: CheckResult[] = []
  for (const account of DEMO_ACCOUNTS) {
    results.push(await verifyAccount(account))
  }

  for (const r of results) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${status}  ${r.role.padEnd(16)} ${r.email.padEnd(38)} → ${r.dashboard}`)
    if (!r.pass) {
      for (const p of r.problems) console.log(`         · ${p}`)
    }
  }

  const failed = results.filter((r) => !r.pass)
  console.log(
    `\n${failed.length === 0 ? '✅' : '❌'} ${results.length - failed.length}/${results.length} vai trò PASS.`
  )

  if (failed.length > 0) {
    console.log('   → Có vai trò chưa đăng nhập được. Xem chi tiết bên trên.')
    process.exitCode = 1
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi kiểm tra:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
