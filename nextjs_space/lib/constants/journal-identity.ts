/**
 * Nhận dạng chính thức của Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS).
 *
 * Nguồn sự thật: .claude/rules/journal-identity.md
 * Dùng chung cho các builder báo cáo (DOCX / XLSX / PDF) để:
 *  - tránh phụ thuộc DB bất đồng bộ khi đang dựng tài liệu,
 *  - chống rò branding của codebase nguồn (xem rule journal-identity.md).
 *
 * Mọi giá trị nhận dạng PHẢI lấy từ object dưới đây; không hard-code tên/ISSN
 * của học viện nguồn ở bất kỳ đâu trong báo cáo.
 */

export const JOURNAL_IDENTITY = {
  nameVi: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
  nameEn: 'Journal of Vietnamese Military Art',
  shortNameVi: 'Tạp chí Nghệ thuật QSVN',
  parentOrg: 'Học viện Quốc phòng',
  parentOrgShort: 'HVQPh',
  issn: '1859-0454',
  email: 'tapchintqsvn@gmail.com',
  phone: '(069) 556 635',
  address: '93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội',
  mailbox: '2EA6',
  // Quốc hiệu - tiêu ngữ cho header văn bản hành chính
  nation: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  motto: 'Độc lập - Tự do - Hạnh phúc',
} as const;

/**
 * Giá trị mặc định cho các cột không có trong schema dữ liệu.
 * Mọi bài trong hệ thống đều công bố trên chính tạp chí này nên:
 *  - "Tên tạp chí" = tên NTQS,
 *  - "Loại tạp chí" = tạp chí khoa học trong nước có phản biện.
 */
export const REPORT_DEFAULTS = {
  defaultJournalName: JOURNAL_IDENTITY.nameVi,
  defaultJournalType: 'Trong nước (có phản biện)',
} as const;
