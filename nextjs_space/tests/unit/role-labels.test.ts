/**
 * Unit tests — lib/role-labels.ts (SSOT nhãn vai trò)
 *
 * Bảo vệ tính nhất quán nhãn vai trò sau khi gộp về một nguồn duy nhất.
 * Đặc biệt: DEPUTY_EIC phải có nhãn rõ ràng, EIC phải nhất quán "Tổng biên tập".
 */

import { getRoleLabelVi, getRoleLabelShort, getRoleLabelByLang, ROLE_LABELS } from '../../lib/role-labels'

describe('role-labels SSOT', () => {
  it('DEPUTY_EIC = "Phó Tổng biên tập"', () => {
    expect(getRoleLabelVi('DEPUTY_EIC')).toBe('Phó Tổng biên tập')
    expect(getRoleLabelShort('DEPUTY_EIC')).toBe('Phó TBT')
    expect(getRoleLabelByLang('DEPUTY_EIC', 'en')).toBe('Deputy Editor-in-Chief')
  })

  it('EIC nhất quán "Tổng biên tập" (không còn "Tổng Chủ biên"/"Tổng biên tập trưởng")', () => {
    expect(getRoleLabelVi('EIC')).toBe('Tổng biên tập')
  })

  it('MANAGING_EDITOR = "Thư ký tòa soạn"', () => {
    expect(getRoleLabelVi('MANAGING_EDITOR')).toBe('Thư ký tòa soạn')
  })

  it('fallback về chính role khi không khớp', () => {
    expect(getRoleLabelVi('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE')
  })

  it('trả chuỗi rỗng khi role null/undefined', () => {
    expect(getRoleLabelVi(null)).toBe('')
    expect(getRoleLabelVi(undefined)).toBe('')
  })

  it('có đủ nhãn cho toàn bộ 11 vai trò', () => {
    expect(Object.keys(ROLE_LABELS)).toHaveLength(11)
    expect(ROLE_LABELS.DEPUTY_EIC).toBeDefined()
  })
})
