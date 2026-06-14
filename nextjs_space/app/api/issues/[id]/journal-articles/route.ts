import { NextRequest, NextResponse } from 'next/server'
import { JournalClassification } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/services/journal-issue-import.service'
import { buildUnambiguousUserNameMap, matchUserId } from '@/lib/services/journal-author-linker'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId') ?? undefined

    const issue = await prisma.issue.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    })
    if (!issue) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy số tạp chí' }, { status: 404 })
    }

    const articles = await prisma.journalArticle.findMany({
      where: { issueId: issue.id, ...(sectionId ? { sectionId } : {}) },
      include: {
        authors:  { orderBy: { order: 'asc' } },
        section:  { select: { id: true, name: true, slug: true, order: true } },
      },
      orderBy: { pageStart: 'asc' },
    })

    return NextResponse.json({ success: true, data: articles })
  } catch (error) {
    console.error('journal-articles GET error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải bài viết' }, { status: 500 })
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

    type AuthorInput = { name: string; militaryRank?: string; academicTitle?: string; degree?: string; organization?: string; order?: number }
    type ArticleBody = { title: string; sectionId?: string; authorsText: string; pageStart: number; pageEnd?: number; abstract?: string; keywords?: string[]; authors?: AuthorInput[]; journalType?: JournalClassification; journalNameOverride?: string | null }
    const body = await request.json() as ArticleBody
    const { title, sectionId, authorsText, pageStart, pageEnd, abstract, keywords, authors, journalType, journalNameOverride } = body

    if (!title || !authorsText || typeof pageStart !== 'number') {
      return NextResponse.json({ success: false, error: 'title, authorsText, pageStart là bắt buộc' }, { status: 400 })
    }

    const slug = `${slugify(title)}-tr${pageStart}`
    const userNameMap = await buildUnambiguousUserNameMap()

    const article = await prisma.journalArticle.create({
      data: {
        issueId:     issue.id,
        sectionId:   sectionId ?? null,
        title,
        slug,
        authorsText,
        pageStart,
        pageEnd:     pageEnd ?? null,
        abstract:    abstract ?? null,
        keywords:    keywords ?? [],
        status:      'PUBLISHED',
        journalType: journalType, // undefined => default DOMESTIC_PEER_REVIEWED
        journalNameOverride: journalNameOverride ?? null,
        authors: authors?.length
          ? {
              create: authors.map((a, i) => ({
                name:          a.name,
                militaryRank:  a.militaryRank ?? null,
                academicTitle: a.academicTitle ?? null,
                degree:        a.degree ?? null,
                organization:  a.organization ?? null,
                order:         a.order ?? i,
                userId:        matchUserId(userNameMap, a.name),
              })),
            }
          : undefined,
      },
      include: { authors: true, section: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: article }, { status: 201 })
  } catch (error) {
    console.error('journal-articles POST error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tạo bài viết' }, { status: 500 })
  }
}
