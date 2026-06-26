/**
 * seed-legal-info.ts
 *
 * Seed BỔ SUNG (additive, idempotent) thông tin pháp lý chính thức của Tạp chí Nghệ thuật
 * Quân sự Việt Nam vào kho UIConfig (tab "Thông tin pháp lý" trong /dashboard/admin/ui-config).
 *
 * Nguồn sự thật (măng-sét tòa soạn):
 *   - Giấy phép hoạt động báo chí số: 619/GP-BTTTT, Bộ Thông tin và Truyền thông cấp 23-12-2020
 *   - Cơ quan chủ quản: Học viện Quốc phòng
 *   - Địa chỉ: 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội — Hòm thư 2EA6
 *   - ĐT: (069) 556 635 — Email: tapchintqsvn@gmail.com — ISSN: 1859-0454
 *
 * Các khóa này khớp đúng tab "legal" khai báo trong app/dashboard/admin/ui-config/page.tsx.
 * Script chỉ UPSERT theo key (không xóa dữ liệu khác).
 *
 * Chạy: npm run seed:legal-info
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

const LEGAL_CONFIG: { key: string; value: string; description: string }[] = [
  { key: 'legal.license.number', value: '619/GP-BTTTT', description: 'Số giấy phép hoạt động báo chí' },
  { key: 'legal.license.date', value: '23-12-2020', description: 'Ngày cấp giấy phép' },
  { key: 'legal.license.issuer', value: 'Bộ Thông tin và Truyền thông', description: 'Cơ quan cấp giấy phép' },
  { key: 'legal.publisher.name', value: 'Học viện Quốc phòng', description: 'Cơ quan chủ quản' },
  { key: 'legal.publisher.address', value: '93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội. Hòm thư 2EA6', description: 'Địa chỉ trụ sở tòa soạn' },
  { key: 'legal.publisher.phone', value: '(069) 556 635', description: 'Điện thoại liên hệ' },
  { key: 'legal.publisher.email', value: 'tapchintqsvn@gmail.com', description: 'Email liên hệ tòa soạn' },
  { key: 'legal.issn', value: '1859-0454', description: 'Mã số ISSN (bản in)' },
];

async function main(): Promise<void> {
  console.log('▶ Seed thông tin pháp lý (UIConfig legal.*)...\n');

  for (const item of LEGAL_CONFIG) {
    await prisma.uIConfig.upsert({
      where: { key: item.key },
      update: { value: item.value, description: item.description, category: 'legal', updatedBy: 'system' },
      create: { key: item.key, value: item.value, description: item.description, category: 'legal', updatedBy: 'system' },
    });
    console.log(`  ✓ ${item.key.padEnd(26)} = ${item.value}`);
  }

  console.log(`\n✅ Hoàn tất. Đã đồng bộ ${LEGAL_CONFIG.length} khóa thông tin pháp lý.`);
}

main()
  .catch((error) => {
    console.error('❌ Lỗi seed thông tin pháp lý:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
