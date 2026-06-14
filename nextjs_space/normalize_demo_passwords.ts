/**
 * Chuẩn hóa mật khẩu các TÀI KHOẢN DEMO theo vai trò về mật khẩu demo thống nhất
 * của hệ thống (TapChi@2025 — đúng như các nút đăng nhập demo ở trang login).
 *
 * Chỉ cập nhật passwordHash + đảm bảo APPROVED/active cho đúng các email demo liệt kê.
 * Idempotent, additive. Chạy: npx tsx --require dotenv/config normalize_demo_passwords.ts
 */
import { PrismaClient, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();
const prisma = new PrismaClient();

const DEMO_EMAILS = [
  'admin@tapchintqsvn.edu.vn',       // SYSADMIN
  'docgia@tapchintqsvn.edu.vn',      // AUTHOR
  'phanbien2@tapchintqsvn.edu.vn',   // REVIEWER
  'bientap@tapchintqsvn.edu.vn',     // SECTION_EDITOR
  'dangtrang@tapchintqsvn.edu.vn',   // LAYOUT_EDITOR
];
const PASSWORD = 'TapChi@2025';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  for (const email of DEMO_EMAILS) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (!existing) { console.log(`⚠️  bỏ qua (không tồn tại): ${email}`); continue; }
    await prisma.user.update({
      where: { email },
      data: { passwordHash, status: AccountStatus.APPROVED, emailVerified: true, isActive: true },
    });
    console.log(`✅ ${email} (${existing.role}) → mật khẩu ${PASSWORD}`);
  }
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
