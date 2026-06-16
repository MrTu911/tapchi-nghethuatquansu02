/**
 * Branding Guard — chống tái phát identity của codebase nguồn (tapchi-hcqs).
 *
 * Quét toàn bộ source (runtime code + seed scripts) và FAIL nếu xuất hiện
 * bất kỳ token nhận dạng cũ KHÔNG mơ hồ nào của Học viện Hậu cần / tạp chí hcqs.
 *
 * LƯU Ý: KHÔNG cấm các từ vựng quân sự hợp lệ như "hậu cần" / "logistics"
 * (hậu cần là một phần của nghệ thuật quân sự — xuất hiện hợp pháp trong bài
 * viết về chiến dịch, tác chiến). Chỉ cấm các chuỗi gắn chặt với brand cũ.
 *
 * Nếu test này fail: có file mới mang branding cũ — grep token và rebrand theo
 * .claude/rules/journal-identity.md trước khi merge.
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'

// Tập token NHẬN DẠNG thuần của brand cũ — luôn sai trong MỌI ngữ cảnh.
// (Cố ý KHÔNG ban "hậu cần"/"military logistics" đứng riêng: đó là từ vựng quân sự
//  hợp lệ — hậu cần là một phần của nghệ thuật quân sự, xuất hiện hợp pháp trong
//  bài viết về chiến dịch/tác chiến. Việc rà phạm vi/chủ đề là việc biên tập, không
//  thuộc guard cơ học này.)
const FORBIDDEN_TOKENS: string[] = [
  'tapchinckhhcqs',          // domain/email cũ (tapchinckhhcqs.vn / .abacusai.app)
  'hocvienhaucan',           // domain/email cũ Học viện Hậu cần (hocvienhaucan.edu.vn, ...hqd.edu.vn)
  'HVHC',                    // viết tắt Học viện Hậu cần
  'Học viện Hậu cần',
  'Trường Hậu cần',
  'TCKHHCQS',                // viết tắt tạp chí cũ
  '2734-9888',               // ISSN cũ (đúng phải là 1859-0454)
  'Logistics Academy',       // tên tiếng Anh của Học viện Hậu cần
  'Journal of Military Logistics', // tên tiếng Anh tạp chí cũ
]

const ROOT = join(__dirname, '..', '..')

// Quét nghiêm ngặt RUNTIME code — code ship tới người dùng trong mọi build
// (email, SEO, citation, trang public, UI). Đây phải luôn = 0 token brand cũ.
//
// CỐ Ý KHÔNG quét scripts/ và prisma/seed-*.ts: đó là seed DEMO/test, chứa nhiều
// tham chiếu demo (ảnh theme, DOI mẫu, email tự sinh) cần rà thủ công khi seed lại,
// không gate ở guard cơ học. middleware.ts (root) được kiểm riêng.
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks']
const EXTRA_FILES = ['middleware.ts']
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'docs', 'logs'])

function collectSourceFiles(dir: string, acc: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      collectSourceFiles(full, acc)
    } else if (SCAN_EXTS.has(extname(entry))) {
      acc.push(full)
    }
  }
}

function listScannedFiles(): string[] {
  const files: string[] = []
  for (const d of SCAN_DIRS) collectSourceFiles(join(ROOT, d), files)
  for (const f of EXTRA_FILES) files.push(join(ROOT, f))
  return files
}

describe('Branding guard — không còn identity tapchi-hcqs trong source', () => {
  const files = listScannedFiles()

  it('quét được một lượng file source hợp lý (> 100)', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  for (const token of FORBIDDEN_TOKENS) {
    it(`không file source nào chứa token cũ: "${token}"`, () => {
      const lowerToken = token.toLowerCase()
      const offenders: string[] = []
      for (const file of files) {
        const content = readFileSync(file, 'utf8').toLowerCase()
        if (content.includes(lowerToken)) {
          offenders.push(file.replace(ROOT + '/', ''))
        }
      }
      expect(offenders).toEqual([])
    })
  }
})

// ── Mở rộng (CMS test pass): seed dữ liệu phải sạch identity cũ + đúng NTQS ──
//
// Quét các file seed có nguy cơ lẫn branding cũ: seed nhận dạng (site-settings,
// trang tĩnh, CMS) và seed DEMO đã được làm sạch token cũ ở đợt F3 (news/video,
// web-crawler, demo-data). Khóa lại để chống tái phát.
//
// LƯU Ý: từ "hậu cần" đứng riêng KHÔNG bị cấm (từ vựng quân sự hợp lệ) — chỉ cấm
// các token nhận dạng gắn chặt brand cũ trong FORBIDDEN_TOKENS.
const SCANNED_SEED_FILES = [
  'prisma/seed-site-settings.ts',
  'prisma/seed-public-pages.ts',
  'scripts/seed-public-pages.ts',
  'scripts/seed-cms-data.ts',
  'prisma/seed-news-videos.ts',
  'prisma/seed-webcrawler.ts',
  'prisma/seed-demo-data.ts',
]

function fileExists(p: string): boolean {
  try {
    statSync(p)
    return true
  } catch {
    return false
  }
}

describe('Branding guard — seed dùng đúng identity NTQS, không còn token cũ', () => {
  for (const rel of SCANNED_SEED_FILES) {
    const full = join(ROOT, rel)
    const runOrSkip = fileExists(full) ? it : it.skip

    for (const token of FORBIDDEN_TOKENS) {
      runOrSkip(`${rel} không chứa token cũ "${token}"`, () => {
        const content = readFileSync(full, 'utf8').toLowerCase()
        expect(content.includes(token.toLowerCase())).toBe(false)
      })
    }
  }

  it('seed-site-settings.ts khai báo đúng nhận dạng NTQS (tên, đơn vị, ISSN, email)', () => {
    const content = readFileSync(join(ROOT, 'prisma/seed-site-settings.ts'), 'utf8')
    expect(content).toContain('Tạp chí Nghệ thuật Quân sự Việt Nam')
    expect(content).toContain('Học viện Quốc phòng')
    expect(content).toContain('1859-0454') // ISSN đúng của NTQS
    expect(content).toContain('tapchintqsvn@gmail.com') // email tòa soạn NTQS
  })
})
