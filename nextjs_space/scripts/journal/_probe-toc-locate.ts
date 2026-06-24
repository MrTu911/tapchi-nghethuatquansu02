/** TẠM: OCR vài trang chỉ định để tìm trang Mục lục trong số báo. Xóa sau khi xong. */
import 'dotenv/config'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { ocrPdfToText, terminateOcr } from '@/lib/ocr/pdf-ocr'

const PDF = process.argv[2] || '/home/kelinton/Downloads/So 7.pdf'
// trang in (1-based) cần soi: 2 trang cuối + vài trang đầu sau bìa
const pagesArg = process.argv[3]

async function main() {
  const doc = await PDFDocument.load(await fs.readFile(PDF))
  const total = doc.getPageCount()
  const probe = pagesArg
    ? pagesArg.split(',').map((n) => parseInt(n, 10))
    : [total - 1, total, 2, 3]
  console.log('PDF:', PDF, '| total:', total, '| soi trang (1-based):', probe.join(', '))
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'loc-'))
  for (const p of probe) {
    if (p < 1 || p > total) continue
    const sub = await PDFDocument.create()
    const [pg] = await sub.copyPages(doc, [p - 1])
    sub.addPage(pg)
    const fp = path.join(tmp, `p${p}.pdf`)
    await fs.writeFile(fp, await sub.save())
    const r = await ocrPdfToText(fp)
    const t = r.text.replace(/\s+/g, ' ').trim()
    const hit = /M[UỤ]C\s*L[UỤ]C|CONTENTS|MUC LUC/i.test(t)
    console.log(`\n--- Trang ${p} --- ${hit ? '★ CÓ DẤU HIỆU MỤC LỤC' : ''}`)
    console.log(t.slice(0, 240))
  }
  await fs.rm(tmp, { recursive: true, force: true })
  await terminateOcr()
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => process.exit())
