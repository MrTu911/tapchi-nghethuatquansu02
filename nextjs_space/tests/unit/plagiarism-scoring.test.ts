/**
 * Unit test cho lõi tính điểm đạo văn (lib/plagiarism/scoring.ts) — thuần, không DB.
 * Bảo vệ các hành vi nghiệp vụ: lọc stopword, bắt sao chép (cosine + trùng cụm),
 * cụm trùng hiển thị CÓ DẤU, cờ tự đạo văn cùng tác giả, điểm độc đáo, phân tích nguồn.
 */

import {
  tokenize,
  computeMatches,
  finalizeResult,
  buildSourceBreakdown,
  type Candidate,
} from '@/lib/plagiarism/scoring'

const PASSAGE =
  'Học viện Quốc phòng nghiên cứu nghệ thuật quân sự hiện đại phục vụ chiến tranh nhân dân ' +
  'bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa, phát triển lý luận quốc phòng toàn dân và ' +
  'chiến lược bảo vệ Tổ quốc trong tình hình mới với nhiều thách thức an ninh phi truyền thống.'

const UNRELATED =
  'Bài viết khảo sát lịch tưới tiêu cho vùng canh tác lúa nước bằng cảm biến độ ẩm đất, ' +
  'phân tích chi phí lắp đặt và năng suất qua ba vụ mùa tại đồng bằng ven sông.'

describe('tokenize', () => {
  it('loại stopword tiếng Việt và từ ngắn, chuẩn hóa đ→d', () => {
    const { normalized } = tokenize('Của và trong được Học viện Quốc phòng')
    expect(normalized).toEqual(['hoc', 'vien', 'quoc', 'phong'])
    expect(normalized).not.toContain('cua')
    expect(normalized).not.toContain('trong')
    expect(normalized).not.toContain('duoc')
  })

  it('chuyển đ/Đ thành d khi chuẩn hóa', () => {
    expect(tokenize('Đảng').normalized).toEqual(['dang'])
  })

  it('giữ song song token gốc (có dấu) cùng số lượng với token chuẩn hóa', () => {
    const { normalized, original } = tokenize('Học viện Quốc phòng')
    expect(original.length).toBe(normalized.length)
    expect(original.join(' ')).toContain('Học')
  })
})

describe('computeMatches — sao chép nguyên văn', () => {
  it('bài sao chép gần nguyên văn → tương đồng cao + trùng cụm cao', () => {
    const candidates: Candidate[] = [
      { id: 'j1', title: 'Bài kho tạp chí', type: 'journal', text: PASSAGE, authorUserId: null },
    ]
    const matches = computeMatches(PASSAGE, candidates, 'cosine')
    expect(matches).toHaveLength(1)
    expect(matches[0].similarity).toBeGreaterThanOrEqual(80)
    expect(matches[0].phraseOverlap).toBeGreaterThanOrEqual(80)
  })

  it('cụm trùng hiển thị CÓ DẤU, đọc được (không phải token đã bỏ dấu)', () => {
    const candidates: Candidate[] = [
      { id: 'j1', title: 'Bài kho tạp chí', type: 'journal', text: PASSAGE, authorUserId: null },
    ]
    const matches = computeMatches(PASSAGE, candidates, 'cosine')
    expect(matches[0].matchedPhrases.length).toBeGreaterThan(0)
    // Cụm trùng phải chứa ký tự tiếng Việt có dấu (non-ASCII).
    expect(matches[0].matchedPhrases.some((p) => /[^\x00-\x7F]/.test(p))).toBe(true)
  })

  it('bài chủ đề khác hẳn → dưới ngưỡng, không bị liệt kê', () => {
    const candidates: Candidate[] = [
      { id: 'x1', title: 'Bài nông nghiệp', type: 'journal', text: UNRELATED, authorUserId: null },
    ]
    const matches = computeMatches(PASSAGE, candidates, 'cosine')
    expect(matches).toHaveLength(0)
  })
})

describe('computeMatches — cờ tự đạo văn (sameAuthor)', () => {
  it('chỉ bật khi nguồn cùng tác giả với bài kiểm tra', () => {
    const candidates: Candidate[] = [
      { id: 's1', title: 'Bài cùng tác giả', type: 'submission', text: PASSAGE, authorUserId: 'user-1' },
      { id: 's2', title: 'Bài tác giả khác', type: 'submission', text: PASSAGE, authorUserId: 'user-2' },
    ]
    const matches = computeMatches(PASSAGE, candidates, 'cosine', 'user-1')
    const self = matches.find((m) => m.id === 's1')
    const other = matches.find((m) => m.id === 's2')
    expect(self?.sameAuthor).toBe(true)
    expect(other?.sameAuthor).toBeFalsy()
  })
})

describe('finalizeResult', () => {
  it('originalityScore = 100 - score và xếp match theo mức nghiêm trọng', () => {
    const candidates: Candidate[] = [
      { id: 'j1', title: 'Nguồn trùng', type: 'journal', text: PASSAGE, authorUserId: null },
    ]
    const matches = computeMatches(PASSAGE, candidates, 'cosine')
    const result = finalizeResult(matches, candidates.length, 'cosine')
    expect(result.originalityScore).toBeCloseTo(Math.max(0, 100 - result.score), 1)
    expect(result.score).toBeGreaterThan(0)
  })

  it('không có match → score 0, độ độc đáo 100', () => {
    const result = finalizeResult([], 5, 'cosine')
    expect(result.score).toBe(0)
    expect(result.originalityScore).toBe(100)
    expect(result.sourceBreakdown).toEqual([])
  })
})

describe('buildSourceBreakdown', () => {
  it('gom số match và điểm cao nhất theo từng loại nguồn', () => {
    const breakdown = buildSourceBreakdown([
      { id: 'a', title: 'A', type: 'journal', similarity: 80, phraseOverlap: 70, matchedPhrases: [] },
      { id: 'b', title: 'B', type: 'journal', similarity: 40, phraseOverlap: 10, matchedPhrases: [] },
      { id: 'c', title: 'C', type: 'web', similarity: 25, phraseOverlap: 5, matchedPhrases: [] },
    ])
    const journal = breakdown.find((b) => b.type === 'journal')
    const web = breakdown.find((b) => b.type === 'web')
    expect(journal?.matchCount).toBe(2)
    expect(journal?.maxScore).toBe(80)
    expect(web?.matchCount).toBe(1)
    expect(web?.maxScore).toBe(25)
  })
})
