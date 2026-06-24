/**
 * _probe-so7.ts — script kiểm thử TẠM (read-only) chức năng số hóa trên file thật Số 7-2026.
 * Chạy đúng code của tính năng: extractPdfText + looksLikeVietnameseProse + ocrPdfToText + extractTocDraft.
 * Không ghi DB. Xóa sau khi kiểm thử xong.
 */
import 'dotenv/config'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { extractPdfText } from '@/lib/pdf-metadata'
import { looksLikeVietnameseProse } from '@/lib/pdf-text-quality'
import { ocrPdfToText, isOcrAvailable, terminateOcr } from '@/lib/ocr/pdf-ocr'
import { extractTocDraft } from '@/lib/services/journal-toc-parser.service'

const PDF = process.argv[2] || '/home/kelinton/Downloads/So 7.pdf'

async function main() {
  console.log('PDF:', PDF)
  const bytes = await fs.readFile(PDF)
  const doc = await PDFDocument.load(bytes)
  console.log('Total pages:', doc.getPageCount())

  // 1) Trích trực tiếp + cổng nhận diện TCVN3
  const sub = await PDFDocument.create()
  const pages = await sub.copyPages(doc, [0, 1, 2, 3])
  pages.forEach((p) => sub.addPage(p))
  const direct = await extractPdfText(Buffer.from(await sub.save()))
  console.log('\n=== (1) extractPdfText 4 trang đầu — 280 ký tự đầu ===')
  console.log(JSON.stringify(direct.slice(0, 280)))
  console.log('looksLikeVietnameseProse(direct) =', looksLikeVietnameseProse(direct),
    '  <-- nếu TRUE là cổng TCVN3 MISFIRE (bỏ qua OCR, lưu rác)')

  // 2) OCR 1 trang
  console.log('\n=== (2) OCR 1 trang đầu ===')
  console.log('isOcrAvailable =', await isOcrAvailable())
  const one = await PDFDocument.create()
  const [p0] = await one.copyPages(doc, [0])
  one.addPage(p0)
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'so7-'))
  const onePath = path.join(tmp, 'p1.pdf')
  await fs.writeFile(onePath, await one.save())
  const t0 = Date.now()
  const ocr = await ocrPdfToText(onePath)
  console.log('engine =', ocr.engine, '| pages =', ocr.pagesOcred, '| time(s) =', ((Date.now() - t0) / 1000).toFixed(1))
  console.log('OCR 280 ký tự đầu:', JSON.stringify(ocr.text.slice(0, 280)))
  console.log('looksLikeVietnameseProse(ocr) =', looksLikeVietnameseProse(ocr.text))
  await fs.rm(tmp, { recursive: true, force: true })

  // 3) Bóc tách mục lục
  console.log('\n=== (3) extractTocDraft (4 trang đầu) ===')
  const toc = await extractTocDraft(PDF, { tocPages: 4 })
  console.log('engine =', toc.engine, '| totalPdfPages =', toc.totalPdfPages, '| articles =', toc.articles.length)
  console.log(JSON.stringify(toc.articles.slice(0, 8), null, 2))

  await terminateOcr()
}

main().catch((e) => { console.error('FATAL', e); process.exitCode = 1 }).finally(() => process.exit())
