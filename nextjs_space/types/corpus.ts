// TypeScript types matching corpus.json schema từ TCVN3 extractor pipeline.

export interface CorpusAuthor {
  rank: string
  degree: string
  name: string
  affiliation: string
}

export interface CorpusParagraph {
  type: 'p' | 'h2' | 'image'
  /** Với type 'image': để trống (dùng src). Với 'p'/'h2': nội dung text. */
  text: string
  pdf_chars?: number
  /** Chỉ dùng khi type='image': đường dẫn ảnh tương đối trong gói số (vd 'articles_img/<slug>/img-001.png'). */
  src?: string
  /** Chú thích ảnh (tuỳ chọn). */
  caption?: string
}

/** Trang ảnh chèn đầu/cuối số cho EPUB + bản đọc (do biên tập viên tải lên). */
export interface CorpusImagePage {
  /** Đường dẫn ảnh tương đối trong gói số (vd 'matter/front-01.jpg'). */
  src: string
  caption?: string
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
  /** Ảnh trang đầu số (sau bìa) — cho EPUB + bản đọc. */
  frontMatter?: CorpusImagePage[]
  /** Ảnh trang cuối số. */
  backMatter?: CorpusImagePage[]
}
