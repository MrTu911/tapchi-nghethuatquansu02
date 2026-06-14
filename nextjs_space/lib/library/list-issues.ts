import fs from 'fs'
import path from 'path'

// Metadata một số trong Thư viện số, đọc từ public/data/issues/<slug>/corpus.json.
// Nguồn sự thật chung cho cả trang Thư viện (/library) lẫn tab Lưu trữ.
export interface LibraryIssueMeta {
  slug: string
  title: string
  issue: string // tên hiển thị, ví dụ "Số 6 — 06/2026"
  publisher: string
  articleCount: number
  coverUrl: string
  readerUrl: string
  year: number
}

const ISSUES_DIRNAME = path.join('public', 'data', 'issues')

// Quét thư mục corpus và trả về danh sách số đã số hóa (mới nhất trước).
export async function listLibraryIssues(): Promise<LibraryIssueMeta[]> {
  const issuesRoot = path.join(process.cwd(), ISSUES_DIRNAME)
  if (!fs.existsSync(issuesRoot)) return []

  const slugs = fs
    .readdirSync(issuesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse()

  const result: LibraryIssueMeta[] = []
  for (const slug of slugs) {
    const corpusPath = path.join(issuesRoot, slug, 'corpus.json')
    if (!fs.existsSync(corpusPath)) continue
    try {
      const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
      const issueInfo = corpus.issue || {}

      const yearMatch = slug.match(/\d{4}$/) || issueInfo.name?.match(/\d{4}$/)
      const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear()

      result.push({
        slug,
        title: issueInfo.title || 'Tạp chí',
        issue: issueInfo.name || slug,
        publisher: issueInfo.publisher || 'Học viện Quốc phòng',
        articleCount: (corpus.articles || []).length,
        coverUrl: `/data/issues/${slug}/cover.jpg`,
        readerUrl: `/data/issues/${slug}/reader.html`,
        year,
      })
    } catch {
      // Bỏ qua số có corpus.json hỏng
    }
  }
  return result
}
