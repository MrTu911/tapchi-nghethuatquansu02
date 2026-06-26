/**
 * seed-editorial-board.ts
 *
 * Seed BỔ SUNG (additive, idempotent) tài khoản cho TẤT CẢ thành viên Ban biên tập
 * Tạp chí Nghệ thuật Quân sự Việt Nam theo măng-sét chính thức (số 4-2026).
 *
 * Nguồn sự thật (do tòa soạn cung cấp):
 *   - Tổng biên tập:    Đại tá, TS Lê Ngọc Bảo
 *   - Thư ký tòa soạn:  Thượng tá, ThS Nguyễn Ngọc Nam
 *   - Biên tập viên:    Đại tá, TS Phan Minh Đức
 *                       Trung tá QNCN Nguyễn Thảo Lan Oanh
 *                       Thượng tá QNCN Phạm Thị Thanh Thủy
 *                       Trung tá QNCN Nguyễn Thị Khánh
 *                       Trung tá QNCN Mai Thị Hương Giang
 *                       Đại úy QNCN Nguyễn Thu Trang
 *
 * Chiến lược (xem .claude/rules/migration-refactor.md — reuse trước, không phá demo):
 *   - 3 tài khoản editor demo CHUNG sẵn có được "repurpose" thành người thật, GIỮ NGUYÊN
 *     email để panel đăng nhập demo (app/auth/login/page.tsx) vẫn tự điền đúng:
 *        tongbientap@   → Tổng biên tập (EIC)
 *        bientapchinh@  → Thư ký tòa soạn (MANAGING_EDITOR)
 *        bientap@       → 1 Biên tập viên (SECTION_EDITOR)
 *   - 5 Biên tập viên còn lại được tạo MỚI với email định danh riêng.
 *   - KHÔNG đụng tài khoản DEPUTY_EIC / LAYOUT_EDITOR / SYSADMIN... (hạ tầng demo khác).
 *
 * ⚠️ KHÔNG dùng reset_and_create_test_users.ts — file đó deleteMany() toàn bộ DB
 * dùng CHUNG (tapchi_ntqs) giữa các checkout. Script này CHỈ upsert đúng các tài khoản
 * Ban biên tập, không xóa dữ liệu khác.
 *
 * Mật khẩu: giống demo (mặc định TapChi@2025), có thể override qua EDITOR_DEMO_PASSWORD.
 *
 * Chạy:
 *   npm run seed:editorial-board
 *   EDITOR_DEMO_PASSWORD='Matkhau@2026' npm run seed:editorial-board
 */
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'TapChi@2025';
const ORG = 'Học viện Quốc phòng';

interface MastheadMember {
  email: string;
  fullName: string;
  role: Role;
  /** Cấp bậc (kèm QNCN nếu là quân nhân chuyên nghiệp) — đúng như măng-sét. */
  rank: string;
  /** Học vị; null nếu măng-sét không ghi. */
  academicDegree: string | null;
  /** Chức danh trong tòa soạn (hiển thị ở Ban biên tập). */
  position: string;
}

/**
 * Thứ tự khai báo = thứ tự ưu tiên trên măng-sét (Tổng biên tập → Thư ký → Biên tập viên).
 * 3 email đầu trùng tài khoản demo cũ (repurpose, giữ email); 5 email sau là tạo mới.
 */
const MASTHEAD: MastheadMember[] = [
  {
    email: 'tongbientap@tapchintqsvn.edu.vn',
    fullName: 'Lê Ngọc Bảo',
    role: Role.EIC,
    rank: 'Đại tá',
    academicDegree: 'Tiến sĩ',
    position: 'Tổng biên tập',
  },
  {
    email: 'bientapchinh@tapchintqsvn.edu.vn',
    fullName: 'Nguyễn Ngọc Nam',
    role: Role.MANAGING_EDITOR,
    rank: 'Thượng tá',
    academicDegree: 'Thạc sĩ',
    position: 'Thư ký tòa soạn',
  },
  {
    email: 'bientap@tapchintqsvn.edu.vn',
    fullName: 'Phan Minh Đức',
    role: Role.SECTION_EDITOR,
    rank: 'Đại tá',
    academicDegree: 'Tiến sĩ',
    position: 'Biên tập viên',
  },
  {
    email: 'lanoanh@tapchintqsvn.edu.vn',
    fullName: 'Nguyễn Thảo Lan Oanh',
    role: Role.SECTION_EDITOR,
    rank: 'Trung tá QNCN',
    academicDegree: null,
    position: 'Biên tập viên',
  },
  {
    email: 'thanhthuy@tapchintqsvn.edu.vn',
    fullName: 'Phạm Thị Thanh Thủy',
    role: Role.SECTION_EDITOR,
    rank: 'Thượng tá QNCN',
    academicDegree: null,
    position: 'Biên tập viên',
  },
  {
    email: 'thikhanh@tapchintqsvn.edu.vn',
    fullName: 'Nguyễn Thị Khánh',
    role: Role.SECTION_EDITOR,
    rank: 'Trung tá QNCN',
    academicDegree: null,
    position: 'Biên tập viên',
  },
  {
    email: 'huonggiang@tapchintqsvn.edu.vn',
    fullName: 'Mai Thị Hương Giang',
    role: Role.SECTION_EDITOR,
    rank: 'Trung tá QNCN',
    academicDegree: null,
    position: 'Biên tập viên',
  },
  {
    email: 'thutrang@tapchintqsvn.edu.vn',
    fullName: 'Nguyễn Thu Trang',
    role: Role.SECTION_EDITOR,
    rank: 'Đại úy QNCN',
    academicDegree: null,
    position: 'Biên tập viên',
  },
];

async function upsertMember(member: MastheadMember, passwordHash: string): Promise<'created' | 'updated'> {
  const existing = await prisma.user.findUnique({ where: { email: member.email }, select: { id: true } });

  // Các trường nhận dạng + chức danh được đồng bộ ở cả create lẫn update để chạy lại
  // luôn cho ra măng-sét đúng, đồng thời đảm bảo tài khoản đã kích hoạt + xác thực.
  const identityFields = {
    fullName: member.fullName,
    role: member.role,
    rank: member.rank,
    academicDegree: member.academicDegree,
    position: member.position,
    org: ORG,
    status: AccountStatus.APPROVED,
    isActive: true,
    emailVerified: true,
  };

  await prisma.user.upsert({
    where: { email: member.email },
    update: {
      ...identityFields,
      // Bảo đảm mật khẩu luôn khớp mật khẩu demo (yêu cầu nghiệp vụ: "mật khẩu giống demo").
      passwordHash,
    },
    create: {
      email: member.email,
      passwordHash,
      ...identityFields,
      approvedAt: new Date(),
      approvedBy: 'system',
    },
  });

  return existing ? 'updated' : 'created';
}

async function main(): Promise<void> {
  const password = process.env.EDITOR_DEMO_PASSWORD || DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  console.log('▶ Seed tài khoản Ban biên tập Tạp chí Nghệ thuật Quân sự Việt Nam...\n');

  let created = 0;
  let updated = 0;

  for (const member of MASTHEAD) {
    const result = await upsertMember(member, passwordHash);
    if (result === 'created') created++;
    else updated++;
    const degree = member.academicDegree ? `, ${member.academicDegree}` : '';
    console.log(
      `  ${result === 'created' ? '＋ tạo mới ' : '↻ cập nhật'}  ${member.position.padEnd(16)} ${member.rank}${degree} ${member.fullName}  <${member.email}>`,
    );
  }

  console.log('\n✅ Hoàn tất.');
  console.log(`   Tổng thành viên: ${MASTHEAD.length}  (tạo mới: ${created}, cập nhật: ${updated})`);
  console.log(`   Mật khẩu (chung, giống demo): ${password}`);
  console.log('   Tất cả tài khoản: APPROVED + đã kích hoạt + đã xác thực email.');
}

main()
  .catch((error) => {
    console.error('❌ Lỗi seed Ban biên tập:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
