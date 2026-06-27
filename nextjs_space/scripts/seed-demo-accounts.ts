/**
 * Seed tài khoản demo theo vai trò — Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Mục tiêu: bảo đảm ĐỦ 11 vai trò đều có tài khoản demo ĐĂNG NHẬP ĐƯỢC NGAY
 * (mật khẩu chung TapChi@2025), phục vụ kiểm thử chức năng từng vai trò.
 *
 * Vì sao cần script riêng (không gộp vào scripts/seed.ts):
 *   - scripts/seed.ts chỉ auto-approve 3 vai trò admin; các vai trò non-admin bị
 *     tạo ở trạng thái PENDING → isActive=false → login bị chặn.
 *   - 3 vai trò DEPUTY_EIC / SECURITY_AUDITOR / COMMANDER chưa hề được seed.
 *
 * An toàn chạy lại nhiều lần (idempotent, upsert theo email). Khi tài khoản đã
 * tồn tại, CHỈ cập nhật các trường đăng nhập (passwordHash/role/trạng thái kích
 * hoạt) — KHÔNG ghi đè fullName/org để không phá tên măng-sét Ban biên tập do
 * `npm run seed:editorial-board` đặt (tongbientap@/bientapchinh@/bientap@).
 *
 * Nguồn danh sách: lib/demo-accounts.ts (SSOT, dùng chung với trang đăng nhập).
 *
 * Chạy: npm run seed:demo-accounts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEMO_ACCOUNTS, DEMO_DEFAULT_FULLNAME } from '@/lib/demo-accounts'

const prisma = new PrismaClient()

const BCRYPT_SALT_ROUNDS = 12
/** Email tài khoản REVIEWER demo — cần ReviewerProfile để dashboard phản biện có dữ liệu. */
const REVIEWER_DEMO_EMAIL = 'phanbien@tapchintqsvn.edu.vn'

type UpsertOutcome = 'created' | 'updated'

async function upsertDemoAccount(
  account: (typeof DEMO_ACCOUNTS)[number],
  passwordHash: string
): Promise<UpsertOutcome> {
  const existing = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  })

  // Các trường BẮT BUỘC để tài khoản đăng nhập được ngay.
  const loginableFields = {
    passwordHash,
    role: account.role,
    status: 'APPROVED' as const,
    isActive: true,
    emailVerified: true,
  }

  await prisma.user.upsert({
    where: { email: account.email },
    // update: KHÔNG đụng fullName/org để giữ tên măng-sét nếu tài khoản đã có.
    update: loginableFields,
    create: {
      email: account.email,
      fullName: DEMO_DEFAULT_FULLNAME[account.role],
      org: account.org,
      ...loginableFields,
      approvedAt: new Date(),
      approvedBy: 'DEMO_SEED',
    },
  })

  return existing ? 'updated' : 'created'
}

/** Bảo đảm tài khoản REVIEWER demo có ReviewerProfile (để dashboard phản biện có dữ liệu). */
async function ensureReviewerProfile(): Promise<void> {
  const reviewer = await prisma.user.findUnique({
    where: { email: REVIEWER_DEMO_EMAIL },
    select: { id: true },
  })
  if (!reviewer) return

  await prisma.reviewerProfile.upsert({
    where: { userId: reviewer.id },
    update: { isAvailable: true },
    create: {
      userId: reviewer.id,
      expertise: ['Nghệ thuật quân sự', 'Chiến thuật học', 'Lịch sử quân sự'],
      keywords: ['nghệ thuật quân sự', 'chiến thuật', 'chiến dịch', 'tác chiến'],
      maxConcurrentReviews: 5,
      isAvailable: true,
    },
  })
}

async function main(): Promise<void> {
  const password = process.env.DEMO_ACCOUNT_PASSWORD || DEMO_ACCOUNTS[0].password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

  console.log('▶ Seed tài khoản demo theo vai trò (Tạp chí Nghệ thuật Quân sự Việt Nam)\n')

  let created = 0
  let updated = 0

  for (const account of DEMO_ACCOUNTS) {
    const outcome = await upsertDemoAccount(account, passwordHash)
    if (outcome === 'created') created++
    else updated++
    const tag = outcome === 'created' ? '🆕 created' : '♻️  updated'
    console.log(
      `  ${tag}  ${account.role.padEnd(16)} ${account.email.padEnd(38)} (${account.label})`
    )
  }

  await ensureReviewerProfile()

  console.log(
    `\n✅ Hoàn tất: ${DEMO_ACCOUNTS.length} tài khoản demo (${created} mới, ${updated} cập nhật).`
  )
  console.log(`   Mật khẩu chung: ${password}`)
  console.log('   Tất cả đã APPROVED + active + emailVerified → đăng nhập được ngay.')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed tài khoản demo:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
