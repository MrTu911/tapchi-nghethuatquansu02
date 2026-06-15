/**
 * Regression test cho lib/youtube — bug: link youtu.be/ID?si=... khiến videoId
 * dính ?si=... làm hỏng URL ảnh đại diện.
 */

import {
  extractYouTubeId,
  cleanYouTubeId,
  resolveYouTubeId,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
} from '@/lib/youtube'

describe('lib/youtube', () => {
  it('extractYouTubeId cắt ?si=... của link youtu.be', () => {
    expect(extractYouTubeId('https://youtu.be/rzdu31D_uKQ?si=r-Wm92sg6y_3Bh36')).toBe('rzdu31D_uKQ')
  })

  it('extractYouTubeId xử lý watch?v= kèm tham số', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=pi4ykZ_qBQ4&t=30s')).toBe('pi4ykZ_qBQ4')
  })

  it('extractYouTubeId xử lý embed/ và shorts/', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/abc123XYZ_0')).toBe('abc123XYZ_0')
    expect(extractYouTubeId('https://www.youtube.com/shorts/abc123XYZ_0')).toBe('abc123XYZ_0')
  })

  it('cleanYouTubeId loại bỏ phần dính sau ?/&//', () => {
    expect(cleanYouTubeId('rzdu31D_uKQ?si=abc')).toBe('rzdu31D_uKQ')
    expect(cleanYouTubeId('rzdu31D_uKQ')).toBe('rzdu31D_uKQ')
    expect(cleanYouTubeId(null)).toBe('')
  })

  it('resolveYouTubeId ưu tiên videoId (đã làm sạch), fallback URL', () => {
    expect(resolveYouTubeId('https://youtu.be/xxx', 'rzdu31D_uKQ?si=abc')).toBe('rzdu31D_uKQ')
    expect(resolveYouTubeId('https://youtu.be/rzdu31D_uKQ?si=abc', null)).toBe('rzdu31D_uKQ')
  })

  it('getYouTubeThumbnail dựng URL hqdefault sạch (không dính ?si=)', () => {
    expect(getYouTubeThumbnail('https://youtu.be/rzdu31D_uKQ?si=abc', 'rzdu31D_uKQ?si=abc')).toBe(
      'https://img.youtube.com/vi/rzdu31D_uKQ/hqdefault.jpg'
    )
  })

  it('getYouTubeEmbedUrl sạch + tùy chọn autoplay', () => {
    expect(getYouTubeEmbedUrl('https://youtu.be/rzdu31D_uKQ?si=abc')).toBe(
      'https://www.youtube.com/embed/rzdu31D_uKQ'
    )
    expect(getYouTubeEmbedUrl('', 'rzdu31D_uKQ?si=abc', true)).toBe(
      'https://www.youtube.com/embed/rzdu31D_uKQ?autoplay=1'
    )
  })
})
