/**
 * Test bộ chuyển mã TCVN3 → Unicode.
 *
 * Fixture lấy từ dữ liệu THẬT: text mà `pdftotext` trích ra từ PDF số báo cũ (font .Vn
 * TCVN3) ở dạng CP1252, và bản Unicode đúng tương ứng (đối chiếu corpus.json đã kiểm).
 */

import { convertTcvn3, looksLikeTcvn3 } from '@/lib/text-encoding/tcvn3-to-unicode'
import { convertTcvn3Calibrated } from '@/lib/text-encoding/tcvn3-calibrate'

describe('convertTcvn3', () => {
  it('chuyển tiêu đề in hoa (giữ in hoa cả nguyên âm có dấu)', () => {
    // "BIÖN PH¸P N¢NG CAO HIÖU QU¶ C¥ §éNG" → "BIỆN PHÁP NÂNG CAO HIỆU QUẢ CƠ ĐỘNG"
    expect(convertTcvn3('BIÖN PH¸P N¢NG CAO HIÖU QU¶ C¥ §éNG')).toBe('BIỆN PHÁP NÂNG CAO HIỆU QUẢ CƠ ĐỘNG')
  })

  it('chuyển câu văn thường đúng dấu thanh và chữ nền', () => {
    // "TiÕn c«ng ®Þch ®æ bé ®­êng kh«ng ë miÒn §«ng Nam Bé"
    expect(convertTcvn3('TiÕn c«ng ®Þch ®æ bé ®­êng kh«ng ë miÒn §«ng Nam Bé'))
      .toBe('Tiến công địch đổ bộ đường không ở miền Đông Nam Bộ')
  })

  it('phân biệt hoa/thường của chữ nền có dấu phụ (đ/â/ô/ơ/ư/ă/ê)', () => {
    expect(convertTcvn3('§¤NG')).toBe('ĐÔNG')   // hoa
    expect(convertTcvn3('®«ng')).toBe('đông')   // thường
    expect(convertTcvn3('S¦ ®oµn')).toBe('SƯ đoàn')
  })

  it('giữ nguyên ASCII và không đụng văn bản đã Unicode', () => {
    expect(convertTcvn3('Hello 123 KHQS/2026')).toBe('Hello 123 KHQS/2026')
    expect(convertTcvn3('Đảng và Nhà nước')).toBe('Đảng và Nhà nước')
  })

  it('chuỗi rỗng trả rỗng', () => {
    expect(convertTcvn3('')).toBe('')
  })
})

describe('convertTcvn3Calibrated (hiệu chỉnh subset theo từ điển)', () => {
  // Byte 0xED (í) mặc định → 'ỡ', nhưng ở subset này phải là 'ớ'. Fixture nhiều từ chứa 0xED.
  const B_uhorn = String.fromCharCode(0xad) // ­ = ư
  const B_osac = String.fromCharCode(0xed) // í = byte mơ hồ (ỡ mặc định / ớ thực)
  const raw = `t${B_osac}i m${B_osac}i v${B_osac}i h${B_uhorn}${B_osac}ng`

  it('bảng gốc convert SAI dấu thanh (ỡ) ở subset lạ', () => {
    expect(convertTcvn3(raw)).toContain('ỡ') // tỡi/mỡi/vỡi/hưỡng — sai
  })

  it('hiệu chỉnh theo từ điển sửa về đúng (ớ): tới/mới/với/hướng', () => {
    const out = convertTcvn3Calibrated(raw)
    expect(out).toContain('tới')
    expect(out).toContain('mới')
    expect(out).toContain('với')
    expect(out).toContain('hướng')
    expect(out).not.toContain('ỡ')
  })
})

describe('looksLikeTcvn3', () => {
  it('nhận diện text TCVN3 (mật độ byte CP1252 cao)', () => {
    expect(looksLikeTcvn3(
      'qu¸n triÖt c¸c nghÞ quyÕt cña ®¶ng häc tËp vµ lµm theo t­ t­ëng, ®¹o ®øc, phong c¸ch hå chÝ minh trong toµn qu©n vµ x©y dùng qu©n ®éi',
    )).toBe(true)
  })

  it('KHÔNG nhận nhầm text Unicode tiếng Việt là TCVN3', () => {
    expect(looksLikeTcvn3('Quán triệt các nghị quyết của Đảng, học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh trong toàn quân')).toBe(false)
  })

  it('text quá ngắn → false', () => {
    expect(looksLikeTcvn3('a¸b')).toBe(false)
  })
})
