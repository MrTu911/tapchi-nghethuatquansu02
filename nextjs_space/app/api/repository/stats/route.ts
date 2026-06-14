import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { getRepositoryStats } from '@/lib/services/repository.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const yearFilter = searchParams.get('year') || undefined

    const data = await getRepositoryStats(yearFilter)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Repository stats error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
