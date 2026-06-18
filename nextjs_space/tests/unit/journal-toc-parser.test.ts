/**
 * Unit test cho bóc tách MỤC LỤC số báo (lib/services/journal-toc-parser.service.ts).
 * Chỉ test hàm THUẦN parseTocText (không IO/PDF). Bảo vệ: nhận diện chuyên mục, gộp tên
 * bài xuống dòng, tách tác giả theo quân hàm/học vị, lấy số trang, cờ confidence.
 */

import { parseTocText } from '@/lib/services/journal-toc-parser.service'

const TOC = [
  'TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM',
  'Số 5 - 05/2026',
  'MỤC LỤC',
  'CHIẾN LƯỢC QUÂN SỰ',
  'Phát triển nghệ thuật chiến dịch trong chiến tranh bảo vệ Tổ quốc',
  'Đại tá, TS Nguyễn Văn A     5',
  'Tư duy mới về phòng thủ quân khu ............... Thượng tá ThS Trần Văn B     12',
  'NGHỆ THUẬT TÁC CHIẾN',
  'Vận dụng cách đánh sở trường của lực lượng đặc công',
  'trong tác chiến hiệp đồng quân binh chủng',
  'Trung tá Lê Văn C     20',
  'Tin hoạt động của Học viện     45',
].join('\n')

describe('parseTocText', () => {
  const articles = parseTocText(TOC)

  it('bỏ phần măng sét trước MỤC LỤC, nhận đúng số bài', () => {
    expect(articles).toHaveLength(4)
    // Không tạo bài rỗng từ dòng "Số 5 - 05/2026" (nằm trước MỤC LỤC)
    expect(articles.some((a) => a.title.includes('05/2026'))).toBe(false)
  })

  it('gán chuyên mục theo header đứng trước', () => {
    expect(articles[0].section).toBe('CHIẾN LƯỢC QUÂN SỰ')
    expect(articles[1].section).toBe('CHIẾN LƯỢC QUÂN SỰ')
    expect(articles[2].section).toBe('NGHỆ THUẬT TÁC CHIẾN')
  })

  it('tách tác giả (tên bài + trang trên 2 dòng)', () => {
    expect(articles[0].title).toBe('Phát triển nghệ thuật chiến dịch trong chiến tranh bảo vệ Tổ quốc')
    expect(articles[0].authorsText).toContain('Nguyễn Văn A')
    expect(articles[0].authorsText.startsWith('Đại tá')).toBe(true)
    expect(articles[0].pageStart).toBe(5)
    expect(articles[0].confidence).toBe('high')
  })

  it('xử lý dấu chấm dẫn và tách tác giả trên cùng dòng', () => {
    expect(articles[1].title).toBe('Tư duy mới về phòng thủ quân khu')
    expect(articles[1].authorsText).toContain('Trần Văn B')
    expect(articles[1].pageStart).toBe(12)
  })

  it('gộp tên bài bị xuống dòng thành một bài', () => {
    expect(articles[2].title).toBe(
      'Vận dụng cách đánh sở trường của lực lượng đặc công trong tác chiến hiệp đồng quân binh chủng',
    )
    expect(articles[2].authorsText).toContain('Lê Văn C')
    expect(articles[2].pageStart).toBe(20)
  })

  it('đánh dấu confidence thấp khi thiếu tác giả', () => {
    const noAuthor = articles[3]
    expect(noAuthor.title).toBe('Tin hoạt động của Học viện')
    expect(noAuthor.authorsText).toBe('')
    expect(noAuthor.pageStart).toBe(45)
    expect(noAuthor.confidence).toBe('low')
  })

  it('trả mảng rỗng với text không có entry hợp lệ', () => {
    expect(parseTocText('Trang bìa\nLời nói đầu\n')).toHaveLength(0)
  })
})
