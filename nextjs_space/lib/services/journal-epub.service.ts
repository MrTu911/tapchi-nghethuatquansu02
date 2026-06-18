/**
 * journal-epub.service.ts
 *
 * Sinh file EPUB cho một số tạp chí TỪ corpus.json (nguồn sự thật đã làm sạch).
 * EPUB = file .zip theo chuẩn OPF/NCX; dựng thủ công bằng jszip để chạy HOÀN TOÀN
 * offline (air-gap) — không fetch ảnh/sông từ mạng như các thư viện epub-gen.
 *
 * Output: public/data/issues/<slug>/issue.epub  → URL /data/issues/<slug>/issue.epub
 * Đọc được bằng EpubReader (epubjs) sẵn có và mọi app đọc EPUB tiêu chuẩn.
 *
 * Mỗi bài = 1 chapter. Mục lục (nav.xhtml + toc.ncx) dựng theo thứ tự bài trong corpus.
 */

import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import type { Corpus, CorpusArticle, CorpusAuthor } from '@/types/corpus'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')

export interface BuildEpubResult {
  epubPath: string
  epubUrl: string
  chapters: number
  hasCover: boolean
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function authorDisplay(author: CorpusAuthor): string {
  return [author.rank, author.degree, author.name].map((s) => s?.trim()).filter(Boolean).join(' ')
}

function articleTitle(article: CorpusArticle): string {
  const main = article.title?.main?.trim() ?? ''
  const subtitle = article.title?.subtitle?.trim()
  return subtitle ? `${main} — ${subtitle}` : main
}

const STYLESHEET = `body{font-family:serif;line-height:1.6;margin:1em;}
h1{font-size:1.4em;line-height:1.3;}
h2{font-size:1.1em;margin-top:1.2em;}
.authors{font-style:italic;color:#333;margin:.3em 0 1em;}
.abstract{background:#f4f4f4;padding:.6em .8em;border-left:3px solid #1E3924;margin:1em 0;}
.section-label{color:#1E3924;font-weight:bold;text-transform:uppercase;font-size:.85em;letter-spacing:.05em;}
.references{margin-top:1.5em;border-top:1px solid #ccc;padding-top:.8em;font-size:.92em;}
.references li{margin-bottom:.4em;}`

/** XHTML một chapter (một bài báo). */
function buildChapterXhtml(article: CorpusArticle): string {
  const title = escapeXml(articleTitle(article))
  const authors = article.authors.map(authorDisplay).filter(Boolean).join('; ')
  const sectionLabel = article.section ? `<p class="section-label">${escapeXml(article.section)}</p>` : ''
  const authorsHtml = authors ? `<p class="authors">${escapeXml(authors)}</p>` : ''
  const abstractHtml = article.abstract?.vi?.trim()
    ? `<div class="abstract"><strong>Tóm tắt: </strong>${escapeXml(article.abstract.vi.trim())}</div>`
    : ''

  const body = (article.body?.paragraphs ?? [])
    .map((p) => {
      const text = escapeXml(p.text?.trim() ?? '')
      if (!text) return ''
      return p.type === 'h2' ? `<h2>${text}</h2>` : `<p>${text}</p>`
    })
    .filter(Boolean)
    .join('\n')

  const references = article.references?.length
    ? `<div class="references"><h2>Tài liệu tham khảo</h2><ol>${article.references
        .map((r) => `<li>${escapeXml(r.replace(/^\s*\d{1,3}\.\s*/, ''))}</li>`)
        .join('')}</ol></div>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi" lang="vi">
<head><meta charset="utf-8"/><title>${title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
${sectionLabel}
<h1>${title}</h1>
${authorsHtml}
${abstractHtml}
${body || '<p><em>Bài này chưa trích được toàn văn (PDF bản scan). Xem bản PDF gốc trong thư viện số.</em></p>'}
${references}
</body>
</html>`
}

function buildContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
}

interface ChapterRef {
  id: string
  href: string
  title: string
}

function buildContentOpf(params: {
  bookId: string
  title: string
  language: string
  chapters: ChapterRef[]
  hasCover: boolean
  modified: string
}): string {
  const { bookId, title, chapters, hasCover, modified, language } = params

  const coverManifest = hasCover
    ? `<item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`
    : ''
  const coverMeta = hasCover ? `<meta name="cover" content="cover-image"/>` : ''
  const coverSpine = hasCover ? `<itemref idref="cover" linear="yes"/>` : ''

  const manifestItems = chapters
    .map((c) => `<item id="${c.id}" href="${c.href}" media-type="application/xhtml+xml"/>`)
    .join('\n    ')
  const spineItems = chapters.map((c) => `<itemref idref="${c.id}"/>`).join('\n    ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(bookId)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${language}</dc:language>
    <dc:publisher>Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng</dc:publisher>
    <meta property="dcterms:modified">${modified}</meta>
    ${coverMeta}
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    ${coverManifest}
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${coverSpine}
    <itemref idref="nav" linear="no"/>
    ${spineItems}
  </spine>
</package>`
}

function buildNavXhtml(title: string, chapters: ChapterRef[]): string {
  const items = chapters
    .map((c) => `<li><a href="${c.href}">${escapeXml(c.title)}</a></li>`)
    .join('\n      ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="vi" lang="vi">
<head><meta charset="utf-8"/><title>Mục lục</title></head>
<body>
  <nav epub:type="toc" id="toc"><h1>${escapeXml(title)}</h1><ol>
      ${items}
  </ol></nav>
</body>
</html>`
}

function buildTocNcx(bookId: string, title: string, chapters: ChapterRef[]): string {
  const navPoints = chapters
    .map(
      (c, i) => `<navPoint id="nav-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(c.title)}</text></navLabel>
      <content src="${c.href}"/>
    </navPoint>`,
    )
    .join('\n    ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${escapeXml(bookId)}"/></head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`
}

function buildCoverXhtml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi" lang="vi">
<head><meta charset="utf-8"/><title>Bìa</title></head>
<body style="margin:0;text-align:center;"><img src="cover.jpg" alt="Bìa số tạp chí" style="max-width:100%;height:auto;"/></body>
</html>`
}

/**
 * Đọc corpus.json của một số rồi sinh issue.epub trong cùng thư mục.
 * `modified` truyền vào để service THUẦN/tái lập (tránh phụ thuộc thời điểm chạy).
 */
export async function buildIssueEpub(
  slug: string,
  options: { modified?: string } = {},
): Promise<BuildEpubResult> {
  const issueDir = path.join(ISSUES_DATA_DIR, slug)
  const corpusRaw = await fs.readFile(path.join(issueDir, 'corpus.json'), 'utf-8')
  const corpus = JSON.parse(corpusRaw) as Corpus

  const bookTitle = `${corpus.issue.title} — ${corpus.issue.name}`
  const bookId = `urn:ntqs:${slug}`
  const language = 'vi'
  const modified = options.modified ?? new Date().toISOString().replace(/\.\d+Z$/, 'Z')

  // Cover (nếu corpus build đã sinh cover.jpg)
  let coverBuffer: Buffer | null = null
  try {
    coverBuffer = await fs.readFile(path.join(issueDir, 'cover.jpg'))
  } catch {
    coverBuffer = null
  }
  const hasCover = coverBuffer !== null

  const chapters: ChapterRef[] = corpus.articles.map((article, i) => ({
    id: `chap-${String(i + 1).padStart(3, '0')}`,
    href: `chap-${String(i + 1).padStart(3, '0')}.xhtml`,
    title: articleTitle(article),
  }))

  const zip = new JSZip()
  // mimetype PHẢI là entry đầu tiên và KHÔNG nén.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', buildContainerXml())

  const oebps = zip.folder('OEBPS')!
  oebps.file('style.css', STYLESHEET)
  oebps.file('content.opf', buildContentOpf({ bookId, title: bookTitle, language, chapters, hasCover, modified }))
  oebps.file('nav.xhtml', buildNavXhtml(bookTitle, chapters))
  oebps.file('toc.ncx', buildTocNcx(bookId, bookTitle, chapters))
  if (coverBuffer) {
    oebps.file('cover.jpg', coverBuffer)
    oebps.file('cover.xhtml', buildCoverXhtml())
  }
  corpus.articles.forEach((article, i) => {
    oebps.file(`chap-${String(i + 1).padStart(3, '0')}.xhtml`, buildChapterXhtml(article))
  })

  const epubPath = path.join(issueDir, 'issue.epub')
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  await fs.writeFile(epubPath, buffer)

  return {
    epubPath,
    epubUrl: `/data/issues/${slug}/issue.epub`,
    chapters: chapters.length,
    hasCover,
  }
}
