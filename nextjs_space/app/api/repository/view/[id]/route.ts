import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import {
  getRepositoryArticleDetail,
  RepositoryArticleSource,
} from '@/lib/services/repository.service'

export const dynamic = 'force-dynamic'

const VALID_SOURCES: RepositoryArticleSource[] = ['PEER_REVIEW', 'JOURNAL_IMPORT']

/**
 * GET: chi tiết một bài báo trong CSDL để xem trực tiếp (inline) trong dashboard,
 * gộp cả bài qua phản biện (Article) lẫn bài kho số (JournalArticle).
 *
 * Khác `/api/repository/[id]` (chỉ phục vụ CRUD sửa metadata bài PEER_REVIEW, yêu
 * cầu quyền quản trị): route này chỉ cần đăng nhập — mọi vai trò trong dashboard
 * đều xem được nội dung, và KHÔNG tăng lượt xem để tránh làm sai số liệu vận hành.
 *
 * `sourceType` lấy từ kết quả search để chọn đúng model (id hai model là không gian
 * riêng, có thể trùng giá trị).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const sourceParam = new URL(req.url).searchParams.get('sourceType')
    const sourceType: RepositoryArticleSource = VALID_SOURCES.includes(
      sourceParam as RepositoryArticleSource,
    )
      ? (sourceParam as RepositoryArticleSource)
      : 'PEER_REVIEW'

    const article = await getRepositoryArticleDetail(params.id, sourceType)
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bài báo' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('Repository article detail error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải bài báo' }, { status: 500 })
  }
}
