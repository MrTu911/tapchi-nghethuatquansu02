/**
 * Seed TỔNG HỢP — chạy toàn bộ pipeline seed theo đúng thứ tự phụ thuộc.
 *
 * Thứ tự BẮT BUỘC (mỗi bước phụ thuộc bước trước):
 *   1. seed:demo-accounts → 11 tài khoản vai trò. Các bước sau tra cứu user theo
 *      email (seed:workflow/seed:content throw nếu thiếu) nên phải chạy đầu tiên.
 *   2. seed:production    → Tập 39/2026, các số, bài IN_PRODUCTION & PUBLISHED.
 *      seed:content cần bài đã xuất bản cho FeaturedArticle/ArticleComment/Metrics.
 *   3. seed:workflow      → 9 bài NTQS-FLOW trải đủ 8 SubmissionStatus + phản biện.
 *      seed:content gắn Deadline/SubmissionComment vào các bài NTQS-FLOW này.
 *   4. seed:content       → Banner/Media/HomepageSection/FeaturedArticle/Keyword/
 *      ArticleComment/ArticleMetrics/Deadline/SubmissionComment/SecurityAlert
 *      + chuẩn hóa bài đã xuất bản → APPROVED.
 *
 * Tất cả các bước đều IDEMPOTENT → chạy lại an toàn, không nhân đôi dữ liệu.
 * Fail-fast: nếu một bước lỗi, dừng ngay và thoát mã ≠ 0.
 *
 * Chạy: npm run seed:all
 */
import { execSync } from 'node:child_process'

interface SeedStep {
  cmd: string // npm script name
  desc: string
}

const STEPS: SeedStep[] = [
  { cmd: 'seed:demo-accounts', desc: '11 tài khoản demo theo vai trò (nền tảng RBAC)' },
  { cmd: 'seed:production', desc: 'Tập 39/2026 + các số + bài IN_PRODUCTION & PUBLISHED' },
  { cmd: 'seed:workflow', desc: '9 bài NTQS-FLOW trải đủ trạng thái vòng đời biên tập' },
  { cmd: 'seed:content', desc: 'Banner/Media/Keyword/Deadline/SecurityAlert... + vá approval' },
]

function fmtDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  SEED TỔNG HỢP — Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)   ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`Sẽ chạy ${STEPS.length} bước theo thứ tự phụ thuộc. Tất cả idempotent.\n`)

  const startedAll = Date.now()
  const timings: Array<{ cmd: string; ms: number }> = []

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i]
    console.log(`\n┌─ [${i + 1}/${STEPS.length}] npm run ${step.cmd}`)
    console.log(`│  ${step.desc}`)
    console.log('└' + '─'.repeat(62))

    const started = Date.now()
    try {
      // stdio:'inherit' để giữ nguyên log màu của từng script con.
      execSync(`npm run ${step.cmd}`, { stdio: 'inherit' })
    } catch (err) {
      const ms = Date.now() - started
      console.error(`\n❌ Bước "${step.cmd}" THẤT BẠI sau ${fmtDuration(ms)}. Dừng pipeline.`)
      console.error('   Sửa lỗi rồi chạy lại "npm run seed:all" (các bước đã xong là idempotent).')
      process.exit(1)
    }
    timings.push({ cmd: step.cmd, ms: Date.now() - started })
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  ✅ SEED TỔNG HỢP HOÀN TẤT                                     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  for (const t of timings) console.log(`   • ${t.cmd.padEnd(22)} ${fmtDuration(t.ms)}`)
  console.log(`   ─────────────────────────────────────`)
  console.log(`   Tổng thời gian: ${fmtDuration(Date.now() - startedAll)}`)
  console.log('\n🔑 Mật khẩu tài khoản demo: TapChi@2025 (tác giả demo luồng: Tacgia@2026)')
  console.log('🔗 Kiểm thử nhanh:')
  console.log('   • Trang chủ        : http://localhost:3001/')
  console.log('   • Tác giả          : tacgia@        → /dashboard/author/submissions')
  console.log('   • Phản biện        : phanbien@      → /dashboard/reviewer/assignments')
  console.log('   • Biên tập chuyên mục: bientap@      → /dashboard/editor/submissions')
  console.log('   • Dàn trang        : dangtrang@     → /dashboard/layout/production')
  console.log('   • Bảo mật          : baomat@        → /dashboard/security')
}

main().catch((e) => {
  console.error('❌ Lỗi orchestrator seed:all:', e)
  process.exit(1)
})
