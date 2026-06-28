// TypeScript types matching corpus.json schema từ TCVN3 extractor pipeline.

export interface CorpusAuthor {
  rank: string
  degree: string
  name: string
  affiliation: string
}

export interface CorpusParagraph {
  type: 'p' | 'h2'
  text: string
  pdf_chars?: number
}

export interface CorpusArticle {
  id: string
  page_start: number
  page_end: number
  page_count: number
  pdf_path: string
  section: string
  title: {
    main: string
    subtitle?: string
  }
  section_header?: string
  authors: CorpusAuthor[]
  affiliation: string
  abstract: {
    vi: string
    en: string
  }
  keywords: {
    vi: string[]
    en: string[]
  }
  body: {
    paragraphs: CorpusParagraph[]
  }
  references: string[]
  word_count?: number
}

export interface CorpusSection {
  name: string
  article_ids: string[]
}

export interface CorpusIssue {
  title: string
  name: string
  /** Slug do tcvn3-extractor sinh (vd "so-7-2026"); dùng làm fallback khi suy slug số báo. */
  slug?: string
  total_pages: number
  total_articles: number
}

export interface Corpus {
  issue: CorpusIssue
  sections: CorpusSection[]
  articles: CorpusArticle[]
}
