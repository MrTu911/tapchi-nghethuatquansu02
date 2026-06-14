/**
 * Seed BỔ SUNG (additive, idempotent) tài khoản demo Phó Tổng biên tập (DEPUTY_EIC).
 *
 * ⚠️ KHÔNG dùng reset_and_create_test_users.ts cho việc này — file đó deleteMany()
 * toàn bộ dữ liệu, sẽ xóa cả dữ liệu của checkout khác đang dùng CHUNG database
 * tapchi_ntqs. Script này chỉ UPSERT đúng 1 tài khoản, không đụng dữ liệu khác.
 *
 * Chạy: npx tsx --require dotenv/config add_deputy_account.ts
 */
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

const DEPUTY = {
  email: 'photongbientap@tapchintqsvn.edu.vn',
  fullName: 'Phó Tổng Biên Tập',
  password: 'TapChi@2025',
};

async function main() {
  const passwordHash = await bcrypt.hash(DEPUTY.password, 12);

  const user = await prisma.user.upsert({
    where: { email: DEPUTY.email },
    update: {
      // Đảm bảo tài khoản luôn đúng vai trò + đã kích hoạt khi chạy lại
      role: Role.DEPUTY_EIC,
      status: AccountStatus.APPROVED,
      emailVerified: true,
      isActive: true,
    },
    create: {
      email: DEPUTY.email,
      passwordHash,
      fullName: DEPUTY.fullName,
      role: Role.DEPUTY_EIC,
      status: AccountStatus.APPROVED,
      emailVerified: true,
      isActive: true,
      org: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      approvedAt: new Date(),
      approvedBy: 'system',
    },
  });

  console.log('✅ Đã upsert tài khoản Phó Tổng biên tập');
  console.log(`   Email:    ${user.email}`);
  console.log(`   Vai trò:  ${user.role}`);
  console.log(`   Mật khẩu: ${DEPUTY.password}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
