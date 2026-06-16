/**
 * Web Scraper Service
 * Crawl bài viết từ các trang web bên ngoài bằng Puppeteer
 * Xử lý: parse HTML, dedup, download media về S3
 */

import * as crypto from 'crypto'
import { prisma } from '../prisma'
import { uploadFileToS3 } from '../s3'
import { logger } from '../logger'
import type { WebSource, CrawlJob } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectorRules {
  articleListSelector: string   // CSS selector cho danh sách bài
  articleLinkSelector: string   // CSS selector cho link mỗi bài
  titleSelector: string         // CSS selector cho tiêu đề
  contentSelector: string       // CSS selector cho nội dung
  authorSelector?: string
  dateSelector?: string
  imageSelector?: string        // Nếu khác img mặc định
  summarySelector?: string
  maxPages?: number             // Số trang danh sách tối đa (default 1)
  paginationSelector?: string   // CSS selector nút Next page
  waitForSelector?: string      // Chờ element này trước khi parse
  userAgent?: string
  cookies?: Array<{ name: string; value: string }>
}

export interface ScrapeResult {
  sourceUrl: string
  rawTitle: string
  rawContent: string       // HTML đã clean
  rawSummary?: string
  rawAuthor?: string
  rawDate?: Date
  rawImageUrls: string[]
  rawVideoUrls: string[]
}

interface CrawlLogEntry {
  time: string
  level: 'info' | 'warn' | 'error'
  message: string
}

interface CrawlRunResult {
  articlesFound: number
  articlesNew: number
  articlesDuplicate: number
  articlesFailed: number
  logs: CrawlLogEntry[]
}

// ─── Helper: SHA256 hash ─────────────────────────────────────────────────────

export function computeUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url.trim()).digest('hex')
}

export function computeTitleHash(title: string): string {
  const normalized = title.trim().toLowerCase().replace(/\s+/g, ' ')
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

// ─── Helper: clean HTML ───────────────────────────────────────────────────────

function extractVideoUrls(html: string): string[] {
  const videoUrls: string[] = []
  const iframeRegex = /<iframe[^>]+src="([^"]+)"[^>]*>/gi
  let match
  while ((match = iframeRegex.exec(html)) !== null) {
    const src = match[1]
    if (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com')) {
      videoUrls.push(src)
    }
  }
  return videoUrls
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const imageUrls: string[] = []
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    if (src.startsWith('http')) {
      imageUrls.push(src)
    } else if (src.startsWith('/')) {
      try {
        const base = new URL(baseUrl)
        imageUrls.push(`${base.origin}${src}`)
      } catch {
        // skip invalid URL
      }
    }
  }
  return [...new Set(imageUrls)] // deduplicate
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Chỉ collapse whitespace trong text nodes, không collapse toàn bộ HTML
    // để giữ nguyên block elements như <p>, <br>, <li>
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// ─── Puppeteer launcher ───────────────────────────────────────────────────────

async function launchBrowser() {
  if (process.env.NODE_ENV === 'production') {
    const chromium = await import('@sparticuz/chromium')
    const puppeteer = await import('puppeteer-core')
    return puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })
  } else {
    const puppeteer = await import('puppeteer-core')
    return puppeteer.default.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class WebScraperService {
  // Scrape danh sách URL bài viết từ trang danh sách
  private async scrapeArticleUrls(
    page: Awaited<ReturnType<Awaited<ReturnType<typeof launchBrowser>>['newPage']>>,
    source: WebSource,
    rules: SelectorRules,
    logs: CrawlLogEntry[]
  ): Promise<string[]> {
    const addLog = (level: CrawlLogEntry['level'], message: string) => {
      logs.push({ time: new Date().toISOString(), level, message })
    }

    const urls: string[] = []
    const maxPages = rules.maxPages || 1

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const pageUrl = pageNum === 1 ? source.url : `${source.url}?page=${pageNum}`
        addLog('info', `Đang tải trang danh sách: ${pageUrl}`)

        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

        if (rules.waitForSelector) {
          await page.waitForSelector(rules.waitForSelector, { timeout: 10000 }).catch(() => {})
        }

        const pageUrls = await page.evaluate(
          (listSel: string, linkSel: string, baseHref: string) => {
            const container = document.querySelector(listSel)
            if (!container) return []
            const links = container.querySelectorAll(linkSel)
            return Array.from(links)
              .map((el) => {
                const href = (el as HTMLAnchorElement).href || el.getAttribute('href') || ''
                if (href.startsWith('http')) return href
                if (href.startsWith('/')) return new URL(href, baseHref).toString()
                return ''
              })
              .filter(Boolean)
          },
          rules.articleListSelector,
          rules.articleLinkSelector,
          source.url
        )

        urls.push(...pageUrls)
        addLog('info', `Trang ${pageNum}: tìm thấy ${pageUrls.length} bài`)

        if (!rules.paginationSelector || pageUrls.length === 0) break

        await new Promise((r) => setTimeout(r, source.delayBetweenRequests))
      } catch (err) {
        addLog('warn', `Lỗi tải trang ${pageNum}: ${err instanceof Error ? err.message : String(err)}`)
        break
      }
    }

    return [...new Set(urls)] // dedup
  }

  // Scrape nội dung 1 bài cụ thể
  private async scrapeArticle(
    page: Awaited<ReturnType<Awaited<ReturnType<typeof launchBrowser>>['newPage']>>,
    url: string,
    rules: SelectorRules,
    logs: CrawlLogEntry[]
  ): Promise<ScrapeResult | null> {
    const addLog = (level: CrawlLogEntry['level'], message: string) => {
      logs.push({ time: new Date().toISOString(), level, message })
    }

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

      if (rules.waitForSelector) {
        await page.waitForSelector(rules.waitForSelector, { timeout: 10000 }).catch(() => {})
      }

      const result = await page.evaluate(
        (r: SelectorRules) => {
          const getText = (sel: string) => document.querySelector(sel)?.textContent?.trim() || ''
          const getHtml = (sel: string) => document.querySelector(sel)?.innerHTML || ''

          const rawTitle = getText(r.titleSelector)
          const rawContent = r.contentSelector ? getHtml(r.contentSelector) : ''
          const rawSummary = r.summarySelector ? getText(r.summarySelector) : undefined
          const rawAuthor = r.authorSelector ? getText(r.authorSelector) : undefined
          const rawDateStr = r.dateSelector ? getText(r.dateSelector) : undefined

          return { rawTitle, rawContent, rawSummary, rawAuthor, rawDateStr }
        },
        rules
      )

      if (!result.rawTitle || !result.rawContent) {
        addLog('warn', `Bài ${url}: không tìm thấy tiêu đề hoặc nội dung`)
        return null
      }

      const cleaned = cleanHtml(result.rawContent)
      const rawImageUrls = extractImageUrls(result.rawContent, url)
      const rawVideoUrls = extractVideoUrls(result.rawContent)

      let rawDate: Date | undefined
      if (result.rawDateStr) {
        const parsed = new Date(result.rawDateStr)
        if (!isNaN(parsed.getTime())) rawDate = parsed
      }

      return {
        sourceUrl: url,
        rawTitle: result.rawTitle,
        rawContent: cleaned,
        rawSummary: result.rawSummary,
        rawAuthor: result.rawAuthor,
        rawDate,
        rawImageUrls,
        rawVideoUrls,
      }
    } catch (err) {
      addLog('error', `Lỗi scrape bài ${url}: ${err instanceof Error ? err.message : String(err)}`)
      return null
    }
  }

  // Kiểm tra dedup: URL hoặc title đã tồn tại chưa
  private async checkDuplicate(
    urlHash: string,
    titleHash: string
  ): Promise<'NONE' | 'URL' | 'TITLE'> {
    const byUrl = await prisma.crawledContent.findUnique({ where: { urlHash } })
    if (byUrl) return 'URL'

    const byTitle = await prisma.crawledContent.findFirst({ where: { titleHash } })
    if (byTitle) return 'TITLE'

    return 'NONE'
  }

  // Download 1 ảnh từ URL về S3
  async downloadImageToS3(
    imageUrl: string,
    sourceId: string
  ): Promise<string | null> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NTQSBot/1.0)' },
      }).finally(() => clearTimeout(timeout))

      if (!response.ok) return null

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) return null

      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 5 * 1024 * 1024) return null // skip >5MB

      const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg'
      const hash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 8)
      const yyyyMM = new Date().toISOString().substring(0, 7).replace('-', '')
      const fileName = `${hash}.${ext}`

      const { cloudStoragePath } = await uploadFileToS3(
        Buffer.from(buffer),
        fileName,
        contentType,
        `crawled-media/${sourceId}/${yyyyMM}`,
        true
      )

      return cloudStoragePath
    } catch {
      return null
    }
  }

  // Download tất cả media của 1 bài và cập nhật DB
  // Sau khi download, rewrite URL ảnh trong rawContent sang S3 proxy URL
  async processAllMedia(contentId: string, imageUrls: string[], sourceId: string): Promise<void> {
    const content = await prisma.crawledContent.findUnique({
      where: { id: contentId },
      select: { rawContent: true },
    })
    if (!content) return

    // Map: originalUrl → s3Path
    const urlToS3: Map<string, string> = new Map()
    const s3Paths: string[] = []

    for (const url of imageUrls.slice(0, 10)) {
      const path = await this.downloadImageToS3(url, sourceId)
      if (path) {
        s3Paths.push(path)
        urlToS3.set(url, path)
      }
    }

    // Rewrite img src trong rawContent để trỏ sang /api/files/<s3path>
    let updatedContent = content.rawContent
    for (const [originalUrl, s3Path] of urlToS3) {
      // escape ký tự đặc biệt trong URL để dùng trong regex
      const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      updatedContent = updatedContent.replace(
        new RegExp(escaped, 'g'),
        `/api/files/${s3Path}`
      )
    }

    const coverImageS3 = s3Paths[0] || null
    const imagesS3 = s3Paths.slice(1)

    await prisma.crawledContent.update({
      where: { id: contentId },
      data: {
        coverImageS3,
        imagesS3,
        // Chỉ cập nhật rawContent nếu có ảnh được download thành công
        ...(urlToS3.size > 0 && { rawContent: updatedContent }),
      },
    })
  }

  // Validate selector rules trước khi crawl
  validateRules(rules: SelectorRules): string | null {
    if (!rules.articleListSelector?.trim()) return 'articleListSelector không được để trống'
    if (!rules.articleLinkSelector?.trim()) return 'articleLinkSelector không được để trống'
    if (!rules.titleSelector?.trim()) return 'titleSelector không được để trống'
    if (!rules.contentSelector?.trim()) return 'contentSelector không được để trống'
    return null
  }

  // Entry point: chạy toàn bộ crawl cho 1 nguồn
  async runCrawl(source: WebSource, jobId: string): Promise<CrawlRunResult> {
    const logs: CrawlLogEntry[] = []
    const addLog = (level: CrawlLogEntry['level'], message: string) => {
      logs.push({ time: new Date().toISOString(), level, message })
    }

    const result: CrawlRunResult = {
      articlesFound: 0,
      articlesNew: 0,
      articlesDuplicate: 0,
      articlesFailed: 0,
      logs,
    }

    let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null

    try {
      addLog('info', `Bắt đầu crawl nguồn: ${source.name} (${source.url})`)

      const rules = source.selectorRules as unknown as SelectorRules

      const validationError = this.validateRules(rules)
      if (validationError) {
        addLog('error', `Cấu hình selector không hợp lệ: ${validationError}. Vào trang chi tiết nguồn để cập nhật selector.`)
        result.articlesFailed = 1
        return result
      }

      browser = await launchBrowser()

      const listPage = await browser.newPage()
      if (rules.userAgent) await listPage.setUserAgent(rules.userAgent)
      if (rules.cookies?.length) {
        const pageUrl = new URL(source.url)
        await listPage.setCookie(
          ...rules.cookies.map((c) => ({ ...c, domain: pageUrl.hostname }))
        )
      }

      const articleUrls = await this.scrapeArticleUrls(listPage, source, rules, logs)
      await listPage.close()

      const toProcess = articleUrls.slice(0, source.maxArticlesPerRun)
      result.articlesFound = toProcess.length
      addLog('info', `Tìm thấy ${toProcess.length} bài để xử lý`)

      for (const articleUrl of toProcess) {
        const urlHash = computeUrlHash(articleUrl)

        // Quick URL dedup check trước khi mở trang mới
        const existing = await prisma.crawledContent.findUnique({ where: { urlHash } })
        if (existing) {
          result.articlesDuplicate++
          addLog('info', `Bỏ qua (đã crawl): ${articleUrl}`)
          continue
        }

        const articlePage = await browser.newPage()
        if (rules.userAgent) await articlePage.setUserAgent(rules.userAgent)

        const scraped = await this.scrapeArticle(articlePage, articleUrl, rules, logs)
        await articlePage.close()

        if (!scraped) {
          result.articlesFailed++
          continue
        }

        const titleHash = computeTitleHash(scraped.rawTitle)
        const dupType = await this.checkDuplicate(urlHash, titleHash)

        if (dupType === 'URL') {
          result.articlesDuplicate++
          addLog('info', `Trùng URL: ${articleUrl}`)
          continue
        }

        const status = dupType === 'TITLE' ? 'DUPLICATE' : 'PENDING'

        try {
          const created = await prisma.crawledContent.create({
            data: {
              webSourceId: source.id,
              crawlJobId: jobId,
              sourceUrl: scraped.sourceUrl,
              urlHash,
              titleHash,
              rawTitle: scraped.rawTitle,
              rawContent: scraped.rawContent,
              rawSummary: scraped.rawSummary,
              rawAuthor: scraped.rawAuthor,
              rawDate: scraped.rawDate,
              rawImageUrls: scraped.rawImageUrls,
              rawVideoUrls: scraped.rawVideoUrls,
              category: source.defaultCategory,
              tags: source.defaultTags,
              status: status as 'PENDING' | 'DUPLICATE',
            },
          })

          result.articlesNew++
          addLog('info', `Đã lưu${status === 'DUPLICATE' ? ' (trùng tiêu đề)' : ''}: ${scraped.rawTitle}`)

          // Download media async, không block vòng lặp chính
          if (scraped.rawImageUrls.length > 0) {
            this.processAllMedia(created.id, scraped.rawImageUrls, source.id).catch((e) =>
              logger.error({ msg: 'Media download error', contentId: created.id, error: e })
            )
          }
        } catch (err) {
          result.articlesFailed++
          addLog('error', `Lỗi lưu DB: ${err instanceof Error ? err.message : String(err)}`)
        }

        await new Promise((r) => setTimeout(r, source.delayBetweenRequests))
      }

      addLog('info', `Hoàn thành: ${result.articlesNew} mới, ${result.articlesDuplicate} trùng, ${result.articlesFailed} lỗi`)
    } catch (err) {
      addLog('error', `Lỗi nghiêm trọng: ${err instanceof Error ? err.message : String(err)}`)
      logger.error({ msg: 'WebScraper.runCrawl fatal error', sourceId: source.id, error: err })
    } finally {
      if (browser) {
        await browser.close().catch(() => {})
      }
    }

    return result
  }

  // Test crawl 1 URL, không lưu DB — dùng cho preview trong UI
  async testScrape(
    url: string,
    rules: SelectorRules
  ): Promise<{ success: boolean; title?: string; contentPreview?: string; imageUrls?: string[]; error?: string }> {
    let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null

    try {
      browser = await launchBrowser()
      const page = await browser.newPage()
      if (rules.userAgent) await page.setUserAgent(rules.userAgent)

      const logs: CrawlLogEntry[] = []
      const result = await this.scrapeArticle(page, url, rules, logs)
      await page.close()

      if (!result) {
        return { success: false, error: 'Không tìm thấy nội dung với selector đã cấu hình' }
      }

      return {
        success: true,
        title: result.rawTitle,
        contentPreview: result.rawContent.substring(0, 500),
        imageUrls: result.rawImageUrls.slice(0, 5),
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      if (browser) await browser.close().catch(() => {})
    }
  }
}

export const webScraperService = new WebScraperService()
