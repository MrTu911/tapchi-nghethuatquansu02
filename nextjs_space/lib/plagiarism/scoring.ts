/**
 * Lõi tính điểm trùng lặp / đạo văn — THUẦN (không phụ thuộc prisma/IO) để test được.
 *
 * Hai tín hiệu:
 *   1. TF-IDF cosine — bắt viết lại / tương đồng tổng thể (giảm nhiễu từ phổ biến).
 *   2. Trùng cụm n-gram (containment) — bắt sao chép nguyên văn từng đoạn.
 *
 * Tầng IO (nạp ứng viên từ DB, lưu báo cáo, auto-check) nằm ở ./index.
 */

export type PlagiarismSourceType = 'submission' | 'article' | 'journal' | 'news' | 'web'

export interface PlagiarismMatch {
  id: string
  title: string
  type: PlagiarismSourceType
  similarity: number // Tương đồng tổng thể TF-IDF cosine (0-100%)
  phraseOverlap: number // % cụm từ NGUYÊN VĂN của bài kiểm tra xuất hiện trong bài này (0-100%)
  matchedPhrases: string[] // Mẫu cụm trùng, GIỮ NGUYÊN dấu + hoa/thường để đọc được
  sameAuthor?: boolean // True nếu nguồn cùng tác giả → nghi vấn tự đạo văn
}

export interface SourceBreakdownEntry {
  type: PlagiarismSourceType
  matchCount: number
  maxScore: number
}

export interface PlagiarismResult {
  score: number
  averageScore: number
  originalityScore: number // = 100 - score
  totalCompared: number
  matches: PlagiarismMatch[]
  sourceBreakdown: SourceBreakdownEntry[]
  method: 'cosine' | 'jaccard'
}

export interface Candidate {
  id: string
  title: string
  type: PlagiarismSourceType
  text: string
  authorUserId?: string | null
}

// Ngưỡng đưa vào kết quả: liệt kê nếu cosine HOẶC trùng cụm vượt ngưỡng.
const SIMILARITY_THRESHOLD = 15
const PHRASE_OVERLAP_THRESHOLD = 8
const MAX_MATCHES_RETURNED = 10
const MAX_PHRASES_PER_MATCH = 5
const NGRAM_SIZE = 4
export const MAX_COMPARE_CHARS = 40000

/**
 * Stopword tiếng Việt (đã chuẩn hóa: bỏ dấu, đ→d, chỉ a-z0-9).
 * CỐ Ý GIỮ THẬN TRỌNG: chỉ loại từ chức năng rõ ràng, KHÔNG loại từ dễ trùng thuật ngữ
 * chuyên ngành sau khi bỏ dấu (vd "dang"→Đảng, "van"→văn, "khi"→khí, "tai"→tài).
 */
export const VIETNAMESE_STOPWORDS = new Set<string>([
  'cua', 'trong', 'nhung', 'duoc', 'cac', 'voi', 'cho', 'khong', 'nay', 'mot',
  'vao', 'nhu', 'hoac', 'boi', 'theo', 'rang', 'den', 'hon', 'tuy', 'vay',
  'cung', 'nhieu', 'phai', 'thuoc', 'gom', 'tuc', 'tren', 'duoi', 'giua',
])

export const round1 = (value: number): number => Math.round(value * 10) / 10

interface Tokenized {
  normalized: string[]
  original: string[]
}

/** Chuẩn hóa một từ: bỏ dấu, lowercase, đ→d, chỉ giữ a-z0-9. */
function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
}

/** Bỏ dấu câu bao quanh để hiển thị cụm gốc gọn gàng. */
function trimDisplayWord(raw: string): string {
  return raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

/** Bỏ HTML, tách từ, build SONG SONG token chuẩn hóa + token gốc; bỏ từ ngắn & stopword. */
export function tokenize(text: string): Tokenized {
  if (!text) return { normalized: [], original: [] }
  const cleanText = text.slice(0, MAX_COMPARE_CHARS).replace(/<[^>]*>/g, ' ')
  const normalized: string[] = []
  const original: string[] = []
  for (const raw of cleanText.split(/\s+/)) {
    const norm = normalizeWord(raw)
    if (norm.length > 2 && !VIETNAMESE_STOPWORDS.has(norm)) {
      normalized.push(norm)
      original.push(trimDisplayWord(raw) || norm)
    }
  }
  return { normalized, original }
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

function jaccard(aSet: Set<string>, bSet: Set<string>): number {
  if (aSet.size === 0 || bSet.size === 0) return 0
  const [small, large] = aSet.size <= bSet.size ? [aSet, bSet] : [bSet, aSet]
  let intersection = 0
  for (const word of small) if (large.has(word)) intersection++
  const union = aSet.size + bSet.size - intersection
  return union === 0 ? 0 : intersection / union
}

function buildNgramSet(tokens: string[]): Set<string> {
  const ngrams = new Set<string>()
  for (let i = 0; i <= tokens.length - NGRAM_SIZE; i++) {
    ngrams.add(tokens.slice(i, i + NGRAM_SIZE).join(' '))
  }
  return ngrams
}

interface SourceProfile {
  normalized: string[]
  ngramSet: Set<string>
  ngramDisplay: Map<string, string>
}

function buildSourceProfile(text: string): SourceProfile {
  const { normalized, original } = tokenize(text)
  const ngramSet = new Set<string>()
  const ngramDisplay = new Map<string, string>()
  for (let i = 0; i <= normalized.length - NGRAM_SIZE; i++) {
    const key = normalized.slice(i, i + NGRAM_SIZE).join(' ')
    if (!ngramSet.has(key)) {
      ngramSet.add(key)
      ngramDisplay.set(key, original.slice(i, i + NGRAM_SIZE).join(' '))
    }
  }
  return { normalized, ngramSet, ngramDisplay }
}

interface PhraseOverlapResult {
  ratio: number
  samplePhrases: string[]
}

function computePhraseOverlap(source: SourceProfile, candidateTokens: string[]): PhraseOverlapResult {
  if (source.ngramSet.size === 0 || candidateTokens.length < NGRAM_SIZE) {
    return { ratio: 0, samplePhrases: [] }
  }
  const candidateNgrams = buildNgramSet(candidateTokens)
  let hits = 0
  const samplePhrases: string[] = []
  for (const ngram of source.ngramSet) {
    if (!candidateNgrams.has(ngram)) continue
    hits++
    if (samplePhrases.length < MAX_PHRASES_PER_MATCH) {
      samplePhrases.push(source.ngramDisplay.get(ngram) ?? ngram)
    }
  }
  return { ratio: hits / source.ngramSet.size, samplePhrases }
}

interface PreprocessedDoc {
  candidate: Candidate
  tokens: string[]
}

/** So nguồn với toàn bộ ứng viên, trả các bài vượt ngưỡng tương tự. */
export function computeMatches(
  sourceText: string,
  candidates: Candidate[],
  method: 'cosine' | 'jaccard',
  sourceAuthorId?: string | null,
): PlagiarismMatch[] {
  const source = buildSourceProfile(sourceText)
  if (source.normalized.length === 0) return []

  const docs: PreprocessedDoc[] = []
  for (const candidate of candidates) {
    if (candidate.text.trim().length < 50) continue
    const tokens = tokenize(candidate.text).normalized
    if (tokens.length === 0) continue
    docs.push({ candidate, tokens })
  }
  if (docs.length === 0) return []

  let similarityOf: (tokens: string[]) => number
  if (method === 'jaccard') {
    const sourceSet = new Set(source.normalized)
    similarityOf = (tokens) => jaccard(sourceSet, new Set(tokens))
  } else {
    const idf = buildIdf([new Set(source.normalized), ...docs.map((d) => new Set(d.tokens))], docs.length + 1)
    const sourceVector = buildWeightedVector(source.normalized, idf)
    similarityOf = (tokens) => cosineWeighted(sourceVector, buildWeightedVector(tokens, idf))
  }

  const matches: PlagiarismMatch[] = []
  for (const doc of docs) {
    const similarity = similarityOf(doc.tokens) * 100
    const overlap = computePhraseOverlap(source, doc.tokens)
    const phraseOverlap = overlap.ratio * 100
    if (similarity < SIMILARITY_THRESHOLD && phraseOverlap < PHRASE_OVERLAP_THRESHOLD) continue
    const sameAuthor =
      sourceAuthorId != null &&
      doc.candidate.authorUserId != null &&
      doc.candidate.authorUserId === sourceAuthorId
    matches.push({
      id: doc.candidate.id,
      title: doc.candidate.title,
      type: doc.candidate.type,
      similarity: round1(similarity),
      phraseOverlap: round1(phraseOverlap),
      matchedPhrases: overlap.samplePhrases,
      ...(sameAuthor ? { sameAuthor: true } : {}),
    })
  }
  return matches
}

/** Điểm xếp hạng cho một match: lấy chỉ số nghiêm trọng hơn giữa 2 tín hiệu. */
export function matchSeverity(match: PlagiarismMatch): number {
  return Math.max(match.similarity, match.phraseOverlap)
}

/** Gom số match + điểm cao nhất theo từng loại nguồn. */
export function buildSourceBreakdown(matches: PlagiarismMatch[]): SourceBreakdownEntry[] {
  const map = new Map<PlagiarismSourceType, { matchCount: number; maxScore: number }>()
  for (const match of matches) {
    const entry = map.get(match.type) ?? { matchCount: 0, maxScore: 0 }
    entry.matchCount += 1
    entry.maxScore = Math.max(entry.maxScore, matchSeverity(match))
    map.set(match.type, entry)
  }
  return [...map.entries()].map(([type, entry]) => ({
    type,
    matchCount: entry.matchCount,
    maxScore: round1(entry.maxScore),
  }))
}

export function finalizeResult(
  matches: PlagiarismMatch[],
  totalCompared: number,
  method: 'cosine' | 'jaccard',
): PlagiarismResult {
  matches.sort((a, b) => matchSeverity(b) - matchSeverity(a))
  const score = matches.length > 0 ? matchSeverity(matches[0]) : 0
  const averageScore = matches.length > 0
    ? round1(matches.reduce((sum, m) => sum + matchSeverity(m), 0) / matches.length)
    : 0
  return {
    score,
    averageScore,
    originalityScore: round1(Math.max(0, 100 - score)),
    totalCompared,
    matches: matches.slice(0, MAX_MATCHES_RETURNED),
    sourceBreakdown: buildSourceBreakdown(matches),
    method,
  }
}

export function emptyResult(method: 'cosine' | 'jaccard'): PlagiarismResult {
  return {
    score: 0,
    averageScore: 0,
    originalityScore: 100,
    totalCompared: 0,
    matches: [],
    sourceBreakdown: [],
    method,
  }
}
