/**
 * build-epub.ts (CLI)
 *
 * Sinh issue.epub từ corpus.json đã có của một số (hoặc tất cả các số có corpus).
 * Hữu ích để tạo EPUB cho kho số đã nhập trước đây, hoặc debug riêng bước EPUB.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/build-epub.ts so-5-2026
 *   npx tsx --require dotenv/config scripts/journal/build-epub.ts --all
 */

import 'dotenv/config'
import { buildIssueEpub } from '@/lib/services/journal-epub.service'
import { listCorpusSlugs } from '@/lib/services/journal-corpus-import.service'

async function main(): Promise<void> {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Cần slug số báo hoặc --all. Vd: scripts/journal/build-epub.ts so-5-2026')
    process.exitCode = 1
    return
  }

  const slugs = arg === '--all' ? await listCorpusSlugs() : [arg]
  console.log(`\n=== Sinh EPUB cho ${slugs.length} số ===\n`)

  let ok = 0
  for (const slug of slugs) {
    try {
      const result = await buildIssueEpub(slug)
      console.log(`✓ ${slug}: ${result.chapters} bài → ${result.epubUrl}${result.hasCover ? ' (có bìa)' : ''}`)
      ok++
    } catch (err) {
      console.error(`✗ ${slug}: ${err instanceof Error ? err.message : err}`)
    }
  }
  console.log(`\nXong: ${ok}/${slugs.length} số.\n`)
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err)
  process.exitCode = 1
})
