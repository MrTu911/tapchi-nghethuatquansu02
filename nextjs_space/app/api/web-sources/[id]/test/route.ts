import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { webScraperService } from '@/lib/services/web-scraper.service'
import type { Role } from '@prisma/client'
import type { SelectorRules } from '@/lib/services/web-scraper.service'

const MANAGE_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']

// POST /api/web-sources/[id]/test — test crawl 1 URL, không lưu DB
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(MANAGE_ROLES)

    const body = await req.json()
    const { url, selectorRules } = body

    if (!url || !selectorRules) {
      return errorResponse('Thiếu url hoặc selectorRules', 400)
    }

    try { new URL(url) } catch { return errorResponse('URL không hợp lệ', 400) }

    const result = await webScraperService.testScrape(url, selectorRules)

    return successResponse(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
