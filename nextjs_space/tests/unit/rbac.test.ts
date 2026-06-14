/**
 * Unit tests — lib/rbac.ts
 *
 * Kiểm tra quyền truy cập theo vai trò (RBAC):
 * - roleHierarchy đúng thứ tự
 * - can.* functions đúng cho từng vai trò
 * - hasRole, hasMinimumRole
 * - accessDashboard routing
 *
 * QUAN TRỌNG: Các test này bảo vệ khỏi regression khi sửa RBAC.
 * Nếu test này fail sau khi thay đổi rbac.ts → phải review kỹ.
 */

import {
  roleHierarchy,
  can,
  hasRole,
  hasMinimumRole,
  checkPermission,
  type Role,
} from '../../lib/rbac'

// ─── roleHierarchy ────────────────────────────────────────────────────────────

describe('roleHierarchy', () => {
  it('SYSADMIN có level cao nhất (9)', () => {
    expect(roleHierarchy['SYSADMIN']).toBe(9)
  })

  it('COMMANDER xếp dưới SYSADMIN (8)', () => {
    expect(roleHierarchy['COMMANDER']).toBe(8)
    expect(roleHierarchy['SYSADMIN']).toBeGreaterThan(roleHierarchy['COMMANDER'])
  })

  it('EIC cao hơn DEPUTY_EIC, DEPUTY_EIC cao hơn MANAGING_EDITOR', () => {
    expect(roleHierarchy['EIC']).toBeGreaterThan(roleHierarchy['DEPUTY_EIC'])
    expect(roleHierarchy['DEPUTY_EIC']).toBeGreaterThan(roleHierarchy['MANAGING_EDITOR'])
  })

  it('EIC cao hơn MANAGING_EDITOR', () => {
    expect(roleHierarchy['EIC']).toBeGreaterThan(roleHierarchy['MANAGING_EDITOR'])
  })

  it('MANAGING_EDITOR cao hơn SECTION_EDITOR', () => {
    expect(roleHierarchy['MANAGING_EDITOR']).toBeGreaterThan(roleHierarchy['SECTION_EDITOR'])
  })

  it('SECTION_EDITOR cao hơn REVIEWER', () => {
    expect(roleHierarchy['SECTION_EDITOR']).toBeGreaterThan(roleHierarchy['REVIEWER'])
  })

  it('REVIEWER cao hơn AUTHOR', () => {
    expect(roleHierarchy['REVIEWER']).toBeGreaterThan(roleHierarchy['AUTHOR'])
  })

  it('AUTHOR cao hơn READER', () => {
    expect(roleHierarchy['AUTHOR']).toBeGreaterThan(roleHierarchy['READER'])
  })

  it('READER có level thấp nhất (1)', () => {
    expect(roleHierarchy['READER']).toBe(1)
  })
})

// ─── can.submit ───────────────────────────────────────────────────────────────

describe('can.submit (nộp bài)', () => {
  it('AUTHOR được nộp bài', () => {
    expect(can.submit('AUTHOR')).toBe(true)
  })
  it('REVIEWER được nộp bài (hierarchy >= AUTHOR)', () => {
    expect(can.submit('REVIEWER')).toBe(true)
  })
  it('SECTION_EDITOR được nộp bài', () => {
    expect(can.submit('SECTION_EDITOR')).toBe(true)
  })
  it('EIC được nộp bài', () => {
    expect(can.submit('EIC')).toBe(true)
  })
  it('SYSADMIN được nộp bài', () => {
    expect(can.submit('SYSADMIN')).toBe(true)
  })
  it('READER KHÔNG được nộp bài', () => {
    expect(can.submit('READER')).toBe(false)
  })
  it('undefined KHÔNG được nộp bài', () => {
    expect(can.submit(undefined)).toBe(false)
  })
})

// ─── can.review ───────────────────────────────────────────────────────────────

describe('can.review (phản biện)', () => {
  it('REVIEWER được phản biện', () => {
    expect(can.review('REVIEWER')).toBe(true)
  })
  it('SECTION_EDITOR được phản biện', () => {
    expect(can.review('SECTION_EDITOR')).toBe(true)
  })
  it('EIC được phản biện', () => {
    expect(can.review('EIC')).toBe(true)
  })
  it('AUTHOR KHÔNG được phản biện', () => {
    expect(can.review('AUTHOR')).toBe(false)
  })
  it('READER KHÔNG được phản biện', () => {
    expect(can.review('READER')).toBe(false)
  })
})

// ─── can.decide ───────────────────────────────────────────────────────────────

describe('can.decide (quyết định biên tập)', () => {
  it('SECTION_EDITOR có thể quyết định', () => {
    expect(can.decide('SECTION_EDITOR')).toBe(true)
  })
  it('MANAGING_EDITOR có thể quyết định', () => {
    expect(can.decide('MANAGING_EDITOR')).toBe(true)
  })
  it('EIC có thể quyết định', () => {
    expect(can.decide('EIC')).toBe(true)
  })
  it('SYSADMIN có thể quyết định', () => {
    expect(can.decide('SYSADMIN')).toBe(true)
  })
  it('REVIEWER KHÔNG thể quyết định', () => {
    expect(can.decide('REVIEWER')).toBe(false)
  })
  it('AUTHOR KHÔNG thể quyết định', () => {
    expect(can.decide('AUTHOR')).toBe(false)
  })
  it('LAYOUT_EDITOR KHÔNG thể quyết định biên tập', () => {
    expect(can.decide('LAYOUT_EDITOR')).toBe(false)
  })
})

// ─── can.publish ──────────────────────────────────────────────────────────────

describe('can.publish (xuất bản)', () => {
  it('EIC được xuất bản', () => {
    expect(can.publish('EIC')).toBe(true)
  })
  it('SYSADMIN được xuất bản', () => {
    expect(can.publish('SYSADMIN')).toBe(true)
  })
  it('MANAGING_EDITOR KHÔNG được xuất bản', () => {
    expect(can.publish('MANAGING_EDITOR')).toBe(false)
  })
  it('SECTION_EDITOR KHÔNG được xuất bản', () => {
    expect(can.publish('SECTION_EDITOR')).toBe(false)
  })
  it('REVIEWER KHÔNG được xuất bản', () => {
    expect(can.publish('REVIEWER')).toBe(false)
  })
})

// ─── can.assignReview ─────────────────────────────────────────────────────────

describe('can.assignReview (gán phản biện)', () => {
  it('SECTION_EDITOR được gán phản biện', () => {
    expect(can.assignReview('SECTION_EDITOR')).toBe(true)
  })
  it('MANAGING_EDITOR được gán phản biện', () => {
    expect(can.assignReview('MANAGING_EDITOR')).toBe(true)
  })
  it('EIC được gán phản biện', () => {
    expect(can.assignReview('EIC')).toBe(true)
  })
  it('REVIEWER KHÔNG được gán phản biện', () => {
    expect(can.assignReview('REVIEWER')).toBe(false)
  })
  it('AUTHOR KHÔNG được gán phản biện', () => {
    expect(can.assignReview('AUTHOR')).toBe(false)
  })
  it('LAYOUT_EDITOR KHÔNG được gán phản biện', () => {
    expect(can.assignReview('LAYOUT_EDITOR')).toBe(false)
  })
})

// ─── can.admin ────────────────────────────────────────────────────────────────

describe('can.admin (quản trị)', () => {
  it('SYSADMIN có quyền admin', () => {
    expect(can.admin('SYSADMIN')).toBe(true)
  })
  it('EIC có quyền admin', () => {
    expect(can.admin('EIC')).toBe(true)
  })
  it('MANAGING_EDITOR có quyền admin', () => {
    expect(can.admin('MANAGING_EDITOR')).toBe(true)
  })
  it('SECTION_EDITOR KHÔNG có quyền admin', () => {
    expect(can.admin('SECTION_EDITOR')).toBe(false)
  })
  it('REVIEWER KHÔNG có quyền admin', () => {
    expect(can.admin('REVIEWER')).toBe(false)
  })
})

// ─── can.securityAudit ────────────────────────────────────────────────────────

describe('can.securityAudit', () => {
  it('SECURITY_AUDITOR được audit', () => {
    expect(can.securityAudit('SECURITY_AUDITOR')).toBe(true)
  })
  it('EIC được audit', () => {
    expect(can.securityAudit('EIC')).toBe(true)
  })
  it('SYSADMIN được audit', () => {
    expect(can.securityAudit('SYSADMIN')).toBe(true)
  })
  it('MANAGING_EDITOR KHÔNG được audit', () => {
    expect(can.securityAudit('MANAGING_EDITOR')).toBe(false)
  })
  it('AUTHOR KHÔNG được audit', () => {
    expect(can.securityAudit('AUTHOR')).toBe(false)
  })
})

// ─── DEPUTY_EIC (Phó Tổng biên tập) ─────────────────────────────────────────
// Nghiệp vụ: Phó TBT giám sát toàn bộ + quyết định + gán phản biện + quản trị
// nội dung NGANG Tổng biên tập, NHƯNG KHÔNG có quyền ký xuất bản cuối.

describe('DEPUTY_EIC — Phó Tổng biên tập', () => {
  it('được ra quyết định biên tập', () => {
    expect(can.decide('DEPUTY_EIC')).toBe(true)
  })
  it('được gán phản biện', () => {
    expect(can.assignReview('DEPUTY_EIC')).toBe(true)
  })
  it('được dàn trang/đẩy sản xuất', () => {
    expect(can.layout('DEPUTY_EIC')).toBe(true)
  })
  it('có quyền quản trị nội dung', () => {
    expect(can.admin('DEPUTY_EIC')).toBe(true)
  })
  it('được phản biện (hierarchy >= REVIEWER)', () => {
    expect(can.review('DEPUTY_EIC')).toBe(true)
  })
  it('KHÔNG được xuất bản (ký cuối thuộc EIC)', () => {
    expect(can.publish('DEPUTY_EIC')).toBe(false)
  })
  it('truy cập được dashboard deputy và eic (giám sát)', () => {
    expect(can.accessDashboard('DEPUTY_EIC', 'deputy')).toBe(true)
    expect(can.accessDashboard('DEPUTY_EIC', 'eic')).toBe(true)
    expect(can.accessDashboard('DEPUTY_EIC', 'managing')).toBe(true)
  })
  it('đạt minimum MANAGING_EDITOR nhưng KHÔNG đạt minimum EIC', () => {
    expect(hasMinimumRole('DEPUTY_EIC', 'MANAGING_EDITOR')).toBe(true)
    expect(hasMinimumRole('DEPUTY_EIC', 'EIC')).toBe(false)
  })
})

// ─── can.accessDashboard ─────────────────────────────────────────────────────

describe('can.accessDashboard', () => {
  it('AUTHOR truy cập được dashboard author', () => {
    expect(can.accessDashboard('AUTHOR', 'author')).toBe(true)
  })
  it('READER KHÔNG truy cập được dashboard author', () => {
    expect(can.accessDashboard('READER', 'author')).toBe(false)
  })
  it('REVIEWER truy cập được dashboard reviewer', () => {
    expect(can.accessDashboard('REVIEWER', 'reviewer')).toBe(true)
  })
  it('AUTHOR KHÔNG truy cập được dashboard reviewer', () => {
    expect(can.accessDashboard('AUTHOR', 'reviewer')).toBe(false)
  })
  it('SECTION_EDITOR truy cập được dashboard editor', () => {
    expect(can.accessDashboard('SECTION_EDITOR', 'editor')).toBe(true)
  })
  it('EIC truy cập được dashboard eic', () => {
    expect(can.accessDashboard('EIC', 'eic')).toBe(true)
  })
  it('SYSADMIN truy cập được dashboard eic (đặc quyền)', () => {
    expect(can.accessDashboard('SYSADMIN', 'eic')).toBe(true)
  })
  it('SECTION_EDITOR KHÔNG truy cập được dashboard eic', () => {
    expect(can.accessDashboard('SECTION_EDITOR', 'eic')).toBe(false)
  })
  it('trả false khi không có role', () => {
    expect(can.accessDashboard(undefined, 'editor')).toBe(false)
  })
  it('trả false khi targetRole không hợp lệ', () => {
    expect(can.accessDashboard('SYSADMIN', 'nonexistent')).toBe(false)
  })
})

// ─── hasRole ─────────────────────────────────────────────────────────────────

describe('hasRole', () => {
  it('trả true khi role nằm trong danh sách', () => {
    expect(hasRole('AUTHOR', ['AUTHOR', 'REVIEWER'])).toBe(true)
  })
  it('trả false khi role không nằm trong danh sách', () => {
    expect(hasRole('READER', ['AUTHOR', 'REVIEWER'])).toBe(false)
  })
  it('trả false khi role undefined', () => {
    expect(hasRole(undefined, ['AUTHOR'])).toBe(false)
  })
  it('trả false khi danh sách rỗng', () => {
    expect(hasRole('SYSADMIN', [])).toBe(false)
  })
})

// ─── hasMinimumRole ───────────────────────────────────────────────────────────

describe('hasMinimumRole', () => {
  it('EIC đạt minimum MANAGING_EDITOR', () => {
    expect(hasMinimumRole('EIC', 'MANAGING_EDITOR')).toBe(true)
  })
  it('MANAGING_EDITOR đạt minimum SECTION_EDITOR', () => {
    expect(hasMinimumRole('MANAGING_EDITOR', 'SECTION_EDITOR')).toBe(true)
  })
  it('AUTHOR KHÔNG đạt minimum REVIEWER', () => {
    expect(hasMinimumRole('AUTHOR', 'REVIEWER')).toBe(false)
  })
  it('READER KHÔNG đạt minimum bất kỳ role nào trên', () => {
    expect(hasMinimumRole('READER', 'AUTHOR')).toBe(false)
  })
  it('SYSADMIN đạt minimum mọi role', () => {
    const roles: Role[] = ['READER', 'AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'EIC', 'MANAGING_EDITOR']
    roles.forEach(role => {
      expect(hasMinimumRole('SYSADMIN', role)).toBe(true)
    })
  })
  it('trả false khi undefined', () => {
    expect(hasMinimumRole(undefined, 'AUTHOR')).toBe(false)
  })
})

// ─── checkPermission ─────────────────────────────────────────────────────────

describe('checkPermission', () => {
  it('delegate đúng sang can.publish', () => {
    expect(checkPermission('EIC', 'publish')).toBe(true)
    expect(checkPermission('AUTHOR', 'publish')).toBe(false)
  })
  it('trả false khi thiếu tham số', () => {
    expect(checkPermission(undefined, 'publish')).toBe(false)
    expect(checkPermission('EIC', undefined)).toBe(false)
  })
})
