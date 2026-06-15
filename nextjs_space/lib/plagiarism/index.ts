/**
 * Module kiểm tra đạo văn nội bộ
 * So sánh bài nộp / văn bản với toàn bộ kho bài trong CSDL:
 *   - Submission (bài đang/đã qua workflow)
 *   - Article (bài xuất bản qua peer-review)
 *   - JournalArticle (bài trong các SỐ ĐÃ IN — kho tạp chí cũ, nguồn để chống trùng lặp)
 *
 * Tối ưu: tiền xử lý nguồn MỘT lần thành vector tần suất từ (TF map), so khớp tuyến tính
 * với từng ứng viên — đủ nhanh cho kho ~vài trăm bài toàn văn.
 */

import { prisma } from '@/lib/prisma'
import { downloadFileBuffer } from '@/lib/s3'
import { extractPdfText } from '@/lib/pdf-metadata'

export interface PlagiarismMatch {
  id: string
  title: string
  type: 'submission' | 'article' | 'journal'
  similarity: number // Tương đồng tổng thể TF-IDF cosine (0-100%)
  phraseOverlap: number // % cụm từ NGUYÊN VĂN của bài kiểm tra xuất hiện trong bài này (0-100%) — chỉ báo sao chép
  matchedPhrases: string[] // Mẫu các cụm từ trùng (tối đa vài cụm để hiển thị)
}

export interface PlagiarismResult {
  score: number // Điểm cao nhất (0-100%)
  averageScore: number // Trung bình
  totalCompared: number
  matches: PlagiarismMatch[]
  method: 'cosine' | 'jaccard'
}

// Ngưỡng đưa vào kết quả. Một bài được liệt kê nếu tương đồng tổng thể HOẶC độ trùng
// cụm từ nguyên văn vượt ngưỡng — để bắt cả viết lại (cosine cao) lẫn sao chép từng đoạn
// (phraseOverlap cao dù cosine thấp).
const SIMILARITY_THRESHOLD = 15
const PHRASE_OVERLAP_THRESHOLD = 8
const MAX_MATCHES_RETURNED = 10
const MAX_PHRASES_PER_MATCH = 5
const NGRAM_SIZE = 4
// Giới hạn ký tự mỗi văn bản đem so để chặn chi phí với bài quá dài (đa số ~12k ký tự).
const MAX_COMPARE_CHARS = 40000
// Giới hạn số bản ghi lấy từ mỗi nguồn để tránh quá tải.
const MAX_CANDIDATES_PER_SOURCE = 1000

// ─── Tiền xử lý & độ tương đồng ─────────────────────────────────────────────

/** Tiền xử lý: bỏ HTML, chuyển thường, bỏ dấu tiếng Việt, tách từ, bỏ từ ngắn. */
function preprocessText(text: string): string[] {
  if (!text) return []
  const cleanText = text.slice(0, MAX_COMPARE_CHARS).replace(/<[^>]*>/g, ' ')
  return cleanText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function buildTermFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)
  return tf
}

function magnitude(tf: Map<string, number>): number {
  let sum = 0
  for (const count of tf.values()) sum += count * count
  return Math.sqrt(sum)
}

// ─── Vector hóa TF-IDF ───────────────────────────────────────────────────────
//
// Cosine trên bag-of-words thô bị thổi phồng bởi từ phổ biến theo lĩnh vực
// (đảng, quân đội, văn hóa...) → các bài cùng chủ đề bị chấm tương tự cao dù không
// đạo văn. Dùng TF-IDF: từ xuất hiện ở càng nhiều bài trong kho thì trọng số càng
// thấp, nên điểm cao chỉ đến từ cụm từ ĐẶC TRƯNG trùng nhau — tín hiệu đạo văn thật.

/** IDF mượt: từ phổ biến toàn kho → ~1; từ hiếm → cao hơn. */
function buildIdf(docTokenSets: Set<string>[], totalDocs: number): Map<string, number> {
  const df = new Map<string, number>()
  for (const set of docTokenSets) {
    for (const term of set) df.set(term, (df.get(term) ?? 0) + 1)
  }
  const idf = new Map<string, number>()
  for (const [term, freq] of df) {
    idf.set(term, Math.log((totalDocs + 1) / (freq + 1)) + 1)
  }
  return idf
}

interface WeightedVector {
  vec: Map<string, number>
  mag: number
}

function buildWeightedVector(tokens: string[], idf: Map<string, number>): WeightedVector {
  const tf = buildTermFreq(tokens)
  const vec = new Map<string, number>()
  for (const [term, freq] of tf) {
    const weight = idf.get(term)
    if (weight) vec.set(term, freq * weight)
  }
  return { vec, mag: magnitude(vec) }
}

function cosineWeighted(a: WeightedVector, b: WeightedVector): number {
  if (a.mag === 0 || b.mag === 0) return 0
  const [small, large] = a.vec.size <= b.vec.size ? [a.vec, b.vec] : [b.vec, a.vec]
  let dot = 0
  for (const [term, weight] of small) {
    const other = large.get(term)
    if (other) dot += weight * other
  }
  return dot / (a.mag * b.mag)
}

/** Jaccard giao/hợp tập từ (phương pháp thay thế khi method = 'jaccard'). */
function jaccard(aSet: Set<string>, bSet: Set<string>): number {
  if (aSet.size === 0 || bSet.size === 0) return 0
  const [small, large] = aSet.size <= bSet.size ? [aSet, bSet] : [bSet, aSet]
  let intersection = 0
  for (const word of small) if (large.has(word)) intersection++
  const union = aSet.size + bSet.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Tập n-gram (cụm NGRAM_SIZE từ liên tiếp) phân biệt của một mảng token. */
function buildNgramSet(tokens: string[]): Set<string> {
  const ngrams = new Set<string>()
  for (let i = 0; i <= tokens.length - NGRAM_SIZE; i++) {
    ngrams.add(tokens.slice(i, i + NGRAM_SIZE).join(' '))
  }
  return ngrams
}

interface PhraseOverlapResult {
  /** Tỉ lệ 0..1 cụm n-gram của NGUỒN xuất hiện nguyên văn trong ứng viên (containment). */
  ratio: number
  /** Mẫu cụm trùng để hiển thị. */
  samplePhrases: string[]
}

/**
 * Containment: bao nhiêu phần văn bản NGUỒN được tìm thấy nguyên văn trong ứng viên.
 * Đây là chỉ báo sao chép trực tiếp mạnh hơn cosine (vốn dễ bị nhiễu bởi từ phổ biến).
 */
function computePhraseOverlap(sourceNgrams: Set<string>, candidateTokens: string[]): PhraseOverlapResult {
  if (sourceNgrams.size === 0 || candidateTokens.length < NGRAM_SIZE) {
    return { ratio: 0, samplePhrases: [] }
  }
  const candidateNgrams = buildNgramSet(candidateTokens)
  let hits = 0
  const samplePhrases: string[] = []
  for (const ngram of sourceNgrams) {
    if (!candidateNgrams.has(ngram)) continue
    hits++
    if (samplePhrases.length < MAX_PHRASES_PER_MATCH) samplePhrases.push(ngram)
  }
  return { ratio: hits / sourceNgrams.size, samplePhrases }
}

// ─── So khớp với danh sách ứng viên ─────────────────────────────────────────

interface Candidate {
  id: string
  title: string
  type: PlagiarismMatch['type']
  text: string
}

interface PreprocessedDoc {
  candidate: Candidate
  tokens: string[]
}

/**
 * So nguồn với toàn bộ ứng viên. cosine dùng TF-IDF (DF tính trên chính kho ứng viên +
 * nguồn); jaccard dùng giao/hợp tập từ. Trả các bài vượt ngưỡng tương tự.
 */
function computeMatches(
  sourceText: string,
  candidates: Candidate[],
  method: 'cosine' | 'jaccard',
): PlagiarismMatch[] {
  const sourceTokens = preprocessText(sourceText)
  if (sourceTokens.length === 0) return []
  const sourceNgrams = buildNgramSet(sourceTokens)

  const docs: PreprocessedDoc[] = []
  for (const candidate of candidates) {
    if (candidate.text.trim().length < 50) continue
    const tokens = preprocessText(candidate.text)
    if (tokens.length === 0) continue
    docs.push({ candidate, tokens })
  }
  if (docs.length === 0) return []

  // Hàm tính tương đồng tổng thể theo method đã chọn.
  let similarityOf: (tokens: string[]) => number
  if (method === 'jaccard') {
    const sourceSet = new Set(sourceTokens)
    similarityOf = (tokens) => jaccard(sourceSet, new Set(tokens))
  } else {
    const idf = buildIdf([new Set(sourceTokens), ...docs.map((d) => new Set(d.tokens))], docs.length + 1)
    const sourceVector = buildWeightedVector(sourceTokens, idf)
    similarityOf = (tokens) => cosineWeighted(sourceVector, buildWeightedVector(tokens, idf))
  }

  const matches: PlagiarismMatch[] = []
  for (const doc of docs) {
    const similarity = similarityOf(doc.tokens) * 100
    const overlap = computePhraseOverlap(sourceNgrams, doc.tokens)
    const phraseOverlap = overlap.ratio * 100
    // Liệt kê nếu tương đồng tổng thể HOẶC độ trùng cụm từ nguyên văn vượt ngưỡng.
    if (similarity < SIMILARITY_THRESHOLD && phraseOverlap < PHRASE_OVERLAP_THRESHOLD) continue
    matches.push({
      id: doc.candidate.id,
      title: doc.candidate.title,
      type: doc.candidate.type,
      similarity: Math.round(similarity * 10) / 10,
      phraseOverlap: Math.round(phraseOverlap * 10) / 10,
      matchedPhrases: overlap.samplePhrases,
    })
  }
  return matches
}

/** Điểm xếp hạng/đại diện cho một match: lấy chỉ số nghiêm trọng hơn giữa 2 tín hiệu. */
function matchSeverity(match: PlagiarismMatch): number {
  return Math.max(match.similarity, match.phraseOverlap)
}

function finalizeResult(
  matches: PlagiarismMatch[],
  totalCompared: number,
  method: 'cosine' | 'jaccard',
): PlagiarismResult {
  // Xếp theo mức nghiêm trọng: bài sao chép nguyên văn nổi lên đầu kể cả khi cosine vừa phải.
  matches.sort((a, b) => matchSeverity(b) - matchSeverity(a))
  const score = matches.length > 0 ? matchSeverity(matches[0]) : 0
  const averageScore = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + matchSeverity(m), 0) / matches.length) * 10) / 10
    : 0
  return { score, averageScore, totalCompared, matches: matches.slice(0, MAX_MATCHES_RETURNED), method }
}

// ─── Nạp ứng viên từ CSDL ───────────────────────────────────────────────────

/**
 * Lấy ứng viên so khớp từ 3 nguồn. `excludeSubmissionId` để không so bài với chính nó
 * (kể cả bài đã được xuất bản thành Article/JournalArticle của cùng submission).
 */
async function loadCandidates(excludeSubmissionId?: string): Promise<Candidate[]> {
  // Loại CHÍNH bài đang kiểm tra. Article.submissionId là bắt buộc → `{ not: x }` an toàn.
  const excludeArticleSelf = excludeSubmissionId ? { submissionId: { not: excludeSubmissionId } } : {}

  // JournalArticle.submissionId nullable: hầu hết bài tạp chí cũ có submissionId = null.
  // Prisma `{ not: x }` loại luôn hàng NULL, nên phải OR tường minh với { null } —
  // nếu không, TOÀN BỘ kho tạp chí cũ bị bỏ khỏi phép so khớp.
  const excludeJournalSelf = excludeSubmissionId
    ? { OR: [{ submissionId: null }, { submissionId: { not: excludeSubmissionId } }] }
    : {}

  const [submissions, articles, journalArticles] = await Promise.all([
    prisma.submission.findMany({
      where: {
        status: { notIn: ['DESK_REJECT', 'REJECTED'] },
        ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
      },
      include: { article: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
    prisma.article.findMany({
      where: {
        approvalStatus: 'APPROVED',
        ...excludeArticleSelf,
      },
      include: { submission: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
    prisma.journalArticle.findMany({
      where: {
        status: 'PUBLISHED',
        contentText: { not: null },
        ...excludeJournalSelf,
      },
      select: { id: true, title: true, abstract: true, contentText: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
  ])

  // Dedup: bỏ Article nếu submission của nó đã có trong danh sách submission ứng viên.
  const submissionIds = new Set(submissions.map((s) => s.id))

  const candidates: Candidate[] = []

  for (const submission of submissions) {
    candidates.push({
      id: submission.id,
      title: submission.title,
      type: 'submission',
      text: [submission.title, submission.abstractVn ?? '', submission.abstractEn ?? '', submission.article?.htmlBody ?? ''].join(' '),
    })
  }

  for (const article of articles) {
    if (article.submissionId && submissionIds.has(article.submissionId)) continue
    candidates.push({
      id: article.id,
      title: article.submission?.title ?? `Article ${article.id}`,
      type: 'article',
      text: [article.submission?.title ?? '', article.submission?.abstractVn ?? '', article.htmlBody ?? ''].join(' '),
    })
  }

  for (const journalArticle of journalArticles) {
    candidates.push({
      id: journalArticle.id,
      title: journalArticle.title,
      type: 'journal',
      text: [journalArticle.title, journalArticle.abstract ?? '', journalArticle.contentText ?? ''].join(' '),
    })
  }

  return candidates
}

// ─── PDF text từ submission ─────────────────────────────────────────────────

/**
 * Trích xuất text từ các file PDF đã upload của một submission.
 * Thử download từ S3 và parse. Trả về chuỗi rỗng nếu không có hoặc lỗi.
 */
async function extractPdfTextFromSubmission(submissionId: string): Promise<string> {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { submissionId, mimeType: 'application/pdf' },
      select: { cloudStoragePath: true },
      take: 3,
    })

    const texts: string[] = []
    for (const file of files) {
      if (!file.cloudStoragePath) continue
      const buffer = await downloadFileBuffer(file.cloudStoragePath)
      if (!buffer) continue
      const text = await extractPdfText(buffer)
      if (text.trim().length > 50) texts.push(text)
    }
    return texts.join(' ')
  } catch {
    return ''
  }
}

// ─── API công khai ──────────────────────────────────────────────────────────

/**
 * Kiểm tra đạo văn cho Submission — so với Submission, Article và JournalArticle khác.
 * Ưu tiên: title + abstract > htmlBody > PDF text (nếu không có text cấu trúc).
 */
export async function checkSubmissionPlagiarism(
  submissionId: string,
  method: 'cosine' | 'jaccard' = 'cosine',
): Promise<PlagiarismResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { article: true },
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  const structuredText = [
    submission.title,
    submission.abstractVn ?? '',
    submission.abstractEn ?? '',
    submission.article?.htmlBody ?? '',
  ].join(' ').trim()

  // Nếu thiếu text cấu trúc, fallback sang trích từ PDF đã upload.
  let pdfText = ''
  if (structuredText.length < 200) {
    pdfText = await extractPdfTextFromSubmission(submissionId)
  }

  const sourceText = structuredText.length >= 50
    ? (pdfText ? `${structuredText} ${pdfText}` : structuredText)
    : pdfText

  if (sourceText.trim().length < 50) {
    return { score: 0, averageScore: 0, totalCompared: 0, matches: [], method }
  }

  const candidates = await loadCandidates(submissionId)
  const matches = computeMatches(sourceText, candidates, method)
  return finalizeResult(matches, candidates.length, method)
}

/**
 * Kiểm tra đạo văn từ raw text (dùng cho upload PDF trực tiếp).
 * Không cần submission trong DB — chỉ so text với toàn bộ kho.
 */
export async function checkTextPlagiarism(
  sourceText: string,
  method: 'cosine' | 'jaccard' = 'cosine',
): Promise<PlagiarismResult> {
  if (sourceText.trim().length < 50) {
    return { score: 0, averageScore: 0, totalCompared: 0, matches: [], method }
  }

  const candidates = await loadCandidates()
  const matches = computeMatches(sourceText, candidates, method)
  return finalizeResult(matches, candidates.length, method)
}

/**
 * Lưu kết quả kiểm tra vào database
 */
export async function savePlagiarismReport(
  submissionId: string,
  result: PlagiarismResult,
  userId?: string,
) {
  return prisma.plagiarismReport.create({
    data: {
      submissionId,
      score: result.score,
      method: result.method,
      status: 'COMPLETED',
      matches: result.matches as any,
      totalCompared: result.totalCompared,
      checkedBy: userId,
      notes:
        `Mức nghiêm trọng cao nhất ${result.score}% ` +
        `(tương đồng tổng thể + trùng cụm từ nguyên văn). ` +
        `Tìm thấy ${result.matches.length} bài tương tự trong ${result.totalCompared} bản ghi.`,
    },
  })
}

/**
 * Lấy báo cáo kiểm tra đạo văn mới nhất của submission
 */
export async function getLatestPlagiarismReport(submissionId: string) {
  return prisma.plagiarismReport.findFirst({
    where: { submissionId },
    orderBy: { checkedAt: 'desc' },
    include: {
      checker: { select: { fullName: true, email: true } },
    },
  })
}
