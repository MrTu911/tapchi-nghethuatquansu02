/**
 * Test tiện ích diff dùng cho panel so sánh phiên bản trang public.
 */
import { stripHtml, diffWords, summarizeDiff } from '../../lib/text-diff'

describe('stripHtml', () => {
  it('bỏ thẻ và gom khoảng trắng', () => {
    expect(stripHtml('<p>Xin  <b>chào</b></p>')).toBe('Xin chào')
  })
  it('giải mã entity phổ biến', () => {
    expect(stripHtml('A &amp; B &nbsp;C')).toBe('A & B C')
  })
})

describe('diffWords', () => {
  it('không thay đổi → toàn segment eq', () => {
    const segs = diffWords('một hai ba', 'một hai ba')
    expect(segs.every((s) => s.type === 'eq')).toBe(true)
  })

  it('phát hiện từ thêm vào', () => {
    const segs = diffWords('một hai', 'một hai ba')
    expect(segs.some((s) => s.type === 'add' && s.value.includes('ba'))).toBe(true)
    expect(segs.some((s) => s.type === 'del')).toBe(false)
  })

  it('phát hiện từ bị xoá', () => {
    const segs = diffWords('một hai ba', 'một ba')
    expect(segs.some((s) => s.type === 'del' && s.value.includes('hai'))).toBe(true)
  })

  it('summarizeDiff đếm đúng số từ thêm/xoá', () => {
    const segs = diffWords('alpha beta', 'alpha gamma delta')
    const { added, removed } = summarizeDiff(segs)
    expect(added).toBe(2) // gamma delta
    expect(removed).toBe(1) // beta
  })
})
