import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/responses'
import { getCrawlScheduler } from '@/lib/services/crawl-scheduler.service'
import { logger } from '@/lib/logger'

// POST /api/internal/init-crawl-scheduler
// Gọi để khởi động cron scheduler sau khi server restart
// Bảo vệ bằng INTERNAL_API_KEY env variable
export async function POST(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key')
  const expectedKey = process.env.INTERNAL_API_KEY

  if (!expectedKey || internalKey !== expectedKey) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const scheduler = getCrawlScheduler()
    await scheduler.loadAndRegisterAllActive()

    logger.info('CrawlScheduler: initialized via API')

    return successResponse({ activeJobs: scheduler.getActiveCount() }, 'Crawl scheduler đã được khởi động')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khởi động scheduler'
    return errorResponse(msg, 500)
  }
}

// GET — health check
export async function GET() {
  const scheduler = getCrawlScheduler()
  return successResponse({
    activeJobs: scheduler.getActiveCount(),
    status: 'running',
  })
}
