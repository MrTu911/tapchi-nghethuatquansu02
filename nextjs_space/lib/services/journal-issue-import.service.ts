/**
 * Journal Issue Import Service
 *
 * Nhập một số báo in (đã xuất bản) vào hệ thống thư viện số.
 * Hoàn toàn tách biệt với workflow submission/peer-review.
 * Sử dụng upsert trong một transaction để đảm bảo idempotent.
 */

import { PrismaClient } from '@prisma/client'
import { buildUnambiguousMapFromUsers, matchUserId } from './journal-author-linker'

const prisma = new PrismaClient()

// ─── Input types ──────────────────────────────────────────────────────────────

export interface AuthorSeedInput {
  /** Chuỗi tác giả đầy đủ, e.g. "Thượng tá, TS. Đỗ Duy Thắng" */
  raw: string
}

export interface ArticleSeedInput {
  pageStart: number
  pageEnd?: number
  title: string
  /** Tác giả dạng mảng chuỗi gốc từ mục lục PDF */
  authors: string[]
  abstract?: string
  keywords?: string[]
}

export interface SectionSeedInput {
  name: string
  order: number
  articles: ArticleSeedInput[]
}

export interface VolumeSeedInput {
  volumeNo: number
  year: number
  issn?: string
  publicationPeriod?: string
  title?: string
}

export interface IssueSeedInput {
  /** Số thứ tự trong tập, e.g. 1 */
  number: number
  year: number
  title: string
  slug: string
  /** Số thứ tự liên tục, e.g. 231 trong "Số 1 (231) - 2025" */
  issueCode?: number
  coverImage?: string
  pdfUrl?: string
  coverCaption?: string
  coverPhotoCredit?: string
  pageCount?: number
  publishDate?: Date
}

export interface CouncilMemberSeedInput {
  order: number
  role: string
  fullName: string
  militaryRank?: string | null
  academicTitle?: string | null
  degree?: string | null
}

export interface JournalIssueSeed {
  volume: VolumeSeedInput
  issue: IssueSeedInput
  sections: SectionSeedInput[]
  advisoryCouncil?: CouncilMemberSeedInput[]
}

// ─── Author string parser ──────────────────────────────────────────────────────

interface ParsedAuthor {
  name: string
  militaryRank?: string
  academicTitle?: string
  degree?: string
}

const MILITARY_RANKS = [
  'Đại tướng', 'Thượng tướng', 'Trung tướng', 'Thiếu tướng',
  'Đại tá', 'Thượng tá', 'Trung tá', 'Thiếu tá',
  'Đại úy', 'Thượng úy', 'Trung úy', 'Thiếu úy',
] as const

// Matches "GS.TS.", "PGS.TS.", "TS.", "ThS.", "CN.", "BS CKI.", "BS CKII.", "BS."
const TITLE_DEGREE_RE = /^(GS\.TS\.|PGS\.TS\.|GS\.|PGS\.|TS\.|ThS\.|CN\.|BS\s+CKII?\.|BS\.)(\s*)/

function parseAuthorString(raw: string): ParsedAuthor {
  let rest = raw.trim()
  let militaryRank: string | undefined
  let academicTitle: string | undefined
  let degree: string | undefined

  // 1. Extract military rank (always at the start, before first comma)
  for (const rank of MILITARY_RANKS) {
    if (rest.startsWith(rank)) {
      militaryRank = rank
      rest = rest.slice(rank.length).replace(/^,\s*/, '').trim()
      break
    }
  }

  // 2. Extract academic title and/or degree
  const m = rest.match(TITLE_DEGREE_RE)
  if (m) {
    const token = m[1].replace(/\.$/, '').trim() // e.g. "GS.TS", "ThS", "CN"
    if (token.includes('.')) {
      const [at, deg] = token.split('.')
      academicTitle = at   // "GS" or "PGS"
      degree = deg         // "TS"
    } else if (token === 'GS' || token === 'PGS') {
      academicTitle = token
    } else {
      degree = token
    }
    rest = rest.slice(m[0].length).trim()
  }

  return { name: rest, militaryRank, academicTitle, degree }
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

const VI_MAP: Record<string, string> = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
  â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(c => VI_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

/** Đảm bảo slug bài viết là duy nhất trong issue bằng cách thêm -pageStart */
function articleSlug(title: string, pageStart: number): string {
  return `${slugify(title)}-tr${pageStart}`
}

// ─── Main import function ─────────────────────────────────────────────────────

export async function importJournalIssue(seed: JournalIssueSeed): Promise<void> {
  const { volume: volumeSeed, issue: issueSeed, sections } = seed

  await prisma.$transaction(async (tx) => {
    // 0. Map họ tên -> userId (khớp duy nhất) để liên kết tác giả với tài khoản
    const userList = await tx.user.findMany({ select: { id: true, fullName: true } })
    const userNameMap = buildUnambiguousMapFromUsers(userList)

    // 1. Upsert Volume
    const volume = await tx.volume.upsert({
      where: { volumeNo: volumeSeed.volumeNo },
      create: {
        volumeNo:          volumeSeed.volumeNo,
        year:              volumeSeed.year,
        title:             volumeSeed.title,
        issn:              volumeSeed.issn,
        publicationPeriod: volumeSeed.publicationPeriod,
      },
      update: {
        issn:              volumeSeed.issn,
        publicationPeriod: volumeSeed.publicationPeriod,
      },
    })

    // 2. Upsert Issue
    const issue = await tx.issue.upsert({
      where: { slug: issueSeed.slug },
      create: {
        volumeId:         volume.id,
        number:           issueSeed.number,
        year:             issueSeed.year,
        title:            issueSeed.title,
        slug:             issueSeed.slug,
        issueCode:        issueSeed.issueCode,
        coverImage:       issueSeed.coverImage,
        pdfUrl:           issueSeed.pdfUrl,
        coverCaption:     issueSeed.coverCaption,
        coverPhotoCredit: issueSeed.coverPhotoCredit,
        pageCount:        issueSeed.pageCount,
        publishDate:      issueSeed.publishDate,
        status:           'PUBLISHED',
      },
      update: {
        title:            issueSeed.title,
        issueCode:        issueSeed.issueCode,
        coverImage:       issueSeed.coverImage,
        pdfUrl:           issueSeed.pdfUrl,
        coverCaption:     issueSeed.coverCaption,
        coverPhotoCredit: issueSeed.coverPhotoCredit,
        pageCount:        issueSeed.pageCount,
      },
    })

    // 3. Upsert IssueSection + JournalArticle + JournalArticleAuthor
    for (const sectionSeed of sections) {
      const sectionSlug = slugify(sectionSeed.name)

      // Upsert bằng unique [issueId, name]
      const section = await tx.issueSection.upsert({
        where: {
          issueId_name: { issueId: issue.id, name: sectionSeed.name },
        },
        create: {
          issueId: issue.id,
          name:    sectionSeed.name,
          slug:    sectionSlug,
          order:   sectionSeed.order,
        },
        update: {
          slug:  sectionSlug,
          order: sectionSeed.order,
        },
      })

      for (const articleSeed of sectionSeed.articles) {
        const slug = articleSlug(articleSeed.title, articleSeed.pageStart)
        const authorsText = articleSeed.authors.join('; ')

        // Upsert bằng unique [issueId, slug]
        const article = await tx.journalArticle.upsert({
          where: {
            issueId_slug: { issueId: issue.id, slug },
          },
          create: {
            issueId:     issue.id,
            sectionId:   section.id,
            title:       articleSeed.title,
            slug,
            authorsText,
            pageStart:   articleSeed.pageStart,
            pageEnd:     articleSeed.pageEnd,
            abstract:    articleSeed.abstract,
            keywords:    articleSeed.keywords ?? [],
            status:      'PUBLISHED',
          },
          update: {
            sectionId:   section.id,
            title:       articleSeed.title,
            authorsText,
            pageStart:   articleSeed.pageStart,
            pageEnd:     articleSeed.pageEnd,
          },
        })

        // Xoá tác giả cũ rồi insert lại để đảm bảo đồng bộ
        await tx.journalArticleAuthor.deleteMany({
          where: { articleId: article.id },
        })

        for (let i = 0; i < articleSeed.authors.length; i++) {
          const raw = articleSeed.authors[i]
          const parsed = parseAuthorString(raw)
          await tx.journalArticleAuthor.create({
            data: {
              articleId:     article.id,
              name:          parsed.name,
              militaryRank:  parsed.militaryRank,
              academicTitle: parsed.academicTitle,
              degree:        parsed.degree,
              order:         i,
              userId:        matchUserId(userNameMap, parsed.name),
            },
          })
        }
      }
    }
    // 4. Upsert JournalCouncilMember
    if (seed.advisoryCouncil?.length) {
      await tx.journalCouncilMember.deleteMany({ where: { issueId: issue.id } })
      for (const member of seed.advisoryCouncil) {
        await tx.journalCouncilMember.create({
          data: {
            issueId:      issue.id,
            order:        member.order,
            role:         member.role,
            fullName:     member.fullName,
            militaryRank: member.militaryRank ?? null,
            academicTitle: member.academicTitle ?? null,
            degree:       member.degree ?? null,
          },
        })
      }
    }
  })

  console.log(`✅ importJournalIssue: issue "${issueSeed.slug}" imported successfully.`)
}
