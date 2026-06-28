/**
 * seed-full.ts — Orchestrator seed TOÀN DIỆN cho cài đặt mới.
 *
 * Khác với scripts/seed-all.ts (chỉ lo dữ liệu demo nghiệp vụ), file này lo
 * TRỌN BỘ một cài đặt sạch: NỀN + NHẬN DIỆN (+ DEMO nếu chọn full).
 *
 * Chế độ (qua --mode hoặc env SEED_MODE, mặc định "full"):
 *   - full     : NỀN + NHẬN DIỆN + toàn bộ DEMO (seed:all). Tốt để kiểm thử.
 *   - minimal  : NỀN (chỉ chuyên mục + tài khoản chính thức + khung số) +
 *                NHẬN DIỆN. Không có bài/submission/banner demo. Hợp cài thật.
 *
 * Thứ tự phụ thuộc (cả hai chế độ):
 *   1. seed:base       → chuyên mục NTQS + tài khoản + reviewer + khung số
 *                        (các bước sau tra cứu user/category nên phải chạy đầu).
 *   2. seed:site-settings, seed:public-pages, seed:legal-info,
 *      seed:editorial-board → nhận diện tạp chí (idempotent skip-if-exists/upsert).
 *   3. navigation + homepage-sections → CHỈ chạy khi bảng trống (tránh ghi đè
 *      tùy biến của quản trị viên khi chạy lại).
 *   4. (chỉ full) seed:all → demo-accounts → production → workflow → content.
 *
 * Tất cả idempotent → chạy lại an toàn. Fail-fast.
 * Chạy: npm run setup:seed -- --mode=full|minimal
 */
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

type SeedMode = 'full' | 'minimal'

interface Step {
  cmd: string
  desc: string
}

function resolveMode(): SeedMode {
  const arg = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1]
  const val = (arg || process.env.SEED_MODE || 'full').toLowerCase()
  return val === 'minimal' ? 'minimal' : 'full'
}

function fmtDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function runStep(index: number, total: number, step: Step): number {
  console.log(`\n┌─ [${index}/${total}] npm run ${step.cmd}`)
  console.log(`│  ${step.desc}`)
  console.log('└' + '─'.repeat(62))
  const started = Date.now()
  try {
    execSync(`npm run ${step.cmd}`, { stdio: 'inherit' })
  } catch {
    const ms = Date.now() - started
    console.error(`\n❌ Bước "${step.cmd}" THẤT BẠI sau ${fmtDuration(ms)}. Dừng pipeline.`)
    console.error('   Sửa lỗi rồi chạy lại "npm run setup:seed" (các bước đã xong là idempotent).')
    process.exit(1)
  }
  return Date.now() - started
}

/**
 * Seed nav/homepage chỉ khi bảng trống — các script gốc dùng deleteMany+create,
 * nên cần guard để chạy lại không xóa tùy biến của quản trị viên.
 */
async function runIdentityGuarded(steps: Array<{ count: () => Promise<number>; step: Step }>): Promise<void> {
  for (const { count, step } of steps) {
    let existing = 0
    try {
      existing = await count()
    } catch {
      // Bảng có thể chưa tồn tại ở lần cài đầu rất hiếm — cứ thử seed.
      existing = 0
    }
    if (existing > 0) {
      console.log(`\n• Bỏ qua "${step.cmd}" — đã có ${existing} bản ghi (giữ tùy biến hiện có).`)
      continue
    }
    runStep(0, 0, step)
  }
}

async function main() {
  const mode = resolveMode()
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log(`║  SEED CÀI ĐẶT (${mode.toUpperCase().padEnd(7)}) — Tạp chí Nghệ thuật Quân sự Việt Nam ║`)
  console.log('╚══════════════════════════════════════════════════════════════╝')

  const startedAll = Date.now()

  // 1) NỀN
  const baseStep: Step = mode === 'minimal'
    ? { cmd: 'seed:base -- --minimal', desc: 'Nền (minimal): chuyên mục + tài khoản chính thức + reviewer + khung số' }
    : { cmd: 'seed:base', desc: 'Nền: chuyên mục + tài khoản + reviewer + khung số + bài mẫu cơ bản' }
  runStep(1, 0, baseStep)

  // 2) NHẬN DIỆN (idempotent)
  const identitySteps: Step[] = [
    { cmd: 'seed:site-settings', desc: 'Cấu hình site (tên tạp chí, ISSN, liên hệ)' },
    { cmd: 'seed:public-pages', desc: 'Trang tĩnh (giới thiệu, liên hệ, quy trình xuất bản)' },
    { cmd: 'seed:legal-info', desc: 'Thông tin pháp lý (giấy phép, ISSN) cho footer' },
    { cmd: 'seed:editorial-board', desc: 'Tài khoản Ban biên tập theo măng-sét NTQS' },
  ]
  identitySteps.forEach((s, i) => runStep(i + 2, 0, s))

  // 3) NAV + HOMEPAGE (guard: chỉ khi trống)
  const prisma = new PrismaClient()
  try {
    await runIdentityGuarded([
      { count: () => prisma.navigationItem.count(), step: { cmd: 'seed:navigation', desc: 'Menu điều hướng công khai' } },
      { count: () => prisma.homepageSection.count(), step: { cmd: 'seed:homepage', desc: 'Cấu hình các khối trang chủ' } },
    ])
  } finally {
    await prisma.$disconnect()
  }

  // 4) DEMO (chỉ full)
  if (mode === 'full') {
    runStep(0, 0, { cmd: 'seed:all', desc: 'Demo: demo-accounts → production → workflow → content' })
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  ✅ SEED CÀI ĐẶT HOÀN TẤT                                      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`   Chế độ: ${mode} — Tổng thời gian: ${fmtDuration(Date.now() - startedAll)}`)
  console.log('🔑 Mật khẩu tài khoản hệ thống: TapChi@2025')
  if (mode === 'full') console.log('   (tài khoản tác giả demo luồng: Tacgia@2026)')
}

main().catch((e) => {
  console.error('❌ Lỗi orchestrator seed-full:', e)
  process.exit(1)
})
