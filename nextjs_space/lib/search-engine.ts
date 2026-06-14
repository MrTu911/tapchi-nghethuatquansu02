
/**
 * Semantic Search Engine
 * Implements intelligent search using embeddings and vector similarity
 */

export interface SearchQuery {
  query: string
  filters?: {
    category?: string
    status?: string
    dateFrom?: Date
    dateTo?: Date
  }
  limit?: number
}

export interface SearchResult {
  id: string
  title: string
  abstractVn?: string
  abstractEn?: string
  score: number
  highlights?: string[]
}

/**
 * Generate text embedding using a simple hash-based approach
 * In production, replace with actual embedding API (OpenAI, Cohere, etc.)
 */
function generateSimpleEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().trim()
  const words = normalized.split(/\s+/)
  const embedding = new Array(128).fill(0)

  words.forEach((word, index) => {
    const hash = simpleHash(word)
    embedding[hash % 128] += 1 / (index + 1)
  })

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / (magnitude || 1))
}

/**
 * Simple hash function
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Perform semantic search on submissions
 */
export async function semanticSearch(
  query: SearchQuery,
  submissions: Array<{
    id: string
    title: string
    abstractVn?: string
    abstractEn?: string
    keywords: string[]
  }>
): Promise<SearchResult[]> {
  const queryEmbedding = generateSimpleEmbedding(query.query)

  const results = submissions.map(submission => {
    const text = [
      submission.title,
      submission.abstractVn || '',
      submission.abstractEn || '',
      ...submission.keywords
    ].join(' ')

    const submissionEmbedding = generateSimpleEmbedding(text)
    const score = cosineSimilarity(queryEmbedding, submissionEmbedding)

    return {
      id: submission.id,
      title: submission.title,
      abstractVn: submission.abstractVn,
      abstractEn: submission.abstractEn,
      score
    }
  })

  return results
    .filter(result => result.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit || 10)
}

/**
 * Normalize Vietnamese text for comparison (remove diacritics, lowercase)
 */
export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tokenize text into word set for Jaccard similarity
 */
function tokenize(text: string): Set<string> {
  const normalized = normalizeVietnamese(text)
  const words = normalized.split(' ').filter((w) => w.length > 1)
  return new Set(words)
}

/**
 * Jaccard similarity between two token sets
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}

/**
 * Title similarity using Jaccard on word tokens (handles Vietnamese)
 */
export function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  return jaccardSimilarity(tokenize(a), tokenize(b))
}

/**
 * Abstract similarity using cosine similarity (reuses existing embedding approach)
 */
export function abstractSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const embA = generateSimpleEmbedding(normalizeVietnamese(a))
  const embB = generateSimpleEmbedding(normalizeVietnamese(b))
  return cosineSimilarity(embA, embB)
}

/**
 * Keyword array similarity using Jaccard on normalized keyword sets
 */
export function keywordJaccard(kwA: string[], kwB: string[]): number {
  if (kwA.length === 0 && kwB.length === 0) return 0
  const setA = new Set(kwA.map((k) => normalizeVietnamese(k)))
  const setB = new Set(kwB.map((k) => normalizeVietnamese(k)))
  return jaccardSimilarity(setA, setB)
}

/**
 * Combined similarity score
 * Weights: 50% title + 30% abstract + 20% keywords
 */
export function combinedSimilarityScore(
  input: { title: string; abstract?: string; keywords?: string[] },
  candidate: { title: string; abstract?: string; keywords?: string[] },
): number {
  const titleScore = titleSimilarity(input.title, candidate.title)
  const abstractScore = input.abstract && candidate.abstract
    ? abstractSimilarity(input.abstract, candidate.abstract)
    : 0
  const kwScore = input.keywords && candidate.keywords
    ? keywordJaccard(input.keywords, candidate.keywords)
    : 0

  const hasAbstract = !!(input.abstract && candidate.abstract)
  const hasKeywords = !!(input.keywords?.length && candidate.keywords?.length)

  if (!hasAbstract && !hasKeywords) return titleScore

  let weight = 0.5
  let score = 0.5 * titleScore
  if (hasAbstract) { score += 0.3 * abstractScore; weight += 0.3 }
  if (hasKeywords) { score += 0.2 * kwScore; weight += 0.2 }

  return weight > 0 ? score / weight : titleScore
}

/**
 * Extract keywords from text using TF-IDF
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)

  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
