/**
 * Tiện ích so sánh văn bản (word-level diff) cho panel "Lịch sử phiên bản".
 * Strip HTML → tách từ → LCS để tìm phần giữ nguyên / thêm / xoá.
 */

export type DiffType = "eq" | "add" | "del";

export interface DiffSegment {
  type: DiffType;
  value: string;
}

// Giới hạn token để LCS O(n*m) không phình với nội dung quá dài.
const MAX_TOKENS = 4000;

/**
 * Bỏ thẻ HTML, giải mã vài entity phổ biến và gom khoảng trắng.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/**
 * Diff hai chuỗi theo từ. Trả về danh sách segment để render highlight.
 * Nếu vượt giới hạn token, gộp cả hai thành 1 segment del + 1 add (so sánh thô).
 */
export function diffWords(oldText: string, newText: string): DiffSegment[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);

  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    const segments: DiffSegment[] = [];
    if (oldText) segments.push({ type: "del", value: oldText });
    if (newText) segments.push({ type: "add", value: newText });
    return segments;
  }

  // LCS bằng quy hoạch động.
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Truy vết tạo segment, gộp các token liền nhau cùng loại.
  const raw: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffType, value: string) => {
    const last = raw[raw.length - 1];
    if (last && last.type === type) last.value += value;
    else raw.push({ type, value });
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("eq", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", a[i]);
      i++;
    } else {
      push("add", b[j]);
      j++;
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);

  return raw;
}

/**
 * Đếm số token thêm/xoá để hiển thị tóm tắt nhanh.
 */
export function summarizeDiff(segments: DiffSegment[]): {
  added: number;
  removed: number;
} {
  let added = 0;
  let removed = 0;
  for (const s of segments) {
    const words = s.value.trim() ? s.value.trim().split(/\s+/).length : 0;
    if (s.type === "add") added += words;
    else if (s.type === "del") removed += words;
  }
  return { added, removed };
}
