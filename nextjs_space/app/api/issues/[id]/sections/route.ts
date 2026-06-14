import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/services/journal-issue-import.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const issue = await prisma.issue.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    })
    if (!issue) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy số tạp chí' }, { status: 404 })
    }

    const sections = await prisma.issueSection.findMany({
      where: { issueId: issue.id },
      include: {
        journalArticles: {
          include: {
            authors: { orderBy: { order: 'asc' } },
          },
          orderBy: { pageStart: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: sections })
  } catch (error) {
    console.error('sections GET error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải chuyên mục' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const issue = await prisma.issue.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    })
    if (!issue) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy số tạp chí' }, { status: 404 })
    }

    const body = await request.json() as { name: string; order: number }
    const { name, order } = body

    if (!name || typeof order !== 'number') {
      return NextResponse.json({ success: false, error: 'name và order là bắt buộc' }, { status: 400 })
    }

    const section = await prisma.issueSection.create({
      data: {
        issueId: issue.id,
        name,
        slug:  slugify(name),
        order,
      },
    })

    return NextResponse.json({ success: true, data: section }, { status: 201 })
  } catch (error) {
    console.error('sections POST error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tạo chuyên mục' }, { status: 500 })
  }
}
