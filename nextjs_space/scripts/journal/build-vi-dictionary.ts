/**
 * build-vi-dictionary.ts — Dựng từ điển ÂM TIẾT tiếng Việt (có dấu) từ kho corpus.json sạch.
 *
 *   npm run journal:build-vi-dict
 *
 * Output: lib/text-encoding/vi-syllables.json = { "<âm tiết>": tần_suất, ... }.
 * Dùng để HIỆU CHỈNH per-bài các byte TCVN3 mơ hồ (font .Vn subset khác nhau giữa bài làm
 * một byte đổi nghĩa) — chọn dấu thanh cho ra nhiều âm tiết HỢP LỆ nhất. Air-gap, offline.
 */

import { promises as fs } from 'fs'
import path from 'path'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')
const OUT = path.join(process.cwd(), 'lib', 'text-encoding', 'vi-syllables.json')

// Âm tiết tiếng Việt: chỉ chữ cái Việt (gồm dấu), độ dài hợp lý.
const VI_SYLLABLE = /^[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{1,7}$/i

function tokenize(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/i)
    .filter((w) => w.length > 0 && VI_SYLLABLE.test(w))
}

async function main() {
  const issues = await fs.readdir(ISSUES_DATA_DIR).catch(() => [])
  const freq = new Map<string, number>()
  let articles = 0

  for (const issue of issues) {
    let corpus: any
    try {
      corpus = JSON.parse(await fs.readFile(path.join(ISSUES_DATA_DIR, issue, 'corpus.json'), 'utf-8'))
    } catch {
      continue
    }
    for (const a of corpus.articles ?? []) {
      articles++
      const parts: string[] = []
      if (a.title?.main) parts.push(a.title.main)
      if (a.abstract?.vi) parts.push(a.abstract.vi)
      for (const p of a.body?.paragraphs ?? []) if (p.text) parts.push(p.text)
      for (const tok of tokenize(parts.join(' '))) freq.set(tok, (freq.get(tok) ?? 0) + 1)
    }
  }

  // Giữ mọi âm tiết (đã lọc qua regex VI_SYLLABLE) để phủ rộng — thiếu âm tiết chỉ khiến
  // "không hiệu chỉnh" (an toàn), còn nhiễu freq thấp không thiên lệch dấu thanh có hệ thống.
  const dict: Record<string, number> = {}
  for (const [w, n] of freq) dict[w] = n

  await fs.mkdir(path.dirname(OUT), { recursive: true })
  await fs.writeFile(OUT, JSON.stringify(dict), 'utf-8')
  console.log(`Đã quét ${articles} bài, giữ ${Object.keys(dict).length} âm tiết tiếng Việt.`)
  console.log(`Ghi: ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
