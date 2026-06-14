/**
 * Seed BỔ SUNG (additive, idempotent) tài khoản demo còn thiếu:
 *   - Chỉ huy Học viện (COMMANDER)
 *   - Kiểm định bảo mật (SECURITY_AUDITOR)
 *
 * ⚠️ KHÔNG dùng reset_and_create_test_users.ts (xóa toàn bộ DB dùng chung).
 * Chạy: npx tsx --require dotenv/config add_oversight_accounts.ts
 */
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();
const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: 'chihuy@tapchintqsvn.edu.vn', fullName: 'Chỉ huy Học viện', role: Role.COMMANDER },
  { email: 'kiemtoan@tapchintqsvn.edu.vn', fullName: 'Kiểm Định Bảo Mật', role: Role.SECURITY_AUDITOR },
];
const PASSWORD = 'TapChi@2025';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  for (const a of ACCOUNTS) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: { role: a.role, status: AccountStatus.APPROVED, emailVerified: true, isActive: true },
      create: {
        email: a.email, passwordHash, fullName: a.fullName, role: a.role,
        status: AccountStatus.APPROVED, emailVerified: true, isActive: true,
        org: 'Tạp chí Nghệ thuật Quân sự Việt Nam', approvedAt: new Date(), approvedBy: 'system',
      },
    });
    console.log(`✅ ${u.email} → ${u.role}`);
  }
  console.log(`Mật khẩu: ${PASSWORD}`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
