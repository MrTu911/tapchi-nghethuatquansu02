/**
 * seed-issue-01-2025.ts
 *
 * Nhập dữ liệu Số 1 (231) - 2025 vào thư viện số.
 * Idempotent: có thể chạy lại nhiều lần.
 *
 * Run: npx tsx --require dotenv/config prisma/seed-issue-01-2025.ts
 */

import 'dotenv/config'
import {
  importJournalIssue,
  type JournalIssueSeed,
} from '../lib/services/journal-issue-import.service'

const seed: JournalIssueSeed = {
  volume: {
    volumeNo:          54,
    year:              2025,
    issn:              '1859-1337',
    publicationPeriod: 'Hai tháng ra một kỳ',
  },
  issue: {
    number:           1,
    year:             2025,
    title:            'Số 1 (231) - 2025',
    slug:             'so-1-231-2025',
    issueCode:        231,
    coverCaption:     'Đồng chí Trung tướng, GS.TS. Phan Tùng Sơn - Giám đốc Học viện Quốc phòng nhận Cờ thi đua của Chính phủ tặng Học viện Quốc phòng năm 2024.',
    coverPhotoCredit: 'Thanh Tuyền',
    pageCount:        172,
    publishDate:      new Date('2025-01-01'),
    pdfUrl:           '/uploads/journals/2025/so-1-231/full.pdf',
    coverImage:       '/uploads/journals/2025/so-1-231/cover.png',
  },
  advisoryCouncil: [
    { order: 1,  role: 'Chủ tịch',          militaryRank: 'Trung tướng',  academicTitle: 'GS',  degree: 'TS',  fullName: 'Phan Tùng Sơn' },
    { order: 2,  role: 'Phó Chủ tịch',       militaryRank: 'Trung tướng',  academicTitle: null,  degree: null,  fullName: 'Dương Đức Thiện' },
    { order: 3,  role: 'Ủy viên',            militaryRank: 'Thiếu tướng',  academicTitle: 'PGS', degree: 'TS',  fullName: 'Trịnh Bá Chinh' },
    { order: 4,  role: 'Ủy viên',            militaryRank: 'Thiếu tướng',  academicTitle: 'PGS', degree: 'TS',  fullName: 'Lê Thành Long' },
    { order: 5,  role: 'Ủy viên',            militaryRank: 'Thiếu tướng',  academicTitle: null,  degree: 'TS',  fullName: 'Nguyễn Quang Dũng' },
    { order: 6,  role: 'Ủy viên',            militaryRank: 'Đại tá',       academicTitle: 'PGS', degree: 'TS',  fullName: 'Vũ Hoàng Hà' },
    { order: 7,  role: 'Ủy viên',            militaryRank: 'Đại tá',       academicTitle: 'PGS', degree: 'TS',  fullName: 'Nguyễn Thanh Lam' },
    { order: 8,  role: 'Ủy viên',            militaryRank: 'Đại tá',       academicTitle: 'PGS', degree: 'TS',  fullName: 'Đoàn Quyết Thắng' },
    { order: 9,  role: 'Ủy viên',            militaryRank: 'Đại tá',       academicTitle: null,  degree: 'ThS', fullName: 'Nguyễn Tiến Dũng' },
    { order: 10, role: 'Ủy viên',            militaryRank: 'Thượng tá',    academicTitle: null,  degree: 'TS',  fullName: 'Nguyễn Quốc Hoài' },
    { order: 11, role: 'Phụ trách Tạp chí',  militaryRank: 'Thượng tá',    academicTitle: null,  degree: 'TS',  fullName: 'Nguyễn Quốc Hoài' },
  ],
  sections: [
    {
      name:  'Hướng dẫn - Chỉ đạo',
      order: 1,
      articles: [
        {
          pageStart: 3,
          title:     'Đổi mới, sáng tạo, tăng tốc, bứt phá, quyết liệt thực hiện thắng lợi nhiệm vụ giáo dục - đào tạo, nghiên cứu khoa học năm 2025',
          authors:   ['Trung tướng, GS.TS. Phan Tùng Sơn'],
        },
        {
          pageStart: 8,
          title:     'Làm tốt công tác chuẩn bị - Nhân tố quyết định bảo đảm thực hiện thắng lợi nhiệm vụ đại hội đảng các cấp trong Đảng bộ Học viện Quốc phòng',
          authors:   ['Trung tướng Dương Đức Thiện'],
        },
        {
          pageStart: 12,
          title:     'Tiếp tục đẩy mạnh công tác nghiên cứu khoa học góp phần hoàn thành thắng lợi nhiệm vụ giáo dục, đào tạo ở Học viện Quốc phòng',
          authors:   ['Thiếu tướng, PGS.TS. Trịnh Bá Chinh'],
        },
      ],
    },
    {
      name:  'Kỷ niệm 95 năm ngày thành lập Đảng Cộng sản Việt Nam',
      order: 2,
      articles: [
        {
          pageStart: 17,
          title:     'Tăng cường sự lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội thời kỳ mới',
          authors:   ['Trung tướng Đỗ Văn Thiện'],
        },
        {
          pageStart: 22,
          title:     'Đấu tranh trên mạng xã hội, đẩy lùi suy thoái về tư tưởng chính trị, đạo đức lối sống của cán bộ, đảng viên, bảo vệ nền tảng tư tưởng của Đảng trong giai đoạn hiện nay',
          authors:   ['Đại tá, ThS. Nguyễn Tiến Dũng'],
        },
        {
          pageStart: 27,
          title:     'Xây dựng đội ngũ cán bộ hậu cần, kỹ thuật quân đội tinh nhuệ về chính trị trong tình hình mới',
          authors:   ['Thượng tá, TS. Phạm Ngọc Nhân'],
        },
      ],
    },
    {
      name:  'Nghiên cứu - Trao đổi',
      order: 3,
      articles: [
        {
          pageStart: 32,
          title:     'Tổ chức dự trữ vật chất quân nhu lực lượng vũ trang địa phương đánh địch giữ vững khu vực phòng thủ chủ yếu trong tác chiến phòng thủ tỉnh',
          authors:   ['Thượng tá, TS. Đỗ Duy Thắng'],
        },
        {
          pageStart: 36,
          title:     'Một số giải pháp nâng cao hiệu quả bảo đảm thông tin liên lạc đánh trận then chốt tiêu diệt địch đổ bộ đường không trong chiến dịch phản công',
          authors:   ['Đại tá, TS. Phạm Văn Hải'],
        },
        {
          pageStart: 40,
          title:     'Nâng cao đạo đức cách mạng cho đội ngũ chủ nhiệm hậu cần - kỹ thuật trong Quân đội nhân dân Việt Nam hiện nay',
          authors:   ['Đại tá, TS. Nguyễn Văn Ký'],
        },
        {
          pageStart: 44,
          title:     'Bàn về bảo đảm quân y tác chiến tiến công chiến lược trong chiến tranh bảo vệ Tổ quốc',
          authors:   ['Thượng tá, TS. Lê Đình Quân'],
        },
        {
          pageStart: 48,
          title:     'Giải pháp bảo đảm vật chất hậu cần trung đoàn bộ binh vận động tiến công ở đồng bằng sông Cửu Long',
          authors:   ['Trung tá, ThS. Phạm Xuân Quý'],
        },
        {
          pageStart: 52,
          title:     'Xung đột quân sự giữa Nga - Ucraina hơn 3 năm nhìn lại và một số vấn đề rút ra về bảo đảm hậu cần, kỹ thuật tác chiến',
          authors:   ['Trung tá, ThS. Trần Quốc Tuấn'],
        },
        {
          pageStart: 56,
          title:     'Công tác sơ cấp cứu bệnh nhân bỏng tại quân y đơn vị',
          authors:   ['Đại tá, BS CKI. Trần Thị Kim Thoa'],
        },
        {
          pageStart: 60,
          title:     'Bàn về những điểm mới của Tiêu chuẩn TCVN 2737:2023: Tải trọng và tác động - tiêu chuẩn thiết kế tác động đến chất lượng quản lý hoạt động đầu tư xây dựng doanh trại quân đội',
          authors:   ['Thượng tá, TS. Chu Thị Hải Ninh'],
        },
        {
          pageStart: 65,
          title:     'Biện pháp bảo đảm vật chất hậu cần trung đoàn bộ binh truy kích địch rút chạy đường bộ',
          authors:   ['Trung tá, ThS. Nguyễn Văn Hiển'],
        },
        {
          pageStart: 69,
          title:     'Một số biện pháp bảo đảm quân y trung, lữ đoàn tham gia phòng, chống và khắc phục hậu quả thiên tai',
          authors:   ['Thiếu tá, ThS. Nhữ Việt Hùng'],
        },
        {
          pageStart: 72,
          title:     'Nội dung, giải pháp bảo vệ hậu cần - kỹ thuật trong tác chiến phản công chiến lược chiến trường miền Bắc',
          authors:   ['Đại tá, ThS. Tạ Viết Xuân', 'Thiếu tá, CN. Nguyễn Đức Mạnh'],
        },
        {
          pageStart: 76,
          title:     'Nâng cao chất lượng công tác thanh tra, kiểm tra tài chính ngân sách quốc phòng thường xuyên ở Quân khu 1',
          authors:   ['Thiếu tá, ThS. Nguyễn Nam Khoa'],
        },
        {
          pageStart: 80,
          title:     'Giải pháp tổ chức, sử dụng, bố trí lực lượng hậu cần sư đoàn bộ binh tiến công địch phòng ngự đô thị ở địa hình trung du',
          authors:   ['Trung tá, ThS. Vũ Đức Tuấn', 'Thiếu tá, CN. Nguyễn Văn Trình'],
        },
        {
          pageStart: 84,
          title:     'Chuẩn bị lực lượng hậu cần, kỹ thuật bảo đảm cho các lực lượng vũ trang tác chiến khu vực phòng thủ huyện',
          authors:   ['Thiếu tá, CN. Mai Văn Đạt'],
        },
        {
          pageStart: 88,
          title:     'Một số biện pháp nâng cao chất lượng quản lý kinh phí nghiệp vụ tại Binh chủng Thông tin Liên lạc',
          authors:   ['Đại úy, CN. Nguyễn Thị Hải Yến'],
        },
        {
          pageStart: 91,
          title:     'Một số biện pháp bảo đảm vật chất hậu cần trận then chốt đánh địch tiến công đường bộ chiến dịch phản công trong tác chiến phòng thủ quân khu',
          authors:   ['Thượng tá, ThS. Đoàn Văn Luân'],
        },
        {
          pageStart: 94,
          title:     'Tổ chức vận chuyển thương binh trung đoàn bộ binh chiến đấu tập kích ở đồng bằng sông Cửu Long mùa nước nổi',
          authors:   ['Trung tá, TS. Đinh Văn Đông', 'Đại úy, CN. Trần Tuấn Anh'],
        },
        {
          pageStart: 98,
          title:     'Bảo vệ vận tải trong điều kiện địch sử dụng vũ khí công nghệ cao',
          authors:   ['Thượng tá, TS. Lê Quang Vịnh'],
        },
        {
          pageStart: 102,
          title:     'Một số yêu cầu về sử dụng lữ đoàn tàu tên lửa - ngư lôi tiến công nhóm tàu chi viện hỏa lực địch đổ bộ đường biển',
          authors:   ['Thiếu tá, ThS. Nguyễn Mạnh Quỳnh'],
        },
        {
          pageStart: 106,
          title:     'Tổ chức, sử dụng lực lượng hậu cần dự bị lữ đoàn tàu tên lửa tiến công tàu mặt nước địch bảo vệ vận tải đường biển chi viện Quần đảo Trường Sa',
          authors:   ['Thượng tá, TS. Nguyễn Quốc Hoài'],
        },
        {
          pageStart: 110,
          title:     'Nghiên cứu một số mô hình ứng xử phi tuyến của bê tông cốt thép',
          authors:   ['Trung tá, ThS. Nguyễn Văn Trọng'],
        },
        {
          pageStart: 115,
          title:     'Nâng cao chất lượng tự học từ vựng Tiếng Anh cho đối tượng đào tạo sĩ quan hậu cần cấp phân đội, trình độ đại học tại Học viện Quốc phòng',
          authors:   ['Thiếu tá, ThS. Hoàng Thị Thu Hà'],
        },
        {
          pageStart: 118,
          title:     'Biện pháp bảo đảm vật chất hậu cần phân đội bộ binh cơ động chiến đấu ở đồng bằng sông Cửu Long',
          authors:   ['Đại tá, TS. Phạm Trọng Diễn', 'Trung tá, ThS. Nguyễn Văn Thái'],
        },
        {
          pageStart: 122,
          title:     'Nâng cao chất lượng dạy học môn vật lý đại cương cho đối tượng sĩ quan hậu cần cấp phân đội, trình độ đại học, chuyên ngành vận tải',
          authors:   ['Trung tá, ThS. Đinh Văn Thường'],
        },
        {
          pageStart: 125,
          title:     'Phát huy vai trò của đội ngũ giảng viên trong ứng dụng chuyển đổi số vào đổi mới phương pháp dạy học ở Học viện Quốc phòng hiện nay',
          authors:   ['Trung tá, TS. Trần Văn Hoan'],
        },
        {
          pageStart: 128,
          title:     'Nghiên cứu thiết kế, quản lý hệ thống thu gom, xử lý nước mưa bảo đảm trong sinh hoạt cho các đơn vị đóng quân ở địa bàn khan hiếm nước',
          authors:   ['Trung tá, ThS. Trần Mạnh Dũng'],
        },
        {
          pageStart: 132,
          title:     'Phát huy vai trò hoạt động của Bộ Chỉ huy quân sự tỉnh, thành phố trong xây dựng tiềm lực vận tải khu vực phòng thủ',
          authors:   ['Trung tá, TS. Nguyễn Huy Thụ'],
        },
        {
          pageStart: 136,
          title:     'Bảo đảm quân nhu sư đoàn bộ binh tiến công trong hành tiến ở địa hình trung du',
          authors:   ['Thượng tá, TS. Trần Mạnh Cường'],
        },
        {
          pageStart: 140,
          title:     'Một số giải pháp bảo đảm vật chất hậu cần tác chiến phòng thủ các tỉnh Trung Lào trong chiến tranh bảo vệ Tổ quốc',
          authors:   ['Trung tá, ThS. Kham Louang Thoummala'],
        },
        {
          pageStart: 144,
          title:     'Nâng cao chất lượng huấn luyện thực hành môn học tổ chức vận tải bằng ô tô ở Học viện Quốc phòng',
          authors:   ['Thượng úy, CN. Trịnh Đức Quang', 'Trung tá, ThS. Trử Văn Hữu'],
        },
        {
          pageStart: 147,
          title:     'Công tác hậu cần, kỹ thuật trong diễn tập khu vực phòng thủ tỉnh Lạng Sơn',
          authors:   ['Thượng tá, TS. Nguyễn Văn Cường'],
        },
      ],
    },
    {
      name:  'Lịch sử quân sự',
      order: 4,
      articles: [
        {
          pageStart: 151,
          title:     'Khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2 trong kháng chiến chống Mỹ - Kinh nghiệm và hướng kế thừa, phát triển',
          authors:   ['Đại tá, TS. Vũ Quang Hòa'],
        },
        {
          pageStart: 156,
          title:     'Kinh nghiệm tổ chức cứu chữa, vận chuyển thương binh trung đoàn bộ binh chiến đấu phòng ngự trong chiến tranh bảo vệ biên giới phía Bắc',
          authors:   ['Thượng tá, TS. Nguyễn Thành Trung'],
        },
        {
          pageStart: 160,
          title:     'Kinh nghiệm bảo đảm hậu cần trung đoàn bộ binh chiến đấu phục kích ở địa hình trung du trong chiến tranh giải phóng và hướng kế thừa, phát triển',
          authors:   ['Thiếu tá, ThS. Vũ Lương Sinh'],
        },
        {
          pageStart: 164,
          title:     'Bảo đảm hậu cần Chiến dịch Tây Nguyên và hướng kế thừa - phát triển',
          authors:   ['Đại úy, CN. Đặng Thành Sơn'],
        },
        {
          pageStart: 168,
          title:     'Bảo đảm quân y trung đoàn bộ binh phòng ngự chốt chiến dịch trong chiến tranh giải phóng và hướng kế thừa, phát triển',
          authors:   ['Trung tá, ThS. Phạm Văn Hưng'],
        },
      ],
    },
  ],
}

async function main() {
  console.log('📰 Importing Số 1 (231) - 2025...')
  await importJournalIssue(seed)
  console.log('✅ Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
