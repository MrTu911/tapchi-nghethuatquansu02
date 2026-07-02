/**
 * tcvn3-calibrate.ts
 *
 * HIỆU CHỈNH per-bài bảng mã TCVN3 để xử lý biến thể font .Vn subset.
 *
 * Vấn đề: mỗi PDF/bài subset font .Vn khác nhau → một byte (vd 0xED, 0xF9) có thể ứng với
 * dấu thanh KHÁC nhau giữa các bài (vd "ĐỔI MỠI" thay vì "ĐỔI MỚI"). Không có bảng mã toàn
 * cục nào đúng cho mọi subset.
 *
 * Giải pháp (dựa trên DỮ LIỆU THẬT): với mỗi byte nguyên-âm-có-dấu trong bài, thử các dấu
 * thanh cùng nguyên âm nền và chọn dấu cho ra NHIỀU ÂM TIẾT HỢP LỆ nhất (đối chiếu từ điển
 * âm tiết tiếng Việt dựng từ kho corpus sạch — lib/text-encoding/vi-syllables.json). Greedy
 * theo từng byte; chỉ ghi đè khi CẢI THIỆN rõ (an toàn: không đủ dữ liệu thì giữ bảng gốc).
 */

import { TCVN3_MAP, convertTcvn3 } from '@/lib/text-encoding/tcvn3-to-unicode'
// Từ điển sinh bởi: npm run journal:build-vi-dict (kho corpus sạch). Tĩnh, air-gap.
import viSyllables from '@/lib/text-encoding/vi-syllables.json'

const DICT = viSyllables as Record<string, number>

// Nhóm nguyên âm theo NỀN, mỗi nhóm gồm base + 5 dấu thanh (thường). Dùng để sinh ứng viên.
const TONE_GROUPS = [
  'aàáảãạ', 'ăằắẳẵặ', 'âầấẩẫậ',
  'eèéẻẽẹ', 'êềếểễệ',
  'iìíỉĩị',
  'oòóỏõọ', 'ôồốổỗộ', 'ơờớởỡợ',
  'uùúủũụ', 'ưừứửữự',
  'yỳýỷỹỵ',
]
const GROUP_OF = new Map<string, string>()
for (const g of TONE_GROUPS) for (const ch of g) GROUP_OF.set(ch, g)

// Ngưỡng: chỉ hiệu chỉnh byte xuất hiện đủ nhiều & khi ứng viên tốt hơn rõ.
const MIN_WORDS = 3
const MIN_GAIN = 2

const isAsciiCp = (cp: number) => cp <= 0x7f

function toneGroupOf(ch: string): string | undefined {
  return GROUP_OF.get(ch.toLowerCase())
}

/** Tách chuỗi TCVN3 thô thành "từ" (giữ nguyên byte gốc để còn ánh xạ). */
function rawWords(raw: string): string[] {
  return raw.split(/[\s.,;:!?()"'“”\[\]/–—•*0-9]+/).filter((w) => w.length > 1)
}

/** Chuyển một từ thô với override rồi bỏ hoa/NFC để tra từ điển. */
function convertWordLower(word: string, overrides: Record<number, string>): string {
  let out = ''
  for (const ch of word) {
    const cp = ch.codePointAt(0)!
    out += overrides[cp] ?? TCVN3_MAP[cp] ?? ch
  }
  return out.normalize('NFC').toLowerCase()
}

function wordHasByte(word: string, byte: number): boolean {
  for (const ch of word) if (ch.codePointAt(0) === byte) return true
  return false
}

/**
 * Chuyển TCVN3 → Unicode CÓ HIỆU CHỈNH per-bài theo từ điển.
 * Trả text đã chuyển; nếu không cần/không thể hiệu chỉnh thì tương đương convertTcvn3 thường.
 */
export function convertTcvn3Calibrated(raw: string): string {
  if (!raw) return raw

  const words = rawWords(raw)
  if (words.length === 0) return convertTcvn3(raw)

  // Các byte nguyên-âm-có-dấu xuất hiện trong bài (ứng viên hiệu chỉnh), kèm số từ chứa nó.
  const byteWordCount = new Map<number, number>()
  for (const w of words) {
    const seen = new Set<number>()
    for (const ch of w) {
      const cp = ch.codePointAt(0)!
      if (isAsciiCp(cp) || seen.has(cp)) continue
      seen.add(cp)
      const def = TCVN3_MAP[cp]
      if (def && toneGroupOf(def)) byteWordCount.set(cp, (byteWordCount.get(cp) ?? 0) + 1)
    }
  }

  const overrides: Record<number, string> = {}
  // Xử lý byte phổ biến trước (ổn định hơn), dùng override đã quyết cho các byte sau.
  const bytes = [...byteWordCount.entries()].filter(([, n]) => n >= MIN_WORDS).sort((a, b) => b[1] - a[1])

  for (const [byte] of bytes) {
    const def = TCVN3_MAP[byte]
    const group = toneGroupOf(def)!
    const affected = words.filter((w) => wordHasByte(w, byte))

    const scoreOf = (cand: string): number => {
      let ok = 0
      for (const w of affected) {
        const conv = convertWordLower(w, { ...overrides, [byte]: cand })
        if (DICT[conv]) ok++
      }
      return ok
    }

    const defScore = scoreOf(def)
    let best = def
    let bestScore = defScore
    for (const cand of group) {
      if (cand === def) continue
      const s = scoreOf(cand)
      if (s > bestScore) { bestScore = s; best = cand }
    }
    // Chỉ ghi đè khi cải thiện đủ rõ so với bảng gốc.
    if (best !== def && bestScore - defScore >= MIN_GAIN) {
      overrides[byte] = best
    }
  }

  return convertTcvn3(raw, overrides)
}
