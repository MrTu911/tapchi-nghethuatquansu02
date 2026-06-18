/**
 * Smoke test cho sinh EPUB (lib/services/journal-epub.service.ts).
 * Dựng corpus.json tạm trong public/data/issues, sinh issue.epub, mở lại bằng JSZip và
 * kiểm cấu trúc EPUB tối thiểu (mimetype, container, opf, nav, ncx, chapter) — bảo đảm
 * file đọc được bằng EpubReader/epubjs.
 */

import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { buildIssueEpub } from '@/lib/services/journal-epub.service'

const SLUG = '__epub_test_so__'
const issueDir = path.join(process.cwd(), 'public', 'data', 'issues', SLUG)

const corpus = {
  issue: { title: 'Tạp chí Nghệ thuật Quân sự Việt Nam', name: 'Số test — 01/2026', total_pages: 30, total_articles: 2 },
  sections: [{ name: 'Chiến lược quân sự', article_ids: ['art_001', 'art_002'] }],
  articles: [
    {
      id: 'art_001', page_start: 5, page_end: 10, page_count: 6, pdf_path: 'articles_pdf/a1.pdf',
      section: 'Chiến lược quân sự',
      title: { main: 'Nghệ thuật chiến dịch & phòng thủ' },
      authors: [{ rank: 'Đại tá', degree: 'TS', name: 'Nguyễn Văn A', affiliation: 'HVQP' }],
      affiliation: 'HVQP',
      abstract: { vi: 'Tóm tắt bài một.', en: '' },
      keywords: { vi: ['chiến dịch'], en: [] },
      body: { paragraphs: [{ type: 'p', text: 'Đoạn nội dung <thử> ký tự đặc biệt & dấu.' }] },
      references: ['1. Tài liệu A', '2. Tài liệu B'],
    },
    {
      id: 'art_002', page_start: 11, page_end: 18, page_count: 8, pdf_path: 'articles_pdf/a2.pdf',
      section: 'Chiến lược quân sự',
      title: { main: 'Tư duy phòng thủ quân khu' },
      authors: [{ rank: 'Thượng tá', degree: 'ThS', name: 'Trần Văn B', affiliation: 'HVQP' }],
      affiliation: 'HVQP',
      abstract: { vi: '', en: '' },
      keywords: { vi: [], en: [] },
      body: { paragraphs: [] },
      references: [],
    },
  ],
}

describe('buildIssueEpub', () => {
  beforeAll(async () => {
    await fs.mkdir(issueDir, { recursive: true })
    await fs.writeFile(path.join(issueDir, 'corpus.json'), JSON.stringify(corpus), 'utf-8')
  })

  afterAll(async () => {
    await fs.rm(issueDir, { recursive: true, force: true })
  })

  it('sinh issue.epub đúng cấu trúc EPUB tối thiểu', async () => {
    const result = await buildIssueEpub(SLUG, { modified: '2026-01-01T00:00:00Z' })
    expect(result.chapters).toBe(2)
    expect(result.hasCover).toBe(false)
    expect(result.epubUrl).toBe(`/data/issues/${SLUG}/issue.epub`)

    const buffer = await fs.readFile(result.epubPath)
    const zip = await JSZip.loadAsync(buffer)

    expect(await zip.file('mimetype')!.async('string')).toBe('application/epub+zip')
    expect(zip.file('META-INF/container.xml')).toBeTruthy()
    expect(zip.file('OEBPS/content.opf')).toBeTruthy()
    expect(zip.file('OEBPS/nav.xhtml')).toBeTruthy()
    expect(zip.file('OEBPS/toc.ncx')).toBeTruthy()
    expect(zip.file('OEBPS/chap-001.xhtml')).toBeTruthy()
    expect(zip.file('OEBPS/chap-002.xhtml')).toBeTruthy()
  })

  it('escape ký tự đặc biệt + nhúng tham khảo trong chapter', async () => {
    const buffer = await fs.readFile(path.join(issueDir, 'issue.epub'))
    const zip = await JSZip.loadAsync(buffer)
    const chap1 = await zip.file('OEBPS/chap-001.xhtml')!.async('string')
    expect(chap1).toContain('Nghệ thuật chiến dịch')
    expect(chap1).toContain('&lt;thử&gt;') // ký tự < > được escape
    expect(chap1).toContain('Tài liệu tham khảo')
    expect(chap1).not.toContain('<thử>') // không để raw tag lọt vào XHTML
  })
})
