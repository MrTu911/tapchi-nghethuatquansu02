/**
 * journal-epub.service.ts
 *
 * Sinh file EPUB cho một số tạp chí TỪ corpus.json (nguồn sự thật đã làm sạch).
 * EPUB = file .zip theo chuẩn OPF/NCX; dựng thủ công bằng jszip để chạy HOÀN TOÀN
 * offline (air-gap) — không fetch ảnh/font từ mạng như các thư viện epub-gen.
 *
 * Hỗ trợ ẢNH: ảnh minh họa trong bài (paragraph type='image') + ảnh đầu/cuối số
 * (corpus.frontMatter/backMatter) được nhúng vào OEBPS/images/ và khai báo manifest.
 *
 * Output: public/data/issues/<slug>/issue.epub  → URL /data/issues/<slug>/issue.epub
 * Mỗi bài = 1 chapter. Mục lục (nav.xhtml + toc.ncx) dựng theo thứ tự bài trong corpus.
 */

import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import type { Corpus, CorpusArticle, CorpusAuthor, CorpusImagePage } from '@/types/corpus'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')

export interface BuildEpubResult {
  epubPath: string
  epubUrl: string
  chapters: number
  hasCover: boolean
  images: number
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

function mediaType(file: string): string {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

const STYLESHEET = `body{font-family:serif;line-height:1.6;margin:1em;}
h1{font-size:1.4em;line-height:1.3;}
h2{font-size:1.1em;margin-top:1.2em;}
.authors{font-style:italic;color:#333;margin:.3em 0 1em;}
.abstract{background:#f4f4f4;padding:.6em .8em;border-left:3px solid #1E3924;margin:1em 0;}
.section-label{color:#1E3924;font-weight:bold;text-transform:uppercase;font-size:.85em;letter-spacing:.05em;}
.references{margin-top:1.5em;border-top:1px solid #ccc;padding-top:.8em;font-size:.92em;}
.references li{margin-bottom:.4em;}
figure{margin:1em 0;text-align:center;}
figure img{max-width:100%;height:auto;}
figcaption{font-size:.9em;color:#555;font-style:italic;margin-top:.3em;}
.matter{margin:0;text-align:center;}
.matter img{max-width:100%;height:auto;}`

/** XHTML một chapter (một bài báo). `imgHref` map src corpus → href trong EPUB (hoặc null nếu thiếu). */
function buildChapterXhtml(article: CorpusArticle, imgHref: (src: string) => string | null): string {
  const title = escapeXml(articleTitle(article))
  const authors = article.authors.map(authorDisplay).filter(Boolean).join('; ')
  const sectionLabel = article.section ? `<p class="section-label">${escapeXml(article.section)}</p>` : ''
  const authorsHtml = authors ? `<p class="authors">${escapeXml(authors)}</p>` : ''
  const abstractHtml = article.abstract?.vi?.trim()
    ? `<div class="abstract"><strong>Tóm tắt: </strong>${escapeXml(article.abstract.vi.trim())}</div>`
    : ''

  const body = (article.body?.paragraphs ?? [])
    .map((p) => {
      if (p.type === 'image') {
        const href = p.src ? imgHref(p.src) : null
        if (!href) return ''
        const cap = p.caption?.trim() ? `<figcaption>${escapeXml(p.caption.trim())}</figcaption>` : ''
        return `<figure><img src="${href}" alt="${escapeXml(p.caption?.trim() ?? 'Hình')}"/>${cap}</figure>`
      }
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

/** XHTML một trang ảnh đầu/cuối số. */
function buildMatterXhtml(href: string, caption?: string): string {
  const cap = caption?.trim() ? `<p class="figcaption">${escapeXml(caption.trim())}</p>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi" lang="vi">
<head><meta charset="utf-8"/><title>Trang ảnh</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><div class="matter"><img src="${href}" alt="${escapeXml(caption ?? 'Ảnh')}"/>${cap}</div></body>
</html>`
}

function buildContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
}

interface ManifestItem { id: string; href: string; mediaType: string; properties?: string }
interface SpineItem { idref: string; linear?: boolean }
interface NavItem { href: string; title: string }

function buildContentOpf(params: {
  bookId: string
  title: string
  language: string
  manifest: ManifestItem[]
  spine: SpineItem[]
  hasCover: boolean
  modified: string
}): string {
  const { bookId, title, language, manifest, spine, hasCover, modified } = params
  const coverMeta = hasCover ? `<meta name="cover" content="cover-image"/>` : ''
  const manifestItems = manifest
    .map((m) => `<item id="${m.id}" href="${m.href}" media-type="${m.mediaType}"${m.properties ? ` properties="${m.properties}"` : ''}/>`)
    .join('\n    ')
  const spineItems = spine
    .map((s) => `<itemref idref="${s.idref}"${s.linear === false ? ' linear="no"' : ''}/>`)
    .join('\n    ')
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
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`
}

function buildNavXhtml(title: string, items: NavItem[]): string {
  const li = items.map((c) => `<li><a href="${c.href}">${escapeXml(c.title)}</a></li>`).join('\n      ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="vi" lang="vi">
<head><meta charset="utf-8"/><title>Mục lục</title></head>
<body>
  <nav epub:type="toc" id="toc"><h1>${escapeXml(title)}</h1><ol>
      ${li}
  </ol></nav>
</body>
</html>`
}

function buildTocNcx(bookId: string, title: string, items: NavItem[]): string {
  const navPoints = items
    .map((c, i) => `<navPoint id="nav-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(c.title)}</text></navLabel>
      <content src="${c.href}"/>
    </navPoint>`)
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

/** Đọc bytes ảnh từ gói số theo src corpus; trả null nếu thiếu. */
async function readIssueImage(issueDir: string, src: string): Promise<Buffer | null> {
  try {
    const clean = src.replace(/^\/+/, '').replace(/\.\.(\/|\\)/g, '')
    return await fs.readFile(path.join(issueDir, clean))
  } catch {
    return null
  }
}

/**
 * Đọc corpus.json của một số rồi sinh issue.epub trong cùng thư mục (kèm ảnh nếu có).
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

  // Cover.
  let coverBuffer: Buffer | null = null
  try { coverBuffer = await fs.readFile(path.join(issueDir, 'cover.jpg')) } catch { coverBuffer = null }
  const hasCover = coverBuffer !== null

  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', buildContainerXml())
  const oebps = zip.folder('OEBPS')!
  oebps.file('style.css', STYLESHEET)

  // ── Ảnh: thu thập src (ảnh bài + front/back matter), copy vào OEBPS/images/, tạo map href.
  const manifest: ManifestItem[] = [
    { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' },
    { id: 'ncx', href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
    { id: 'style', href: 'style.css', mediaType: 'text/css' },
  ]
  if (hasCover && coverBuffer) {
    oebps.file('cover.jpg', coverBuffer)
    oebps.file('cover.xhtml', buildCoverXhtml())
    manifest.push({ id: 'cover-image', href: 'cover.jpg', mediaType: 'image/jpeg', properties: 'cover-image' })
    manifest.push({ id: 'cover', href: 'cover.xhtml', mediaType: 'application/xhtml+xml' })
  }

  const srcToHref = new Map<string, string>()
  let imgCount = 0
  const embedImage = async (src: string): Promise<string | null> => {
    if (srcToHref.has(src)) return srcToHref.get(src)!
    const buf = await readIssueImage(issueDir, src)
    if (!buf) return null
    imgCount++
    const ext = path.extname(src).toLowerCase() || '.png'
    const href = `images/img-${String(imgCount).padStart(4, '0')}${ext}`
    oebps.file(href, buf)
    manifest.push({ id: `img-${imgCount}`, href, mediaType: mediaType(src) })
    srcToHref.set(src, href)
    return href
  }

  // Nhúng trước tất cả ảnh bài (để buildChapterXhtml tra được href đồng bộ).
  for (const article of corpus.articles) {
    for (const p of article.body?.paragraphs ?? []) {
      if (p.type === 'image' && p.src) await embedImage(p.src)
    }
  }
  const imgHref = (src: string): string | null => srcToHref.get(src) ?? null

  // ── Front/back matter pages.
  const matterPage = async (m: CorpusImagePage, kind: 'front' | 'back', idx: number): Promise<SpineItem | null> => {
    const href = await embedImage(m.src)
    if (!href) return null
    const id = `${kind}-${idx + 1}`
    const xhtml = `${id}.xhtml`
    oebps.file(xhtml, buildMatterXhtml(href, m.caption))
    manifest.push({ id, href: xhtml, mediaType: 'application/xhtml+xml' })
    return { idref: id }
  }
  const frontSpine: SpineItem[] = []
  for (let i = 0; i < (corpus.frontMatter?.length ?? 0); i++) {
    const s = await matterPage(corpus.frontMatter![i], 'front', i)
    if (s) frontSpine.push(s)
  }
  const backSpine: SpineItem[] = []
  for (let i = 0; i < (corpus.backMatter?.length ?? 0); i++) {
    const s = await matterPage(corpus.backMatter![i], 'back', i)
    if (s) backSpine.push(s)
  }

  // ── Chapters (bài).
  const navItems: NavItem[] = []
  corpus.articles.forEach((article, i) => {
    const id = `chap-${String(i + 1).padStart(3, '0')}`
    const href = `${id}.xhtml`
    oebps.file(href, buildChapterXhtml(article, imgHref))
    manifest.push({ id, href, mediaType: 'application/xhtml+xml' })
    navItems.push({ href, title: articleTitle(article) })
  })

  // ── Spine: [cover] [front matter] [nav] [chapters] [back matter].
  const spine: SpineItem[] = []
  if (hasCover) spine.push({ idref: 'cover' })
  spine.push(...frontSpine)
  spine.push({ idref: 'nav', linear: false })
  corpus.articles.forEach((_, i) => spine.push({ idref: `chap-${String(i + 1).padStart(3, '0')}` }))
  spine.push(...backSpine)

  oebps.file('content.opf', buildContentOpf({ bookId, title: bookTitle, language, manifest, spine, hasCover, modified }))
  oebps.file('nav.xhtml', buildNavXhtml(bookTitle, navItems))
  oebps.file('toc.ncx', buildTocNcx(bookId, bookTitle, navItems))

  const epubPath = path.join(issueDir, 'issue.epub')
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  await fs.writeFile(epubPath, buffer)

  return {
    epubPath,
    epubUrl: `/data/issues/${slug}/issue.epub`,
    chapters: corpus.articles.length,
    hasCover,
    images: imgCount,
  }
}
