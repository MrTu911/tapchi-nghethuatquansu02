/**
 * Unit tests — Báo cáo tổng hợp công bố khoa học
 *
 * Bảo vệ các quy tắc nghiệp vụ cốt lõi:
 *  - Suy vai trò từ thứ tự tác giả (order 0 = chủ trì)
 *  - Đếm số liệu tổng hợp theo phân loại tạp chí thực tế
 *  - RBAC: tác giả bị khóa về CHÍNH TÀI KHOẢN của mình (authorUserId)
 *  - Liên kết tác giả → User chỉ khi tên khớp DUY NHẤT
 *
 * Không phụ thuộc Prisma/DB — chỉ test logic thuần.
 */

import {
  deriveRoleFromOrder,
  computeSummary,
  detailHeaders,
  classificationLabel,
  type PublicationReportRow,
} from '../../lib/services/publication-report.types'
import { enforceAuthorScope } from '../../lib/validators/publication-report.validator'
import {
  buildUnambiguousMapFromUsers,
  matchUserId,
} from '../../lib/services/journal-author-linker'

// ─── deriveRoleFromOrder ──────────────────────────────────────────────────────

describe('deriveRoleFromOrder', () => {
  it('order 0 → Chủ trì (tác giả chính)', () => {
    expect(deriveRoleFromOrder(0)).toBe('Chủ trì')
  })
  it('order > 0 → Đồng tác giả', () => {
    expect(deriveRoleFromOrder(1)).toBe('Đồng tác giả')
    expect(deriveRoleFromOrder(5)).toBe('Đồng tác giả')
  })
  it('không xác định được tác giả → —', () => {
    expect(deriveRoleFromOrder(null)).toBe('—')
    expect(deriveRoleFromOrder(undefined)).toBe('—')
  })
})

// ─── computeSummary (đếm theo phân loại thực tế) ───────────────────────────────

function makeRow(
  role: PublicationReportRow['role'],
  classification: string,
): PublicationReportRow {
  return {
    tt: 1, title: 't', journalName: 'j', issueRef: 'r', pages: '1',
    role, journalType: classificationLabel(classification as any),
    classification, sectionName: 's', year: 2025,
  }
}

describe('computeSummary', () => {
  it('đếm đúng quốc tế (SCI/SCIE/Scopus/ESCI), trong nước, hội nghị', () => {
    const rows = [
      makeRow('Chủ trì', 'SCI'),
      makeRow('Đồng tác giả', 'SCOPUS'),
      makeRow('Chủ trì', 'ESCI'),
      makeRow('Chủ trì', 'DOMESTIC_PEER_REVIEWED'),
      makeRow('Đồng tác giả', 'CONFERENCE'),
    ]
    const s = computeSummary(rows)
    expect(s.total).toBe(5)
    expect(s.international).toBe(3) // SCI + SCOPUS + ESCI
    expect(s.domesticPeerReviewed).toBe(1)
    expect(s.conference).toBe(1)
    expect(s.asMainAuthor).toBe(3)
    expect(s.asCoAuthor).toBe(2)
  })

  it('danh sách rỗng → tất cả 0', () => {
    const s = computeSummary([])
    expect(s.total).toBe(0)
    expect(s.international).toBe(0)
    expect(s.conference).toBe(0)
  })
})

// ─── detailHeaders ────────────────────────────────────────────────────────────

describe('detailHeaders', () => {
  it('chế độ cá nhân có cột Vai trò + Loại tạp chí', () => {
    const h = detailHeaders('author')
    expect(h).toContain('Vai trò')
    expect(h).toContain('Loại tạp chí')
  })
  it('chế độ tổng hợp không có cột Vai trò', () => {
    expect(detailHeaders('aggregate')).not.toContain('Vai trò')
  })
})

// ─── enforceAuthorScope (RBAC bằng userId) ─────────────────────────────────────

const baseParsed = {
  mode: 'aggregate' as const,
  role: 'all' as const,
  status: 'PUBLISHED' as any,
  authorName: 'Người Khác',
}

describe('enforceAuthorScope', () => {
  it('tác giả: ép chế độ cá nhân + khóa authorUserId về uid của mình', () => {
    const r = enforceAuthorScope(baseParsed, {
      uid: 'user-1', role: 'AUTHOR', fullName: 'Nguyễn Văn A',
    })
    expect(r.mode).toBe('author')
    expect(r.authorUserId).toBe('user-1')
    expect(r.authorName).toBe('Nguyễn Văn A')
  })

  it('reviewer cũng bị khóa như tác giả', () => {
    const r = enforceAuthorScope(baseParsed, {
      uid: 'u2', role: 'REVIEWER', fullName: 'Trần Thị B',
    })
    expect(r.mode).toBe('author')
    expect(r.authorUserId).toBe('u2')
  })

  it('biên tập (MANAGING_EDITOR): toàn quyền, không bị gán authorUserId', () => {
    const r = enforceAuthorScope(baseParsed, {
      uid: 'editor-1', role: 'MANAGING_EDITOR', fullName: 'BTV',
    })
    expect(r.mode).toBe('aggregate')
    expect(r.authorUserId).toBeUndefined()
    expect(r.authorName).toBe('Người Khác')
  })

  it('EIC và SYSADMIN cũng toàn quyền', () => {
    expect(enforceAuthorScope(baseParsed, { uid: 'x', role: 'EIC', fullName: 'x' }).authorUserId).toBeUndefined()
    expect(enforceAuthorScope(baseParsed, { uid: 'x', role: 'SYSADMIN', fullName: 'x' }).authorUserId).toBeUndefined()
  })
})

// ─── journal-author-linker (chỉ liên kết khi tên DUY NHẤT) ─────────────────────

describe('buildUnambiguousMapFromUsers + matchUserId', () => {
  it('liên kết tên khớp duy nhất', () => {
    const map = buildUnambiguousMapFromUsers([
      { id: 'u1', fullName: 'Đỗ Duy Thắng' },
      { id: 'u2', fullName: 'Trần Việt Khoa' },
    ])
    expect(matchUserId(map, 'Đỗ Duy Thắng')).toBe('u1')
    expect(matchUserId(map, '  trần việt khoa ')).toBe('u2') // chuẩn hóa hoa/thường + trim
  })

  it('KHÔNG liên kết khi nhiều User trùng tên (tránh gán nhầm)', () => {
    const map = buildUnambiguousMapFromUsers([
      { id: 'a', fullName: 'Nguyễn Văn A' },
      { id: 'b', fullName: 'Nguyễn Văn A' },
    ])
    expect(matchUserId(map, 'Nguyễn Văn A')).toBeNull()
  })

  it('tên không tồn tại → null', () => {
    const map = buildUnambiguousMapFromUsers([{ id: 'u1', fullName: 'A' }])
    expect(matchUserId(map, 'Không Có')).toBeNull()
  })
})
