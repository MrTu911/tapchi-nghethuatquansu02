/**
 * Module kiểm tra đạo văn nội bộ
 * So sánh bài nộp với tất cả bài đã có trong CSDL
 * Hỗ trợ extract text từ file PDF đã upload lên S3
 */

import { prisma } from '@/lib/prisma'
import { downloadFileBuffer } from '@/lib/s3'
import { extractPdfText } from '@/lib/pdf-metadata'

export interface PlagiarismMatch {
  id: string
  title: string
  type: 'submission' | 'article'
  similarity: number // 0-100%
  matchedPhrases: string[] // Các cụm từ trùng lặp
}

export interface PlagiarismResult {
  score: number // Điểm cao nhất (0-100%)
  averageScore: number // Trung bình
  totalCompared: number
  matches: PlagiarismMatch[]
  method: 'cosine' | 'jaccard'
}

/**
 * Tiền xử lý văn bản: loại bỏ dấu, chuyển thường, tách từ
 */
function preprocessText(text: string): string[] {
  if (!text) return []
  
  // Loại bỏ HTML tags nếu có
  const cleanText = text.replace(/<[^>]*>/g, ' ')
  
  // Chuyển thường và tách từ (hỗ trợ tiếng Việt)
  return cleanText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .split(/\s+/)
    .filter(word => word.length > 2) // Bỏ từ ngắn
}

/**
 * Tính Cosine Similarity giữa 2 văn bản
 * Trả về giá trị 0-1 (sẽ nhân 100 để ra %)
 */
function cosineSimilarity(textA: string, textB: string): number {
  const wordsA = preprocessText(textA)
  const wordsB = preprocessText(textB)
  
  if (wordsA.length === 0 || wordsB.length === 0) return 0
  
  // Tạo tập hợp tất cả từ
  const allWords = new Set([...wordsA, ...wordsB])
  
  // Tạo vector từ nhị phân (TF simplest)
  const vecA: number[] = []
  const vecB: number[] = []
  
  allWords.forEach(word => {
    vecA.push(wordsA.filter(w => w === word).length)
    vecB.push(wordsB.filter(w => w === word).length)
  })
  
  // Tính dot product và magnitude
  let dotProduct = 0
  let magA = 0
  let magB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    magA += vecA[i] * vecA[i]
    magB += vecB[i] * vecB[i]
  }
  
  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)
  
  if (magA === 0 || magB === 0) return 0
  
  return dotProduct / (magA * magB)
}

/**
 * Tính Jaccard Similarity (dựa trên tập hợp từ)
 */
function jaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(preprocessText(textA))
  const setB = new Set(preprocessText(textB))
  
  if (setA.size === 0 || setB.size === 0) return 0
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  return intersection.size / union.size
}

/**
 * Tìm các cụm từ trùng lặp (n-gram matching)
 */
function findMatchedPhrases(textA: string, textB: string, ngramSize: number = 4): string[] {
  const wordsA = preprocessText(textA)
  const wordsB = preprocessText(textB)
  
  if (wordsA.length < ngramSize || wordsB.length < ngramSize) return []
  
  // Tạo n-grams từ text B
  const ngramsB = new Set<string>()
  for (let i = 0; i <= wordsB.length - ngramSize; i++) {
    ngramsB.add(wordsB.slice(i, i + ngramSize).join(' '))
  }
  
  // Tìm các n-grams từ A xuất hiện trong B
  const matched: string[] = []
  for (let i = 0; i <= wordsA.length - ngramSize; i++) {
    const ngram = wordsA.slice(i, i + ngramSize).join(' ')
    if (ngramsB.has(ngram) && !matched.includes(ngram)) {
      matched.push(ngram)
    }
  }
  
  return matched.slice(0, 5) // Giới hạn 5 cụm từ
}

/**
 * Trích xuất text từ các file PDF đã upload của một submission.
 * Thử download từ S3 và parse. Trả về chuỗi rỗng nếu không có hoặc lỗi.
 */
async function extractPdfTextFromSubmission(submissionId: string): Promise<string> {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: {
        submissionId,
        mimeType: 'application/pdf',
      },
      select: { cloudStoragePath: true },
      take: 3, // Giới hạn 3 file để tránh quá tải
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

/**
 * Kiểm tra đạo văn cho Submission
 * So sánh với tất cả Submission và Article khác trong DB
 * Ưu tiên: title + abstract > htmlBody > PDF text (nếu không có text cấu trúc)
 */
export async function checkSubmissionPlagiarism(
  submissionId: string,
  method: 'cosine' | 'jaccard' = 'cosine'
): Promise<PlagiarismResult> {
  // Lấy nội dung bài cần kiểm tra (bao gồm files)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { article: true }
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  const structuredText = [
    submission.title,
    submission.abstractVn || '',
    submission.abstractEn || '',
    submission.article?.htmlBody || '',
  ].join(' ').trim()

  // Nếu không đủ text cấu trúc, fallback sang extract từ PDF
  let pdfText = ''
  if (structuredText.length < 200) {
    pdfText = await extractPdfTextFromSubmission(submissionId)
  }

  // Ghép nội dung: ưu tiên text cấu trúc, bổ sung PDF nếu có
  const sourceText = structuredText.length >= 50
    ? (pdfText ? `${structuredText} ${pdfText}` : structuredText)
    : pdfText
  
  if (sourceText.trim().length < 50) {
    return {
      score: 0,
      averageScore: 0,
      totalCompared: 0,
      matches: [],
      method
    }
  }
  
  const similarityFn = method === 'cosine' ? cosineSimilarity : jaccardSimilarity
  const matches: PlagiarismMatch[] = []
  
  // Lấy tất cả Submissions khác (loại trừ DESK_REJECT và REJECTED)
  const otherSubmissions = await prisma.submission.findMany({
    where: {
      id: { not: submissionId },
      status: { notIn: ['DESK_REJECT', 'REJECTED'] }
    },
    include: { article: true },
    take: 500 // Giới hạn để tránh quá tải
  })
  
  // Lấy tất cả Articles đã xuất bản với submission info
  const publishedArticles = await prisma.article.findMany({
    where: {
      approvalStatus: 'APPROVED',
      submission: {
        id: { not: submissionId } // Không so sánh với chính nó
      }
    },
    include: {
      submission: true
    },
    take: 500
  })
  
  // So sánh với các Submissions
  for (const other of otherSubmissions) {
    const compareText = [
      other.title,
      other.abstractVn || '',
      other.abstractEn || '',
      other.article?.htmlBody || ''
    ].join(' ')
    
    if (compareText.trim().length < 50) continue
    
    const similarity = similarityFn(sourceText, compareText) * 100
    
    if (similarity >= 15) { // Ngưỡng 15%
      const matchedPhrases = findMatchedPhrases(sourceText, compareText)
      matches.push({
        id: other.id,
        title: other.title,
        type: 'submission',
        similarity: Math.round(similarity * 10) / 10,
        matchedPhrases
      })
    }
  }
  
  // So sánh với Articles đã xuất bản
  for (const article of publishedArticles) {
    // Bỏ qua nếu đã có trong danh sách submissions
    if (matches.some(m => m.type === 'submission' && m.id === article.submissionId)) continue
    
    const compareText = [
      article.submission?.title || '',
      article.submission?.abstractVn || '',
      article.htmlBody || ''
    ].join(' ')
    
    if (compareText.trim().length < 50) continue
    
    const similarity = similarityFn(sourceText, compareText) * 100
    
    if (similarity >= 15) {
      const matchedPhrases = findMatchedPhrases(sourceText, compareText)
      matches.push({
        id: article.id,
        title: article.submission?.title || `Article ${article.id}`,
        type: 'article',
        similarity: Math.round(similarity * 10) / 10,
        matchedPhrases
      })
    }
  }
  
  // Sắp xếp theo độ tương đồng giảm dần
  matches.sort((a, b) => b.similarity - a.similarity)
  
  const totalCompared = otherSubmissions.length + publishedArticles.length
  const score = matches.length > 0 ? matches[0].similarity : 0
  const averageScore = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length) * 10) / 10
    : 0
  
  return {
    score,
    averageScore,
    totalCompared,
    matches: matches.slice(0, 10), // Top 10 kết quả
    method
  }
}

/**
 * Lưu kết quả kiểm tra vào database
 */
export async function savePlagiarismReport(
  submissionId: string,
  result: PlagiarismResult,
  userId?: string
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
      notes: `Điểm trung bình: ${result.averageScore}%. Tìm thấy ${result.matches.length} bài tương tự.`
    }
  })
}

/**
 * Kiểm tra đạo văn từ raw text (dùng cho upload PDF trực tiếp).
 * Không cần submission trong DB — chỉ so sánh text với toàn bộ CSDL.
 */
export async function checkTextPlagiarism(
  sourceText: string,
  method: 'cosine' | 'jaccard' = 'cosine'
): Promise<PlagiarismResult> {
  if (sourceText.trim().length < 50) {
    return { score: 0, averageScore: 0, totalCompared: 0, matches: [], method }
  }

  const similarityFn = method === 'cosine' ? cosineSimilarity : jaccardSimilarity
  const matches: PlagiarismMatch[] = []

  const [otherSubmissions, publishedArticles] = await Promise.all([
    prisma.submission.findMany({
      where: { status: { notIn: ['DESK_REJECT', 'REJECTED'] } },
      include: { article: true },
      take: 500,
    }),
    prisma.article.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: { submission: true },
      take: 500,
    }),
  ])

  for (const sub of otherSubmissions) {
    const compareText = [sub.title, sub.abstractVn || '', sub.abstractEn || '', sub.article?.htmlBody || ''].join(' ')
    if (compareText.trim().length < 50) continue
    const similarity = similarityFn(sourceText, compareText) * 100
    if (similarity >= 15) {
      matches.push({
        id: sub.id, title: sub.title, type: 'submission',
        similarity: Math.round(similarity * 10) / 10,
        matchedPhrases: findMatchedPhrases(sourceText, compareText),
      })
    }
  }

  for (const article of publishedArticles) {
    if (matches.some(m => m.type === 'submission' && m.id === article.submissionId)) continue
    const compareText = [article.submission?.title || '', article.submission?.abstractVn || '', article.htmlBody || ''].join(' ')
    if (compareText.trim().length < 50) continue
    const similarity = similarityFn(sourceText, compareText) * 100
    if (similarity >= 15) {
      matches.push({
        id: article.id, title: article.submission?.title || `Article ${article.id}`, type: 'article',
        similarity: Math.round(similarity * 10) / 10,
        matchedPhrases: findMatchedPhrases(sourceText, compareText),
      })
    }
  }

  matches.sort((a, b) => b.similarity - a.similarity)
  const totalCompared = otherSubmissions.length + publishedArticles.length
  const score = matches.length > 0 ? matches[0].similarity : 0
  const averageScore = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length) * 10) / 10
    : 0

  return { score, averageScore, totalCompared, matches: matches.slice(0, 10), method }
}

/**
 * Lấy báo cáo kiểm tra đạo văn mới nhất của submission
 */
export async function getLatestPlagiarismReport(submissionId: string) {
  return prisma.plagiarismReport.findFirst({
    where: { submissionId },
    orderBy: { checkedAt: 'desc' },
    include: {
      checker: {
        select: { fullName: true, email: true }
      }
    }
  })
}
