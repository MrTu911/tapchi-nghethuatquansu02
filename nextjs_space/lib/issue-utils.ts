/**
 * Tiện ích đếm số bài báo của một số tạp chí (Issue).
 *
 * Một Issue có hai nguồn bài, KHÔNG chồng lấn theo dữ liệu thực tế:
 * - `articles` (model Article): bài đi qua quy trình phản biện/biên tập nội bộ.
 * - `journalArticles` (model JournalArticle): bài số hóa/nhập từ kho corpus (520+ bài).
 *
 * Tổng số bài hiển thị cho một số = tổng cả hai nguồn. Trước đây nhiều nơi chỉ
 * đếm `articles` nên các số nhập từ corpus báo 0 bài dù thực tế có hàng chục bài.
 */

/** Select chuẩn để đếm đủ cả hai nguồn bài trong một Issue. */
export const ISSUE_ARTICLE_COUNT_SELECT = {
  articles: true,
  journalArticles: true,
} as const

type IssueCountShape = {
  _count?: {
    articles?: number | null
    journalArticles?: number | null
  } | null
}

/** Tổng số bài của một số tạp chí (Article + JournalArticle). */
export function getIssueArticleCount(issue: IssueCountShape): number {
  const counts = issue._count
  if (!counts) return 0
  return (counts.articles ?? 0) + (counts.journalArticles ?? 0)
}
