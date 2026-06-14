/**
 * Crawl Scheduler Service
 * Quản lý lịch tự động crawl cho từng WebSource bằng node-cron
 * Pattern: Singleton, lazy init
 */

import { schedule, ScheduledTask } from 'node-cron'
import { prisma } from '../prisma'
import { webScraperService } from './web-scraper.service'
import { logger } from '../logger'
import type { WebSource, CrawlFrequency } from '@prisma/client'

// ─── Cron map ─────────────────────────────────────────────────────────────────

const CRON_EXPRESSIONS: Record<CrawlFrequency, string | null> = {
  EVERY_HOUR:     '0 * * * *',
  EVERY_6_HOURS:  '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
  DAILY:          '0 6 * * *',
  WEEKLY:         '0 6 * * 1',
  MANUAL:         null,
}

// ─── Scheduler Service ───────────────────────────────────────────────────────

class CrawlSchedulerService {
  private activeJobs: Map<string, ScheduledTask> = new Map()

  // Đăng ký cron cho 1 nguồn
  registerSource(source: WebSource): void {
    this.unregisterSource(source.id) // xóa cũ nếu có

    const cronExpr = CRON_EXPRESSIONS[source.frequency]
    if (!cronExpr || !source.isActive) return

    const task = schedule(cronExpr, () => {
      this.executeJob(source.id).catch((err) =>
        logger.error({ msg: 'CrawlScheduler: job failed', sourceId: source.id, error: err })
      )
    })

    this.activeJobs.set(source.id, task)
    logger.info({ msg: 'CrawlScheduler: registered', sourceId: source.id, freq: source.frequency })
  }

  // Huỷ cron cho 1 nguồn
  unregisterSource(sourceId: string): void {
    const existing = this.activeJobs.get(sourceId)
    if (existing) {
      existing.stop()
      this.activeJobs.delete(sourceId)
      logger.info({ msg: 'CrawlScheduler: unregistered', sourceId })
    }
  }

  // Load tất cả nguồn active từ DB và đăng ký cron
  async loadAndRegisterAllActive(): Promise<void> {
    try {
      const sources = await prisma.webSource.findMany({ where: { isActive: true } })
      for (const source of sources) {
        this.registerSource(source)
      }
      logger.info({ msg: 'CrawlScheduler: loaded', count: sources.length })
    } catch (err) {
      logger.error({ msg: 'CrawlScheduler: loadAndRegisterAllActive failed', error: err })
    }
  }

  // Trigger crawl thủ công (từ API)
  async triggerManual(sourceId: string, actorId: string): Promise<{ jobId: string }> {
    // Kiểm tra không có job đang RUNNING
    const runningJob = await prisma.crawlJob.findFirst({
      where: { webSourceId: sourceId, status: 'RUNNING' },
    })
    if (runningJob) {
      throw new Error('Nguồn này đang có một tác vụ crawl đang chạy')
    }

    const source = await prisma.webSource.findUnique({ where: { id: sourceId } })
    if (!source) throw new Error('Không tìm thấy nguồn web')
    if (!source.isActive) throw new Error('Nguồn web này đang bị tắt')

    const job = await prisma.crawlJob.create({
      data: {
        webSourceId: sourceId,
        triggeredBy: actorId,
        status: 'PENDING',
      },
    })

    // Chạy async, không block response
    this.executeJob(sourceId, job.id, actorId).catch((err) =>
      logger.error({ msg: 'CrawlScheduler: manual trigger failed', sourceId, jobId: job.id, error: err })
    )

    return { jobId: job.id }
  }

  // Thực thi 1 crawl job
  private async executeJob(sourceId: string, existingJobId?: string, actorId?: string): Promise<void> {
    const source = await prisma.webSource.findUnique({ where: { id: sourceId } })
    if (!source || !source.isActive) return

    let jobId = existingJobId

    if (!jobId) {
      const job = await prisma.crawlJob.create({
        data: {
          webSourceId: sourceId,
          triggeredBy: actorId || null,
          status: 'PENDING',
        },
      })
      jobId = job.id
    }

    // Cập nhật trạng thái RUNNING
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    try {
      const result = await webScraperService.runCrawl(source, jobId)

      const finalStatus =
        result.articlesFailed > 0 && result.articlesNew === 0
          ? 'FAILED'
          : result.articlesFailed > 0
          ? 'PARTIAL'
          : 'COMPLETED'

      await prisma.$transaction([
        prisma.crawlJob.update({
          where: { id: jobId },
          data: {
            status: finalStatus,
            completedAt: new Date(),
            articlesFound: result.articlesFound,
            articlesNew: result.articlesNew,
            articlesDuplicate: result.articlesDuplicate,
            articlesFailed: result.articlesFailed,
            logs: result.logs as object,
          },
        }),
        prisma.webSource.update({
          where: { id: sourceId },
          data: {
            lastCrawledAt: new Date(),
            totalCrawled: { increment: result.articlesNew },
          },
        }),
      ])
    } catch (err) {
      await prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }

  // Số nguồn đang được schedule
  getActiveCount(): number {
    return this.activeJobs.size
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: CrawlSchedulerService | null = null

export function getCrawlScheduler(): CrawlSchedulerService {
  if (!instance) {
    instance = new CrawlSchedulerService()
    instance.loadAndRegisterAllActive().catch((err) =>
      logger.error({ msg: 'CrawlScheduler: init failed', error: err })
    )
  }
  return instance
}

export { CrawlSchedulerService }
