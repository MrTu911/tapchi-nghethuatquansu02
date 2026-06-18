/**
 * pdf-text-quality.ts
 *
 * Phân biệt text trích từ PDF đọc được (tiếng Việt thật) với "rác" do font phi-Unicode
 * (TCVN3 / glyph cũ) mà pdf-parse/pdfjs trả ra sai bảng mã.
 *
 * Dùng chung cho: sinh corpus (journal-corpus.service), tách + nhập số báo cũ
 * (journal-issue-ingest.service), bóc tách mục lục (journal-toc-parser.service).
 */

// Các hư từ tiếng Việt phổ biến — văn bản thật gần như chắc chắn chứa ít nhất một từ.
const COMMON_VIETNAMESE_FUNCTION_WORDS = [
  ' và ', ' của ', ' các ', ' trong ', ' là ', ' có ', ' cho ', ' những ', ' được ', ' với ',
]

/**
 * Heuristic: text PDF có "trông như" văn xuôi tiếng Việt đọc được không.
 * Rác TCVN3 thường nhiều chữ số/ký hiệu, thiếu hẳn các hư từ tiếng Việt.
 */
export function looksLikeVietnameseProse(raw: string): boolean {
  const sample = raw.slice(0, 4000)
  const nonSpace = sample.replace(/\s/g, '')
  if (nonSpace.length < 80) return false

  const letters = (sample.match(/[A-Za-zÀ-ỹ]/g) ?? []).length
  const letterRatio = letters / nonSpace.length
  if (letterRatio < 0.6) return false

  const lower = ` ${sample.toLowerCase()} `
  return COMMON_VIETNAMESE_FUNCTION_WORDS.some((w) => lower.includes(w))
}
