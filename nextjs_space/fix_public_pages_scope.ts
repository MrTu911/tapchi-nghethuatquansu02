/**
 * One-off: cập nhật PHẠM VI/CHỦ ĐỀ của 3 trang public (about, scope, editorial-board)
 * từ phạm vi tạp chí CŨ (hậu cần/kinh tế-tài chính/công nghệ hậu cần) sang đúng
 * 9 chuyên mục NTQS. Chỉ đụng đúng 3 trang; mỗi phép thay đều assert trước khi ghi.
 *
 * Backup DB đã lưu ở /tmp/ntqs_public_pages_backup.json trước khi chạy.
 * Rollback: psql ... UPDATE từ file backup.
 *
 * Chạy: npx tsx --require dotenv/config fix_public_pages_scope.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Khối nội dung mới ─────────────────────────────────────────────────────────

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

// ── Helper: thay có kiểm chứng ────────────────────────────────────────────────

type Repl = { name: string; apply: (s: string) => string; mustChange: boolean }

function runReplacements(slug: string, content: string, repls: Repl[]): string {
  let out = content
  for (const r of repls) {
    const before = out
    out = r.apply(out)
    if (out === before) {
      const msg = `[${slug}] KHÔNG khớp phép thay "${r.name}"`
      if (r.mustChange) throw new Error(msg + ' — DỪNG để tránh ghi sai.')
      console.warn('  ⚠ ' + msg + ' (bỏ qua)')
    } else {
      console.log(`  ✓ [${slug}] ${r.name}`)
    }
  }
  return out
}

async function fixPage(slug: string, repls: Repl[]) {
  const page = await prisma.publicPage.findFirst({ where: { slug } })
  if (!page) {
    console.warn(`⚠ Không tìm thấy trang slug="${slug}" — bỏ qua`)
    return
  }
  const newContent = runReplacements(slug, page.content, repls)
  if (newContent === page.content) {
    console.log(`= [${slug}] không thay đổi`)
    return
  }
  await prisma.publicPage.update({ where: { id: page.id }, data: { content: newContent } })
  console.log(`💾 [${slug}] đã cập nhật`)
}

async function main() {
  await fixPage('about', [
    {
      name: 'rewrite Mục tiêu & Phạm vi → 8 lĩnh vực NTQS',
      mustChange: true,
      apply: (s) => s.replace(/<h2>Mục tiêu & Phạm vi<\/h2>[\s\S]*?(?=<h2>Thông tin xuất bản)/, ABOUT_SCOPE_BLOCK),
    },
    {
      name: 'sửa đuôi đoạn giới thiệu (bỏ hậu cần/kinh tế-tài chính)',
      mustChange: false,
      apply: (s) => s.replace(/, bảo đảm hậu cần chiến đấu và quản lý kinh tế[\s\S]*?trong Quân đội\./, ' và sự nghiệp xây dựng Quân đội nhân dân Việt Nam.'),
    },
  ])

  await fixPage('scope', [
    {
      name: 'rewrite Phạm vi chủ đề → 9 chuyên mục NTQS',
      mustChange: true,
      apply: (s) => s.replace(/<h2>Phạm vi chủ đề<\/h2>[\s\S]*?(?=<h2>Loại bài viết được tiếp nhận)/, SCOPE_TOPICS_BLOCK),
    },
    {
      name: 'sửa dòng bảng "thực tiễn ... quản lý hậu cần"',
      mustChange: false,
      apply: (s) => s.replace('Bài viết từ thực tiễn vận hành, quản lý hậu cần có giá trị tham khảo', 'Bài viết từ thực tiễn huấn luyện, tác chiến và công tác quân sự có giá trị tham khảo'),
    },
    {
      name: 'sửa tiêu chí cuối "thực tiễn hậu cần quân sự"',
      mustChange: false,
      apply: (s) => s.replace('Ứng dụng được vào thực tiễn hậu cần quân sự', 'Ứng dụng được vào thực tiễn nghệ thuật quân sự'),
    },
  ])

  await fixPage('editorial-board', [
    {
      name: 'sửa lĩnh vực Hội đồng biên tập',
      mustChange: false,
      apply: (s) => s.replace(/lĩnh vực nghệ thuật quân sự, quản lý kinh tế[\s\S]*?khoa học kỹ thuật quân sự/, 'lĩnh vực nghệ thuật quân sự, khoa học quân sự và các lĩnh vực liên quan'),
    },
    {
      name: 'sửa "hậu cần quân sự" Hội đồng cố vấn',
      mustChange: false,
      apply: (s) => s.replace('chuyên sâu về hậu cần quân sự và các lĩnh vực liên quan', 'chuyên sâu về nghệ thuật quân sự và các lĩnh vực liên quan'),
    },
  ])

  console.log('\\n✅ Hoàn tất cập nhật 3 trang public.')
}

main()
  .catch((e) => { console.error('❌ Lỗi:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
