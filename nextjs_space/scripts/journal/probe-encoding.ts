/**
 * probe-encoding.ts — Công cụ chẩn đoán/hiệu chỉnh trích text số báo cũ.
 *
 *   npm run journal:probe-encoding -- <đường-dẫn-PDF>
 *
 * In ra: text thô pdftotext (dạng byte TCVN3 nếu font cũ), kết quả sau chuyển mã, engine
 * mà pipeline chọn, và các byte non-ASCII CHƯA có trong bảng mã (giúp bổ sung khi gặp
 * biến thể font khác). Dùng để kiểm chứng trước khi tin dùng cho một nguồn PDF mới.
 */

import path from 'path'
import { extractPdfTextPoppler, isPdftotextAvailable } from '@/lib/pdf-poppler-text'
import { looksLikeTcvn3, convertTcvn3 } from '@/lib/text-encoding/tcvn3-to-unicode'
import { looksLikeVietnameseProse } from '@/lib/pdf-text-quality'
import { extractVietnameseText } from '@/lib/services/journal-text-extract.service'

// Byte non-ASCII đã có trong bảng mã (để phát hiện byte lạ). Suy từ chính converter.
function mappedBytes(): Set<number> {
  const s = new Set<number>()
  for (let b = 0x80; b <= 0xff; b++) {
    if (convertTcvn3(String.fromCodePoint(b)) !== String.fromCodePoint(b)) s.add(b)
  }
  return s
}

async function main() {
  const pdf = process.argv[2]
  if (!pdf) {
    console.error('Cách dùng: npm run journal:probe-encoding -- <PDF>')
    process.exit(1)
  }
  const abs = path.resolve(pdf)

  if (!(await isPdftotextAvailable())) {
    console.error('❌ Không có pdftotext (poppler-utils). Cài: sudo apt install poppler-utils')
    process.exit(1)
  }

  const raw = await extractPdfTextPoppler(abs)
  const isTcvn3 = looksLikeTcvn3(raw)
  const converted = isTcvn3 ? convertTcvn3(raw) : raw

  console.log('─'.repeat(70))
  console.log(`PDF: ${abs}`)
  console.log(`pdftotext: ${raw.length} ký tự | TCVN3? ${isTcvn3} | prose thô? ${looksLikeVietnameseProse(raw)} | prose sau chuyển? ${looksLikeVietnameseProse(converted)}`)
  console.log('─'.repeat(70))
  console.log('THÔ (200 ký tự đầu):')
  console.log(raw.slice(0, 200).replace(/\s+/g, ' '))
  console.log('─'.repeat(70))
  console.log('SAU CHUYỂN MÃ (400 ký tự đầu):')
  console.log(converted.slice(0, 400).replace(/\s+/g, ' '))

  if (isTcvn3) {
    const mapped = mappedBytes()
    const unknown = new Map<number, number>()
    for (const ch of raw) {
      const cp = ch.codePointAt(0)!
      if (cp >= 0x80 && cp <= 0xff && !mapped.has(cp)) unknown.set(cp, (unknown.get(cp) ?? 0) + 1)
    }
    if (unknown.size) {
      console.log('─'.repeat(70))
      console.log('⚠️  Byte TCVN3 CHƯA có trong bảng mã (cần bổ sung nếu là chữ):')
      for (const [cp, n] of [...unknown.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`   0x${cp.toString(16).toUpperCase()} ${JSON.stringify(String.fromCodePoint(cp))} x${n}`)
      }
    }
  }

  console.log('─'.repeat(70))
  const res = await extractVietnameseText(abs, { ocr: true })
  console.log(`Pipeline chọn engine: ${res.source} | lowQuality=${res.lowQuality} | tcvn3=${res.tcvn3Applied} | ocr=${res.ocrApplied}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
