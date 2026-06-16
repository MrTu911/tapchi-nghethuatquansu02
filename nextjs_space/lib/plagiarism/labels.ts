/**
 * Nhãn hiển thị cho loại nguồn đối sánh đạo văn.
 *
 * Module THUẦN (không phụ thuộc server/prisma) để dùng chung được cả ở client UI
 * lẫn service dựng báo cáo (server) mà không kéo theo phụ thuộc nặng.
 */

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  submission: 'Bài nộp',
  article: 'Bài xuất bản',
  journal: 'Kho tạp chí',
  news: 'Tin tức',
  web: 'Nguồn web',
}

export function sourceTypeLabel(type: string | undefined | null): string {
  if (!type) return 'Khác'
  return SOURCE_TYPE_LABELS[type] ?? type
}

/** Phân mức nghiêm trọng theo điểm tương đồng (0-100). */
export function severityLabel(score: number): string {
  if (score >= 70) return 'Rất cao'
  if (score >= 40) return 'Cao'
  if (score >= 20) return 'Trung bình'
  return 'Thấp'
}
