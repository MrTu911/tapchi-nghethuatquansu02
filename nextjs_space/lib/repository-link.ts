/**
 * Repository article link routing.
 *
 * CSDL Bài báo gộp hai nguồn khác model:
 *  - PEER_REVIEW   → model `Article` (bài qua phản biện) đọc ở /repository/[id]
 *  - JOURNAL_IMPORT → model `JournalArticle` (kho số cũ) đọc ở /journal-articles/[id]
 *
 * Trang /repository/[id] chỉ truy vấn `Article`, nên nếu link bài JOURNAL_IMPORT
 * sang đó sẽ notFound (không xem được nội dung). Helper này chọn đúng trang đọc
 * theo nguồn. File giữ thuần (không import prisma) để dùng được trong client.
 */

// Mirror của RepositoryArticleSource trong repository.service.ts (giữ file này không phụ thuộc prisma).
export type RepositoryArticleSource = 'PEER_REVIEW' | 'JOURNAL_IMPORT'

export function getRepositoryArticleHref(article: {
  id: string
  sourceType: RepositoryArticleSource
}): string {
  return article.sourceType === 'JOURNAL_IMPORT'
    ? `/journal-articles/${article.id}`
    : `/repository/${article.id}`
}
