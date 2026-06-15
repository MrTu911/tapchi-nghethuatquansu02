/**
 * Journal Author Account Service
 *
 * Tạo tài khoản User (role AUTHOR) cho các tác giả đã có trong CSDL
 * (JournalArticleAuthor) — phục vụ demo: mỗi tác giả số đã in có một tài khoản
 * đăng nhập được, và danh mục công bố cá nhân khớp đúng người.
 *
 * Nguyên tắc:
 *  - Gộp tác giả theo họ tên đã chuẩn hóa (một tài khoản / một tên).
 *  - Tài khoản tạo ra ĐĂNG NHẬP ĐƯỢC: isActive=true, status=APPROVED, emailVerified=true.
 *  - Mật khẩu chung cho demo (truyền vào), hash bằng bcrypt như phần còn lại của hệ thống.
 *  - Sau khi tạo, liên kết JournalArticleAuthor.userId theo quy tắc khớp DUY NHẤT
 *    (giữ an toàn: tên trùng nhiều User thì để null).
 *  - Idempotent: upsert User theo email (email suy ra ổn định từ tên).
 */

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { slugify } from './journal-issue-import.service'
import {
  buildUnambiguousMapFromUsers,
  matchUserId,
  normalizeFullName,
} from './journal-author-linker'

const AUTHOR_EMAIL_DOMAIN = 'tacgia.ntqs.local'
const DEFAULT_DEMO_PASSWORD = 'Tacgia@2026'

export interface AuthorAccountRecord {
  fullName: string
  email: string
  rank: string | null
  academicTitle: string | null
  academicDegree: string | null
  org: string | null
  articleCount: number
}

export interface CreateAuthorAccountsSummary {
  uniqueAuthors: number
  accountsUpserted: number
  password: string
  authorLinksUpdated: number
  records: AuthorAccountRecord[]
}

interface AuthorProfile {
  displayName: string
  rank: string | null
  academicTitle: string | null
  academicDegree: string | null
  org: string | null
  articleCount: number
}

/**
 * Tạo/cập nhật tài khoản cho tất cả tác giả trong JournalArticleAuthor, rồi liên kết lại.
 */
export async function createDemoAccountsForJournalAuthors(
  password: string = DEFAULT_DEMO_PASSWORD,
): Promise<CreateAuthorAccountsSummary> {
  const profiles = await collectAuthorProfiles()
  const passwordHash = await hashPassword(password)

  // Gán email ổn định, xử lý đụng slug giữa các tên khác nhau bằng hậu tố số.
  const usedEmails = new Set<string>()
  const records: AuthorAccountRecord[] = []

  // Sắp xếp theo tên chuẩn hóa để gán email tất định giữa các lần chạy.
  const sortedKeys = [...profiles.keys()].sort()

  let accountsUpserted = 0
  for (const key of sortedKeys) {
    const profile = profiles.get(key)!
    const email = buildUniqueEmail(profile.displayName, usedEmails)

    await prisma.user.upsert({
      where: { email },
      create: {
        fullName: profile.displayName,
        email,
        role: 'AUTHOR',
        passwordHash,
        isActive: true,
        status: 'APPROVED',
        emailVerified: true,
        approvedAt: new Date(),
        rank: profile.rank,
        academicTitle: profile.academicTitle,
        academicDegree: profile.academicDegree,
        org: profile.org,
        bio: 'Tác giả Tạp chí Nghệ thuật Quân sự Việt Nam',
      },
      update: {
        // Cập nhật hồ sơ + reset mật khẩu demo. KHÔNG đổi role nếu đã được nâng quyền thủ công.
        fullName: profile.displayName,
        passwordHash,
        isActive: true,
        status: 'APPROVED',
        emailVerified: true,
        rank: profile.rank,
        academicTitle: profile.academicTitle,
        academicDegree: profile.academicDegree,
        org: profile.org,
      },
    })
    accountsUpserted++

    records.push({
      fullName: profile.displayName,
      email,
      rank: profile.rank,
      academicTitle: profile.academicTitle,
      academicDegree: profile.academicDegree,
      org: profile.org,
      articleCount: profile.articleCount,
    })
  }

  const authorLinksUpdated = await backfillJournalAuthorUserLinks()

  return {
    uniqueAuthors: profiles.size,
    accountsUpserted,
    password,
    authorLinksUpdated,
    records,
  }
}

/**
 * Liên kết lại JournalArticleAuthor.userId theo quy tắc khớp tên DUY NHẤT.
 * Trả số bản ghi tác giả được gán userId.
 */
export async function backfillJournalAuthorUserLinks(): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true, fullName: true } })
  const nameToUserId = buildUnambiguousMapFromUsers(users)

  const authors = await prisma.journalArticleAuthor.findMany({ select: { id: true, name: true } })

  // Gom id theo userId mục tiêu để cập nhật theo lô (updateMany), giảm số truy vấn.
  const idsByUserId = new Map<string, string[]>()
  for (const author of authors) {
    const userId = matchUserId(nameToUserId, author.name)
    if (!userId) continue
    const list = idsByUserId.get(userId) ?? []
    list.push(author.id)
    idsByUserId.set(userId, list)
  }

  let updated = 0
  for (const [userId, ids] of idsByUserId) {
    const result = await prisma.journalArticleAuthor.updateMany({
      where: { id: { in: ids } },
      data: { userId },
    })
    updated += result.count
  }
  return updated
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Gộp JournalArticleAuthor theo tên chuẩn hóa, chọn hồ sơ "đầy đủ nhất" (nhiều field
 * nhất) làm đại diện và đếm số bài của mỗi tác giả.
 */
async function collectAuthorProfiles(): Promise<Map<string, AuthorProfile>> {
  const authors = await prisma.journalArticleAuthor.findMany({
    select: { name: true, militaryRank: true, academicTitle: true, degree: true, organization: true },
  })

  const profiles = new Map<string, AuthorProfile>()
  for (const author of authors) {
    const name = author.name?.trim()
    if (!name) continue
    const key = normalizeFullName(name)

    const candidate: AuthorProfile = {
      displayName: toTitleCase(name),
      rank: author.militaryRank?.trim() || null,
      academicTitle: author.academicTitle?.trim() || null,
      academicDegree: author.degree?.trim() || null,
      org: author.organization?.trim() || null,
      articleCount: 1,
    }

    const existing = profiles.get(key)
    if (!existing) {
      profiles.set(key, candidate)
      continue
    }

    existing.articleCount++
    // Giữ hồ sơ giàu thông tin hơn (nhiều field không rỗng hơn).
    if (filledFieldCount(candidate) > filledFieldCount(existing)) {
      profiles.set(key, { ...candidate, articleCount: existing.articleCount })
    }
  }
  return profiles
}

function filledFieldCount(p: AuthorProfile): number {
  return [p.rank, p.academicTitle, p.academicDegree, p.org].filter(Boolean).length
}

function buildUniqueEmail(displayName: string, used: Set<string>): string {
  const base = slugify(displayName) || 'tac-gia'
  let candidate = `${base}@${AUTHOR_EMAIL_DOMAIN}`
  let counter = 2
  while (used.has(candidate)) {
    candidate = `${base}-${counter}@${AUTHOR_EMAIL_DOMAIN}`
    counter++
  }
  used.add(candidate)
  return candidate
}

/** Tên trong corpus thường IN HOA → đưa về dạng Tên Riêng để hiển thị đẹp. */
function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
