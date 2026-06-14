/**
 * Liên kết bản ghi tác giả bài báo (JournalArticleAuthor) với tài khoản User
 * theo họ tên. Dùng khi import số tạp chí và khi biên tập sửa danh sách tác giả.
 *
 * Nguyên tắc an toàn: CHỈ liên kết khi tên khớp DUY NHẤT một User. Nếu nhiều User
 * trùng tên (đồng danh), để null — tránh gán nhầm danh mục công bố cho sai người.
 */

import { prisma } from '@/lib/prisma'

export function normalizeFullName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Pure: dựng map họ tên (đã chuẩn hóa) -> userId từ danh sách User cho trước,
 * CHỈ gồm tên khớp DUY NHẤT một User (loại bỏ tên trùng bởi nhiều User).
 * Tách pure để test được và để dùng được với cả prisma global lẫn transaction.
 */
export function buildUnambiguousMapFromUsers(
  users: { id: string; fullName: string | null }[]
): Map<string, string> {
  const idsByName = new Map<string, string[]>()
  for (const u of users) {
    if (!u.fullName) continue
    const key = normalizeFullName(u.fullName)
    const list = idsByName.get(key) ?? []
    list.push(u.id)
    idsByName.set(key, list)
  }

  const map = new Map<string, string>()
  for (const [key, ids] of idsByName) {
    if (ids.length === 1) map.set(key, ids[0])
  }
  return map
}

/**
 * Map họ tên (đã chuẩn hóa) -> userId, chỉ gồm những tên khớp DUY NHẤT một User.
 */
export async function buildUnambiguousUserNameMap(): Promise<Map<string, string>> {
  const users = await prisma.user.findMany({ select: { id: true, fullName: true } })
  return buildUnambiguousMapFromUsers(users)
}

/** Trả userId nếu tên khớp duy nhất, ngược lại null. */
export function matchUserId(map: Map<string, string>, name: string): string | null {
  return map.get(normalizeFullName(name)) ?? null
}
