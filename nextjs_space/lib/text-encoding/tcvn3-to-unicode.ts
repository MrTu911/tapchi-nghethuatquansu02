/**
 * tcvn3-to-unicode.ts
 *
 * Chuyển văn bản font cũ TCVN3 (ABC / .VnTime, .VnArial…) sang Unicode.
 *
 * Bối cảnh: các số báo in cũ nhúng font TCVN3 subset (encoding "Custom", KHÔNG có
 * ToUnicode). `pdf-parse` (JS) giải mã hỏng, nhưng `pdftotext` (poppler) trích ra
 * đúng byte TCVN3 dưới dạng CP1252/Latin-1 (vd: "BIÖN PH¸P" = "BIỆN PHÁP"). Module này
 * ánh xạ từng byte đó về ký tự Việt Unicode → không cần OCR cho các bản có lớp text.
 *
 * Bảng mã được XÁC MINH THỰC NGHIỆM: căn chỉnh output pdftotext với corpus.json sạch
 * (do bộ trích ngoài sinh) trên 500+ bài số cũ; xem scripts/journal/probe-encoding.ts
 * để hiệu chỉnh lại nếu gặp biến thể font khác.
 *
 * GIỚI HẠN QUAN TRỌNG: font .Vn được subset khác nhau giữa các bài → một số byte (vd 0xF9)
 * có thể ứng với glyph khác nhau ở subset khác nhau. Bảng này khớp subset PHỔ BIẾN (đúng gần
 * như tuyệt đối với đa số bài); số ít bài dùng subset lạ sẽ có vài lỗi dấu thanh → BƯỚC BIÊN
 * TẬP THỦ CÔNG trước xuất bản (Phần review) và OCR dự phòng là lưới đỡ. KHÔNG coi đây là
 * bản dịch hoàn hảo tuyệt đối cho mọi PDF.
 *
 * Giới hạn: TCVN3 dùng byte khác nhau cho glyph hoa (.VnH) và thường (.Vn) ở phụ âm/nguyên
 * âm nền, nhưng CHUNG byte cho phần dấu thanh; pdftotext cho ra byte thường. Ta ánh xạ về
 * chữ THƯỜNG rồi chuẩn hoá hoa theo ngữ cảnh chữ cái ASCII trong cùng từ (đủ tốt cho đọc
 * + đối chiếu đạo văn, vốn bỏ hoa/dấu khi so).
 */

// CP1252 codepoint (byte) -> ký tự Việt Unicode THƯỜNG (NFC). Xác minh từ dữ liệu thật.
export const TCVN3_MAP: Record<number, string> = {
  // Dấu nháy cong (không phải chữ).
  0x93: '“', 0x94: '”',

  // Phụ âm/nguyên âm nền có dấu phụ (đ/mũ/móc/trăng) MANG THÔNG TIN HOA-THƯỜNG:
  //   0xA1..0xA7 = biến thể HOA (.VnH), 0xA8..0xAE = biến thể thường (.Vn). Giữ đúng hoa/thường.
  0xa1: 'Ă', 0xa2: 'Â', 0xa3: 'Ê', 0xa4: 'Ô', 0xa5: 'Ơ', 0xa6: 'Ư', 0xa7: 'Đ',
  0xa8: 'ă', 0xa9: 'â', 0xaa: 'ê', 0xab: 'ô', 0xac: 'ơ', 0xad: 'ư', 0xae: 'đ',
  0xd0: 'Đ',

  // a: à á ả ã ạ
  0xb5: 'à', 0xb8: 'á', 0xb6: 'ả', 0xb7: 'ã', 0xb9: 'ạ',
  // ă: ằ ắ ẳ ẵ ặ
  0xbb: 'ằ', 0xbe: 'ắ', 0xbc: 'ẳ', 0xbd: 'ẵ', 0xc6: 'ặ',
  // â: ầ ấ ẩ ẫ ậ
  0xc7: 'ầ', 0xca: 'ấ', 0xc8: 'ẩ', 0xc9: 'ẫ', 0xcb: 'ậ',
  // e: è é ẻ ẽ ẹ
  0xcc: 'è', 0xcd: 'é', 0xce: 'ẻ', 0xcf: 'ẽ', 0xd1: 'ẹ',
  // ê: ề ể ễ ế ệ  (liền mạch 0xD2..0xD6 — đã xác minh)
  0xd2: 'ề', 0xd3: 'ể', 0xd4: 'ễ', 0xd5: 'ế', 0xd6: 'ệ',
  // i: ì í ỉ ĩ ị
  0xd7: 'ì', 0xdd: 'í', 0xd8: 'ỉ', 0xdc: 'ĩ', 0xde: 'ị',
  // o: ò ó ỏ õ ọ
  0xdf: 'ò', 0xe3: 'ó', 0xe1: 'ỏ', 0xe2: 'õ', 0xe4: 'ọ',
  // ô: ồ ố ổ ỗ ộ
  0xe5: 'ồ', 0xe8: 'ố', 0xe6: 'ổ', 0xe7: 'ỗ', 0xe9: 'ộ',
  // ơ: ờ ớ ở ỡ ợ
  0xea: 'ờ', 0xec: 'ớ', 0xeb: 'ở', 0xed: 'ỡ', 0xee: 'ợ',
  // u: ù ú ủ ũ ụ
  0xf2: 'ù', 0xf3: 'ú', 0xf1: 'ủ', 0xf6: 'ũ', 0xf4: 'ụ',
  // ư: ừ ứ ử ữ ự
  0xf5: 'ừ', 0xf8: 'ứ', 0xf0: 'ử', 0xf7: 'ữ', 0xf9: 'ự',
  // y: ỳ ý ỷ ỹ ỵ
  0xfa: 'ỳ', 0xfd: 'ý', 0xfb: 'ỷ', 0xfc: 'ỹ', 0xef: 'ỵ',
}

/**
 * Có phải văn bản trích ra là TCVN3 (không phải Unicode)?
 * Dấu hiệu: mật độ byte CP1252 vùng 0x80–0xBF (các dấu ¸ ¢ Ö § ª « ¬ ­ ®…) cao — Unicode
 * tiếng Việt gần như không dùng vùng này. Ngưỡng 0.02 tách sạch (Unicode ~0.000 vs TCVN3 ~0.11).
 */
export function looksLikeTcvn3(raw: string): boolean {
  const sample = raw.slice(0, 8000)
  const nonSpace = sample.replace(/\s/g, '').length
  if (nonSpace < 60) return false
  let hi = 0
  for (const ch of sample) {
    const c = ch.codePointAt(0)!
    if (c >= 0x80 && c <= 0xbf) hi++
  }
  return hi / nonSpace > 0.02
}

// Chữ cái MANG THÔNG TIN HOA-THƯỜNG tin cậy (ASCII + nền có dấu phụ). Nguyên âm có dấu
// thanh (à á ệ ộ…) dùng chung byte cho hoa/thường nên KHÔNG tính vào đây.
const CASE_CARRYING = /[A-Za-zĂÂÊÔƠƯĐăâêôơưđ]/
function isUpperLetter(c: string): boolean {
  return c === c.toUpperCase() && c !== c.toLowerCase()
}

/**
 * Từ là chữ IN HOA toàn bộ (tiêu đề) → cần in hoa cả nguyên âm có dấu thanh (vốn để mặc
 * định chữ thường). Điều kiện: ≥2 chữ cái mang-case đều in hoa và không có chữ thường nào.
 * (Dùng ≥2 để "Bộ", "Đổ" ở kiểu Title không bị hoá "BỘ".)
 */
function isAllCapsWord(word: string): boolean {
  let up = 0, lo = 0
  for (const c of word) {
    if (!CASE_CARRYING.test(c)) continue
    if (isUpperLetter(c)) up++
    else lo++
  }
  return up >= 2 && lo === 0
}

/**
 * Chuyển chuỗi TCVN3 (CP1252) → Unicode.
 * ASCII giữ nguyên; byte TCVN3 map theo bảng (nền có dấu giữ hoa/thường); sau đó in hoa
 * nguyên âm dấu thanh trong từ toàn-hoa; chuẩn hoá NFC.
 *
 * @param overrides Ghi đè bảng mã cho một số byte (dùng khi HIỆU CHỈNH per-bài — font .Vn
 *   subset khác nhau làm một byte đổi nghĩa; xem tcvn3-calibrate.ts).
 */
export function convertTcvn3(raw: string, overrides?: Record<number, string>): string {
  if (!raw) return raw
  let out = ''
  for (const ch of raw) {
    const cp = ch.codePointAt(0)!
    out += overrides?.[cp] ?? TCVN3_MAP[cp] ?? ch
  }
  out = out.replace(/\S+/g, (word) => (isAllCapsWord(word) ? word.toUpperCase() : word))
  return out.normalize('NFC')
}
