/**
 * One-off: rebrand PHẠM VI/CHỦ ĐỀ trong 3 seed file public-pages (đồng bộ với DB đã sửa).
 * Xử lý text-level trên file nguồn; báo cáo phép thay áp dụng + residual old-scope còn lại.
 *
 * Chạy: npx tsx fix_public_pages_seed.ts
 */
import { readFileSync, writeFileSync } from 'fs'

const FILES = [
  'seed_public_pages.ts',
  'prisma/seed-public-pages.ts',
  'scripts/seed-public-pages.ts',
]

const ABOUT_SCOPE_BLOCK = `<h2>Mục tiêu & Phạm vi</h2>
<p>Tạp chí ưu tiên tiếp nhận các bài nghiên cứu thuộc các lĩnh vực nghệ thuật quân sự:</p>
<ul>
  <li>Chiến lược quân sự</li>
  <li>Nghệ thuật tác chiến</li>
  <li>Chiến dịch học</li>
  <li>Chiến thuật học</li>
  <li>Lịch sử quân sự</li>
  <li>Khoa học quân sự</li>
  <li>Giáo dục quân sự</li>
  <li>Hợp tác quốc phòng</li>
</ul>

`

const SCOPE_TOPICS_BLOCK = `<h2>Phạm vi chủ đề</h2>
<p>Tạp chí tiếp nhận các bài nghiên cứu thuộc 9 chuyên mục chính:</p>

<h3>1. Chiến lược quân sự</h3>
<ul>
  <li>Nghiên cứu tầm chiến lược, quốc phòng - an ninh quốc gia</li>
  <li>Tư duy, đường lối quân sự và bảo vệ Tổ quốc trong tình hình mới</li>
</ul>

<h3>2. Nghệ thuật tác chiến</h3>
<ul>
  <li>Lý luận và thực tiễn nghệ thuật tác chiến của Quân đội nhân dân Việt Nam</li>
  <li>Vận dụng nghệ thuật tác chiến trong điều kiện chiến tranh hiện đại</li>
</ul>

<h3>3. Chiến dịch học</h3>
<ul>
  <li>Lý luận và thực tiễn về chiến dịch, các loại hình chiến dịch</li>
  <li>Tổ chức, chuẩn bị và thực hành chiến dịch</li>
</ul>

<h3>4. Chiến thuật học</h3>
<ul>
  <li>Chiến thuật cấp phân đội, binh chủng và quân chủng</li>
  <li>Vận dụng chiến thuật trong môi trường tác chiến mới</li>
</ul>

<h3>5. Lịch sử quân sự</h3>
<ul>
  <li>Lịch sử chiến tranh, nghệ thuật quân sự và truyền thống đấu tranh vũ trang</li>
  <li>Tổng kết kinh nghiệm các cuộc kháng chiến, chiến dịch tiêu biểu</li>
</ul>

<h3>6. Khoa học quân sự</h3>
<ul>
  <li>Nghiên cứu lý luận quân sự tổng hợp</li>
  <li>Khoa học, kỹ thuật và công nghệ phục vụ quốc phòng</li>
</ul>

<h3>7. Giáo dục quân sự</h3>
<ul>
  <li>Đào tạo, bồi dưỡng cán bộ và học thuật quốc phòng</li>
  <li>Đổi mới chương trình, phương pháp giảng dạy tại các học viện, nhà trường quân đội</li>
</ul>

<h3>8. Hợp tác quốc phòng</h3>
<ul>
  <li>Quan hệ quốc phòng, an ninh khu vực và quốc tế</li>
  <li>Kinh nghiệm quốc tế về xây dựng và phát triển nghệ thuật quân sự</li>
</ul>

<h3>9. Tin tức Học viện</h3>
<ul>
  <li>Hoạt động nghiên cứu, đào tạo của Học viện Quốc phòng</li>
  <li>Thông tin khoa học, sự kiện học thuật tiêu biểu</li>
</ul>

`

type Repl = [name: string, pattern: RegExp, replacement: string]

const REPLACEMENTS: Repl[] = [
  ['scope-topics-block', /<h2>Phạm vi chủ đề<\/h2>[\s\S]*?(?=<h2>Loại bài viết được tiếp nhận)/, SCOPE_TOPICS_BLOCK],
  ['about-scope-block', /<h2>Mục tiêu & Phạm vi<\/h2>[\s\S]*?(?=<h2>Thông tin xuất bản)/, ABOUT_SCOPE_BLOCK],
  ['about-intro-tail', /, bảo đảm hậu cần chiến đấu và quản lý kinh tế[^.]*?trong Quân đội\./g, ' và sự nghiệp xây dựng Quân đội nhân dân Việt Nam.'],
  ['scope-criteria', /Ứng dụng được vào thực tiễn hậu cần quân sự/g, 'Ứng dụng được vào thực tiễn nghệ thuật quân sự'],
  ['scope-table-row', /Bài viết từ thực tiễn vận hành, quản lý hậu cần có giá trị tham khảo/g, 'Bài viết từ thực tiễn huấn luyện, tác chiến và công tác quân sự có giá trị tham khảo'],
  ['editorial-linhvuc', /lĩnh vực nghệ thuật quân sự, quản lý kinh tế[^<]*?khoa học kỹ thuật quân sự/g, 'lĩnh vực nghệ thuật quân sự, khoa học quân sự và các lĩnh vực liên quan'],
  ['editorial-covan', /chuyên sâu về hậu cần quân sự và các lĩnh vực liên quan/g, 'chuyên sâu về nghệ thuật quân sự và các lĩnh vực liên quan'],
  ['scope-descriptor', /nghệ thuật quân sự, quản lý kinh tế [–-] tài chính quốc phòng, khoa học [–-] kỹ thuật quân sự liên quan/g, 'nghệ thuật quân sự và các lĩnh vực khoa học quân sự liên quan'],
]

for (const file of FILES) {
  let src: string
  try { src = readFileSync(file, 'utf8') } catch { console.warn(`⚠ bỏ qua (không đọc được): ${file}`); continue }
  const orig = src
  console.log(`\\n########## ${file} ##########`)
  for (const [name, pattern, repl] of REPLACEMENTS) {
    const before = src
    src = src.replace(pattern, repl)
    if (src !== before) console.log(`  ✓ ${name}`)
  }
  if (src !== orig) {
    writeFileSync(file, src, 'utf8')
    console.log(`  💾 đã ghi`)
  } else {
    console.log(`  = không thay đổi`)
  }
  // Residual: đếm token old-scope còn lại để rà thủ công
  const residual = (src.match(/hậu cần|military logistics/gi) || []).length
  console.log(`  → residual 'hậu cần|military logistics' còn: ${residual}`)
}
console.log('\\nXong xử lý seed files.')
