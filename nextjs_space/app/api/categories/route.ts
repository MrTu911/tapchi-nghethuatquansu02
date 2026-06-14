
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { getServerSession } from '@/lib/auth'
import { getCachedData, invalidateCache } from '@/lib/cache'

const CACHE_KEY = 'categories:all'
const CACHE_TTL = 10 * 60 // 10 minutes — categories change rarely

export async function GET(_request: NextRequest) {
  try {
    const categories = await getCachedData(
      CACHE_KEY,
      () => prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              submissions: { where: { status: 'PUBLISHED' } }
            }
          }
        }
      }),
      CACHE_TTL
    )

    return successResponse(categories)
  } catch (error) {
    console.error('[CATEGORIES GET]', error)
    return errorResponse('Lỗi server')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    // Check permissions
    const allowedRoles = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC']
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403)
    }

    const body = await request.json()
    const { code, name, slug, description } = body

    // Validate required fields
    if (!code || !name || !slug) {
      return errorResponse('Thiếu thông tin bắt buộc', 400)
    }

    // Check if code or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { code },
          { slug }
        ]
      }
    })

    if (existingCategory) {
      if (existingCategory.code === code) {
        return errorResponse('Mã chuyên mục đã tồn tại', 400)
      }
      if (existingCategory.slug === slug) {
        return errorResponse('Slug đã tồn tại', 400)
      }
    }

    const category = await prisma.category.create({
      data: {
        code,
        name,
        slug,
        description: description || null,
      }
    })

    invalidateCache('categories:')
    return successResponse(category, 'Tạo chuyên mục thành công')
  } catch (error) {
    console.error('Create category error:', error)
    return errorResponse('Lỗi server khi tạo chuyên mục')
  }
}
