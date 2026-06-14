import { NextRequest, NextResponse } from 'next/server'
import { searchRepository, RepositoryArticleSource } from '@/lib/services/repository.service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || ''
    const categoryId = searchParams.get('categoryId') || undefined
    const year = searchParams.get('year') || undefined
    const author = searchParams.get('author') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sourceTypeParam = searchParams.get('sourceType') as RepositoryArticleSource | null

    const result = await searchRepository({
      keyword: keyword || undefined,
      author: author || undefined,
      categoryId: categoryId || undefined,
      year: year || undefined,
      limit,
      offset,
      sourceType: sourceTypeParam ?? undefined,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Repository search error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tìm kiếm' }, { status: 500 })
  }
}
