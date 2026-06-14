
import { PrismaClient, SubmissionStatus, IssueStatus, Role, Decision } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Dữ liệu từ Số 01/2025
const ISSUE_DATA = {
  volumeNo: 1,
  year: 2025,
  issueNumber: 1,
  issueCode: 231,
  issn: '1859-1337',
  title: 'Số 1 (231) - 2025',
  description: 'Năm thứ 54 - Tạp chí Nghệ thuật Quân sự Việt Nam',
  publishDate: new Date('2025-02-01')
}

// Các danh mục chính
const CATEGORIES = [
  {
    code: 'HUONG_DAN_CHI_DAO',
    name: 'Hướng dẫn - Chỉ đạo',
    slug: 'huong-dan-chi-dao',
    description: 'Các bài viết hướng dẫn và chỉ đạo từ lãnh đạo'
  },
  {
    code: 'KY_NIEM',
    name: 'Kỷ niệm 95 năm ngày thành lập Đảng Cộng sản Việt Nam',
    slug: 'ky-niem-95-nam-dang',
    description: 'Bài viết kỷ niệm 95 năm ngày thành lập Đảng Cộng sản Việt Nam (03/02/1930 - 03/02/2025)'
  },
  {
    code: 'NGHIEN_CUU_TRAO_DOI',
    name: 'Nghiên cứu - Trao đổi',
    slug: 'nghien-cuu-trao-doi',
    description: 'Các bài nghiên cứu và trao đổi học thuật'
  },
  {
    code: 'LICH_SU',
    name: 'Lịch sử hậu cần quân sự',
    slug: 'lich-su-hau-can',
    description: 'Các bài viết về lịch sử hậu cần quân sự'
  }
]

// Danh sách bài viết đầy đủ
const ARTICLES = [
  // HƯỚNG DẪN - CHỈ ĐẠO
  {
    title: 'Đổi mới, sáng tạo, tăng tốc, bứt phá, quyết liệt thực hiện thắng lợi nhiệm vụ giáo dục - đào tạo, nghiên cứu khoa học năm 2025',
    authors: ['Trung tướng, GS.TS. PHAN TÙNG SƠN'],
    category: 'HUONG_DAN_CHI_DAO',
    pages: '3-7',
    abstractVn: 'Thời gian qua, Học viện Quốc phòng đã quán triệt, triển khai thực hiện nghiêm túc, quyết liệt, sát thực tiễn các nghị quyết, chỉ thị, kết luận, của Đảng, Quân ủy Trung ương, Bộ Quốc phòng về xây dựng Quân đội; tập trung nâng cao chất lượng công tác giáo dục, đào tạo và nghiên cứu khoa học, đạt kết quả đáng khích lệ.',
    keywords: ['giáo dục đào tạo', 'nghiên cứu khoa học', 'Học viện Quốc phòng', 'đổi mới sáng tạo']
  },
  {
    title: 'Làm tốt công tác chuẩn bị - Nhân tố quyết định bảo đảm thực hiện thắng lợi nhiệm vụ đại hội đảng các cấp trong Đảng bộ Học viện Quốc phòng',
    authors: ['Trung tướng DƯƠNG ĐỨC THIỆN'],
    category: 'HUONG_DAN_CHI_DAO',
    pages: '8-11',
    abstractVn: 'Công tác chuẩn bị và tiến hành đại hội đảng các cấp trong Đảng bộ Học viện có ý nghĩa đặc biệt quan trọng, là nhiệm vụ chính trị trọng tâm, xuyên suốt của các cấp ủy, tổ chức đảng, các cơ quan, đơn vị.',
    keywords: ['đại hội đảng', 'công tác chuẩn bị', 'Đảng bộ Học viện Quốc phòng']
  },
  {
    title: 'Tiếp tục đẩy mạnh công tác nghiên cứu khoa học góp phần hoàn thành thắng lợi nhiệm vụ giáo dục, đào tạo ở Học viện Quốc phòng',
    authors: ['Thiếu tướng, PGS. TS. TRỊNH BÁ CHINH'],
    category: 'HUONG_DAN_CHI_DAO',
    pages: '12-16',
    abstractVn: 'Công tác nghiên cứu khoa học có mối quan hệ chặt chẽ với giáo dục, đào tạo. Nâng cao chất lượng các mặt hoạt động khoa học, đưa công tác nghiên cứu khoa học đi trước một bước là yêu cầu cấp thiết.',
    keywords: ['nghiên cứu khoa học', 'giáo dục đào tạo', 'Học viện Quốc phòng']
  },

  // KỶ NIỆM 95 NĂM THÀNH LẬP ĐẢNG
  {
    title: 'Tăng cường sự lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội thời kỳ mới',
    authors: ['Trung tướng ĐỖ VĂN THIỆN'],
    category: 'KY_NIEM',
    pages: '17-21',
    abstractVn: 'Bài viết phân tích vai trò lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội trong thời kỳ mới, đề xuất các giải pháp tăng cường sự lãnh đạo.',
    keywords: ['lãnh đạo của Đảng', 'hậu cần quân đội', 'kỹ thuật quân đội']
  },
  {
    title: 'Đấu tranh trên mạng xã hội, đẩy lùi suy thoái về tư tưởng chính trị, đạo đức lối sống của cán bộ, đảng viên, bảo vệ nền tảng tư tưởng của Đảng trong giai đoạn hiện nay',
    authors: ['Đại tá, ThS. NGUYỄN TIẾN DŨNG'],
    category: 'KY_NIEM',
    pages: '22-26',
    abstractVn: 'Bài viết đề cập đến vấn đề đấu tranh trên mạng xã hội, đẩy lùi suy thoái về tư tưởng chính trị, đạo đức lối sống, bảo vệ nền tảng tư tưởng của Đảng.',
    keywords: ['mạng xã hội', 'tư tưởng chính trị', 'đạo đức lối sống', 'bảo vệ Đảng']
  },
  {
    title: 'Xây dựng đội ngũ cán bộ hậu cần, kỹ thuật quân đội tinh nhuệ về chính trị trong tình hình mới',
    authors: ['Thượng tá, TS. PHẠM NGỌC NHÂN'],
    category: 'KY_NIEM',
    pages: '27-31',
    abstractVn: 'Bài viết đề xuất các biện pháp xây dựng đội ngũ cán bộ hậu cần, kỹ thuật quân đội có phẩm chất chính trị vững vàng, đáp ứng yêu cầu nhiệm vụ trong tình hình mới.',
    keywords: ['cán bộ hậu cần', 'kỹ thuật quân đội', 'tinh nhuệ chính trị']
  },

  // NGHIÊN CỨU - TRAO ĐỔI
  {
    title: 'Tổ chức dự trữ vật chất quân nhu lực lượng vũ trang địa phương đánh địch giữ vững khu vực phòng thủ chủ yếu trong tác chiến phòng thủ tỉnh',
    authors: ['Thượng tá, TS. ĐỖ DUY THÁNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '32-35',
    abstractVn: 'Tổ chức dự trữ vật chất quân nhu là nội dung quan trọng của bảo đảm quân nhu trong tác chiến. Bài viết đề cập một số biện pháp về tổ chức dự trữ VCQN cho lực lượng vũ trang địa phương.',
    keywords: ['dự trữ vật chất', 'quân nhu', 'lực lượng vũ trang địa phương', 'phòng thủ tỉnh']
  },
  {
    title: 'Một số giải pháp nâng cao hiệu quả bảo đảm thông tin liên lạc trong đánh trận then chốt tiêu diệt địch đổ bộ đường không trong chiến dịch phản công',
    authors: ['Đại tá, TS. VŨ THANH TUẤN'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '36-39',
    abstractVn: 'Bài viết đề xuất các giải pháp nâng cao hiệu quả bảo đảm thông tin liên lạc trong trận then chốt tiêu diệt địch đổ bộ đường không.',
    keywords: ['thông tin liên lạc', 'địch đổ bộ đường không', 'chiến dịch phản công']
  },
  {
    title: 'Nâng cao đạo đức cách mạng cho đội ngũ chủ nhiệm hậu cần - kỹ thuật trong Quân đội nhân dân Việt Nam hiện nay',
    authors: ['Đại tá, TS. NGUYỄN VĂN KÝ'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '40-43',
    abstractVn: 'Đạo đức cách mạng là cái gốc, là phẩm chất nền tảng trong nhân cách của đội ngũ chủ nhiệm hậu cần – kỹ thuật. Bài viết đề xuất một số biện pháp nâng cao đạo đức cách mạng.',
    keywords: ['đạo đức cách mạng', 'chủ nhiệm hậu cần', 'kỹ thuật quân đội']
  },
  {
    title: 'Biện pháp bảo đảm vật chất hậu cần trung đoàn bộ binh truy kích địch rút chạy đường bộ',
    authors: ['Trung tá, ThS. NGUYỄN VĂN HIỆN'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '65-68',
    abstractVn: 'Bài viết đề xuất các biện pháp bảo đảm vật chất hậu cần cho trung đoàn bộ binh khi truy kích địch rút chạy đường bộ.',
    keywords: ['vật chất hậu cần', 'trung đoàn bộ binh', 'truy kích địch']
  },
  {
    title: 'Một số biện pháp bảo đảm quân y trung, lữ đoàn tham gia phòng, chống và khắc phục hậu quả thiên tai',
    authors: ['Thiếu tá, ThS. NHỮ VIỆT HÙNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '69-71',
    abstractVn: 'Bài viết đề cập các biện pháp bảo đảm quân y cho trung, lữ đoàn tham gia phòng, chống và khắc phục hậu quả thiên tai.',
    keywords: ['quân y', 'thiên tai', 'phòng chống thiên tai']
  },
  {
    title: 'Nội dung, giải pháp bảo vệ hậu cần – kỹ thuật trong tác chiến phân công chiến lược chiến trường miền Bắc',
    authors: ['Đại tá, ThS. TẠ VIỆT XUÂN', 'Thiếu tá, CN. NGUYỄN ĐỨC MẠNH'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '72-75',
    abstractVn: 'Bài viết đề cập nội dung và giải pháp bảo vệ hậu cần – kỹ thuật trong tác chiến phân công chiến lược chiến trường miền Bắc.',
    keywords: ['bảo vệ hậu cần', 'kỹ thuật', 'tác chiến chiến lược']
  },
  {
    title: 'Nâng cao chất lượng công tác thanh tra, kiểm tra tài chính ngân sách quốc phòng thường xuyên ở Quân khu 1',
    authors: ['Thiếu tá, ThS. NGUYỄN NAM KHOA'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '76-79',
    abstractVn: 'Bài viết đề xuất các giải pháp nâng cao chất lượng công tác thanh tra, kiểm tra tài chính ngân sách quốc phòng.',
    keywords: ['thanh tra', 'tài chính quốc phòng', 'ngân sách']
  },
  {
    title: 'Giải pháp tổ chức, sử dụng, bố trí lực lượng hậu cần sư đoàn bộ binh tiến công địch phòng ngự đô thị ở địa hình trung du',
    authors: ['Trung tá, ThS. VŨ ĐỨC TUÂN', 'Thiếu tá, CN. NGUYỄN VĂN TRÌNH'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '80-83',
    abstractVn: 'Bài viết đề xuất giải pháp tổ chức, sử dụng, bố trí lực lượng hậu cần sư đoàn bộ binh tiến công địch phòng ngự đô thị.',
    keywords: ['hậu cần sư đoàn', 'bộ binh', 'tiến công đô thị']
  },
  {
    title: 'Chuẩn bị lực lượng hậu cần, kỹ thuật bảo đảm cho các lực lượng vũ trang tác chiến khu vực phòng thủ huyện',
    authors: ['Thiếu tá, CN. MAI VĂN ĐẠT'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '84-87',
    abstractVn: 'Chuẩn bị lực lượng hậu cần, kỹ thuật là một nội dung chuẩn bị hậu cần, kỹ thuật, yếu tố quan trọng quyết định đến kết quả chuẩn bị.',
    keywords: ['chuẩn bị lực lượng', 'hậu cần kỹ thuật', 'phòng thủ huyện']
  },
  {
    title: 'Một số biện pháp nâng cao chất lượng quản lý kinh phí nghiệp vụ tại Binh chủng Thông tin Liên lạc',
    authors: ['Đại úy, CN. NGUYỄN THỊ HẢI YÊN'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '88-90',
    abstractVn: 'Bài viết đề xuất các biện pháp nâng cao chất lượng quản lý kinh phí nghiệp vụ tại Binh chủng Thông tin Liên lạc.',
    keywords: ['quản lý kinh phí', 'thông tin liên lạc', 'nghiệp vụ']
  },
  {
    title: 'Một số biện pháp bảo đảm vật chất hậu cần trận then chốt đánh địch tiến công đường bộ chiến dịch phân công trong tác chiến phòng thủ quân khu',
    authors: ['Thượng tá, ThS. ĐOÀN VĂN LUÂN'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '91-93',
    abstractVn: 'Bài viết đề xuất các biện pháp bảo đảm vật chất hậu cần trận then chốt đánh địch tiến công đường bộ.',
    keywords: ['vật chất hậu cần', 'trận then chốt', 'phòng thủ quân khu']
  },
  {
    title: 'Tổ chức vận chuyển thương binh trung đoàn bộ binh chiến đấu tập kích ở đồng bằng sông Cửu Long mùa nước nổi',
    authors: ['Trung tá, TS. ĐINH VĂN ĐÔNG', 'Đại úy, CN. TRẦN TUẤN ANH'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '94-97',
    abstractVn: 'Tổ chức vận chuyển thương binh có ý nghĩa quan trọng, ảnh hưởng trực tiếp đến nhiệm vụ cứu chữa thương binh ở các tuyến quân y.',
    keywords: ['vận chuyển thương binh', 'đồng bằng sông Cửu Long', 'chiến đấu tập kích']
  },
  {
    title: 'Bảo vệ vận tải trong điều kiện địch sử dụng vũ khí công nghệ cao',
    authors: ['Thượng tá, TS. LÊ QUANG VỊNH'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '98-101',
    abstractVn: 'Bài viết phân tích các biện pháp bảo vệ vận tải trong điều kiện địch sử dụng vũ khí công nghệ cao.',
    keywords: ['bảo vệ vận tải', 'vũ khí công nghệ cao']
  },
  {
    title: 'Một số yêu cầu về sử dụng lữ đoàn tàu tên lửa - ngư lôi tiến công nhóm tàu chi viện hỏa lực địch đổ bộ đường biển',
    authors: ['Thiếu tá, ThS. NGUYỄN MẠNH QUỲNH'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '102-105',
    abstractVn: 'Bài viết đề cập các yêu cầu về sử dụng lữ đoàn tàu tên lửa - ngư lôi tiến công nhóm tàu chi viện hỏa lực địch.',
    keywords: ['tàu tên lửa', 'ngư lôi', 'đổ bộ đường biển']
  },
  {
    title: 'Tổ chức, sử dụng lực lượng hậu cần dự bị lữ đoàn tàu tên lửa tiến công tàu mặt nước địch bảo vệ vận tải đường biển chi viện Quần đảo Trường Sa',
    authors: ['Thượng tá, TS. NGUYỄN QUỐC HOÀI'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '106-109',
    abstractVn: 'Một nguyên tắc trong bảo đảm hậu cần trận chiến đấu trên biển là luôn phải tổ chức lực lượng hậu cần dự bị đủ mạnh để sử dụng cho các nhiệm vụ phát sinh.',
    keywords: ['lực lượng dự bị', 'tàu tên lửa', 'Quần đảo Trường Sa', 'vận tải biển']
  },
  {
    title: 'Nghiên cứu một số mô hình ứng xử phi tuyến của bê tông cốt thép',
    authors: ['Trung tá, ThS. NGUYỄN VĂN TRỌNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '110-114',
    abstractVn: 'Bài viết đã trình bày làm rõ về các mô hình ứng xử phi tuyến của bê tông cốt thép và các khuyến nghị áp dụng cho tính toán thiết kế các công trình trong Quân đội.',
    keywords: ['bê tông cốt thép', 'mô hình phi tuyến', 'công trình quân sự']
  },
  {
    title: 'Nâng cao chất lượng tự học từ vựng Tiếng Anh cho đối tượng đào tạo sĩ quan hậu cần cấp phân đội, trình độ đại học tại Học viện Quốc phòng',
    authors: ['Thiếu tá, ThS. HOÀNG THỊ THU HÀ'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '115-117',
    abstractVn: 'Từ vựng đóng vai trò quan trọng trong việc học tập và sử dụng tiếng Anh. Bài viết đề xuất các biện pháp nâng cao chất lượng tự học từ vựng tiếng Anh.',
    keywords: ['tiếng Anh', 'từ vựng', 'sĩ quan hậu cần', 'Học viện Quốc phòng']
  },
  {
    title: 'Biện pháp bảo đảm vật chất hậu cần phân đội bộ binh cơ động chiến đấu ở đồng bằng sông Cửu Long',
    authors: ['Đại tá, TS. PHẠM TRỌNG DIỄN', 'Trung tá, ThS. NGUYỄN VĂN THÁI'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '118-121',
    abstractVn: 'Bảo đảm vật chất hậu cần, một mặt của bảo đảm hậu cần, nhằm đáp ứng nhu cầu vật chất cho đơn vị chiến đấu thắng lợi.',
    keywords: ['vật chất hậu cần', 'bộ binh', 'đồng bằng sông Cửu Long']
  },
  {
    title: 'Nâng cao chất lượng dạy học môn vật lý đại cương cho đối tượng sĩ quan hậu cần cấp phân đội, trình độ đại học, chuyên ngành vận tải',
    authors: ['Trung tá, ThS. ĐINH VĂN THƯỜNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '122-124',
    abstractVn: 'Vật lý đại cương là học phần thuộc khối kiến thức cơ bản trong khung chương trình đào tạo sĩ quan hậu cần. Bài viết đề xuất các giải pháp nâng cao chất lượng dạy học.',
    keywords: ['vật lý đại cương', 'sĩ quan hậu cần', 'dạy học']
  },
  {
    title: 'Phát huy vai trò của đội ngũ giảng viên trong ứng dụng chuyển đổi số vào đổi mới phương pháp dạy học ở Học viện Quốc phòng hiện nay',
    authors: ['Trung tá, TS. TRẦN VĂN HOAN'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '125-127',
    abstractVn: 'Bài viết phân tích vai trò của giảng viên trong việc ứng dụng chuyển đổi số vào đổi mới phương pháp dạy học.',
    keywords: ['chuyển đổi số', 'giảng viên', 'phương pháp dạy học']
  },
  {
    title: 'Nghiên cứu thiết kế, quản lý hệ thống thu gom, xử lý nước mưa bảo đảm trong sinh hoạt cho các đơn vị đóng quân ở địa bàn khan hiếm nước',
    authors: ['Trung tá, ThS. TRẦN MẠNH DŨNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '128-131',
    abstractVn: 'Bài viết nghiên cứu thiết kế và quản lý hệ thống thu gom, xử lý nước mưa bảo đảm sinh hoạt cho đơn vị ở địa bàn khan hiếm nước.',
    keywords: ['nước mưa', 'hệ thống thu gom', 'khan hiếm nước']
  },
  {
    title: 'Phát huy vai trò hoạt động của Bộ Chỉ huy quân sự tỉnh, thành phố trong xây dựng tiềm lực vận tải khu vực phòng thủ',
    authors: ['Trung tá, TS. NGUYỄN HUY THỤ'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '132-135',
    abstractVn: 'Bài viết phân tích vai trò của Bộ Chỉ huy quân sự tỉnh, thành phố trong xây dựng tiềm lực vận tải khu vực phòng thủ.',
    keywords: ['Bộ Chỉ huy quân sự', 'tiềm lực vận tải', 'phòng thủ']
  },
  {
    title: 'Bảo đảm quân nhu sư đoàn bộ binh tiến công trong hành tiến ở địa hình trung du',
    authors: ['Thượng tá, TS. TRẦN MẠNH CƯỜNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '136-139',
    abstractVn: 'Chiến tranh bảo vệ Tổ quốc tương lai, bảo đảm quân nhu sư đoàn bộ binh tiến công trong hành tiến ở địa hình trung du có những thuận lợi, song cũng có nhiều khó khăn, phức tạp.',
    keywords: ['quân nhu', 'sư đoàn bộ binh', 'địa hình trung du']
  },
  {
    title: 'Một số giải pháp bảo đảm vật chất hậu cần tác chiến phòng thủ các tỉnh Trung Lào trong chiến tranh bảo vệ Tổ quốc',
    authors: ['Trung tá, ThS. KHAM LOUANG THOUMMALA'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '140-143',
    abstractVn: 'Bảo đảm vật chất hậu cần là một nội dung của bảo đảm hậu cần, góp phần quan trọng để các lực lượng chiến đấu thắng lợi.',
    keywords: ['vật chất hậu cần', 'phòng thủ', 'Trung Lào']
  },
  {
    title: 'Nâng cao chất lượng huấn luyện thực hành môn học tổ chức vận tải bằng ô tô ở Học viện Quốc phòng',
    authors: ['Thượng úy, CN. TRỊNH ĐỨC QUANG', 'Trung tá, ThS. TRỪ VĂN HỮU'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '144-146',
    abstractVn: 'Bài viết đề xuất các giải pháp nâng cao chất lượng huấn luyện thực hành môn học tổ chức vận tải bằng ô tô.',
    keywords: ['huấn luyện thực hành', 'vận tải', 'ô tô']
  },
  {
    title: 'Công tác hậu cần, kỹ thuật trong diễn tập khu vực phòng thủ tỉnh Lạng Sơn',
    authors: ['Thượng tá, TS. NGUYỄN VĂN CƯỜNG'],
    category: 'NGHIEN_CUU_TRAO_DOI',
    pages: '147-150',
    abstractVn: 'Bài viết phân tích công tác hậu cần, kỹ thuật trong diễn tập khu vực phòng thủ tỉnh Lạng Sơn.',
    keywords: ['hậu cần kỹ thuật', 'diễn tập', 'Lạng Sơn']
  },

  // LỊCH SỬ HẬU CẦN QUÂN SỰ
  {
    title: 'Khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2 trong kháng chiến chống Mỹ - Kinh nghiệm và hướng kế thừa, phát triển',
    authors: ['Đại tá, TS. VŨ QUANG HÒA'],
    category: 'LICH_SU',
    pages: '151-155',
    abstractVn: 'Bài viết tổng kết kinh nghiệm khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2 trong kháng chiến chống Mỹ.',
    keywords: ['lịch sử hậu cần', 'Chiến trường B2', 'kháng chiến chống Mỹ']
  },
  {
    title: 'Kinh nghiệm tổ chức cứu chữa, vận chuyển thương binh trung đoàn bộ binh chiến đấu phòng ngự trong chiến tranh bảo vệ biên giới phía Bắc',
    authors: ['Thượng tá, TS. NGUYỄN THÀNH TRUNG'],
    category: 'LICH_SU',
    pages: '156-159',
    abstractVn: 'Bài viết tổng kết kinh nghiệm tổ chức cứu chữa, vận chuyển thương binh trong chiến tranh bảo vệ biên giới phía Bắc.',
    keywords: ['kinh nghiệm', 'cứu chữa thương binh', 'biên giới phía Bắc']
  },
  {
    title: 'Kinh nghiệm bảo đảm hậu cần trung đoàn bộ binh chiến đấu phục kích ở địa hình trung du trong chiến tranh giải phóng và hướng kế thừa, phát triển',
    authors: ['Thiếu tá, ThS. VŨ LƯƠNG SINH'],
    category: 'LICH_SU',
    pages: '160-163',
    abstractVn: 'Bài viết tổng kết kinh nghiệm bảo đảm hậu cần trung đoàn bộ binh chiến đấu phục kích ở địa hình trung du.',
    keywords: ['kinh nghiệm', 'hậu cần', 'chiến tranh giải phóng']
  },
  {
    title: 'Bảo đảm hậu cần Chiến dịch Tây Nguyên và hướng kế thừa - phát triển',
    authors: ['Đại úy, CN. ĐẶNG THÀNH SƠN'],
    category: 'LICH_SU',
    pages: '164-167',
    abstractVn: 'Bài viết tổng kết kinh nghiệm bảo đảm hậu cần Chiến dịch Tây Nguyên và hướng kế thừa, phát triển.',
    keywords: ['Chiến dịch Tây Nguyên', 'hậu cần', 'kinh nghiệm']
  },
  {
    title: 'Bảo đảm quân y trung đoàn bộ binh phòng ngự chốt chiến dịch trong chiến tranh giải phóng và hướng kế thừa, phát triển',
    authors: ['Trung tá, ThS. PHẠM VĂN HƯNG'],
    category: 'LICH_SU',
    pages: '168-171',
    abstractVn: 'Bài viết tổng kết kinh nghiệm bảo đảm quân y trung đoàn bộ binh phòng ngự chốt chiến dịch trong chiến tranh giải phóng.',
    keywords: ['quân y', 'chiến tranh giải phóng', 'kinh nghiệm']
  }
]

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu Số 01/2025...')

  // 1. Tạo Volume cho năm 2025
  console.log('📚 Tạo Volume...')
  const volume = await prisma.volume.upsert({
    where: { volumeNo: ISSUE_DATA.volumeNo },
    update: {},
    create: {
      volumeNo: ISSUE_DATA.volumeNo,
      year: ISSUE_DATA.year,
      title: `Tập ${ISSUE_DATA.volumeNo} - Năm ${ISSUE_DATA.year}`,
      description: ISSUE_DATA.description
    }
  })
  console.log(`✅ Đã tạo Volume: ${volume.title}`)

  // 2. Tạo Issue
  console.log('📖 Tạo Issue...')
  const issue = await prisma.issue.upsert({
    where: {
      volumeId_number: {
        volumeId: volume.id,
        number: ISSUE_DATA.issueNumber
      }
    },
    update: {
      status: IssueStatus.PUBLISHED,
      publishDate: ISSUE_DATA.publishDate
    },
    create: {
      volumeId: volume.id,
      number: ISSUE_DATA.issueNumber,
      year: ISSUE_DATA.year,
      title: ISSUE_DATA.title,
      description: ISSUE_DATA.description,
      publishDate: ISSUE_DATA.publishDate,
      status: IssueStatus.PUBLISHED
    }
  })
  console.log(`✅ Đã tạo Issue: ${issue.title}`)

  // 3. Tạo Categories
  console.log('📂 Tạo Categories...')
  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { code: cat.code },
          { slug: cat.slug }
        ]
      }
    })
    
    if (existing) {
      console.log(`⏭️  Category đã tồn tại: ${cat.name}`)
      continue
    }
    
    await prisma.category.create({
      data: cat
    })
    console.log(`✅ Đã tạo Category: ${cat.name}`)
  }

  // 4. Tạo các tác giả (users với role AUTHOR)
  console.log('👥 Tạo Authors...')
  const allAuthors = new Set<string>()
  ARTICLES.forEach(article => {
    article.authors.forEach(author => allAuthors.add(author))
  })

  const authorUsers: { [key: string]: any } = {}
  for (const authorName of allAuthors) {
    const email = `${authorName.toLowerCase().replace(/[^a-z]/g, '')}@tapchintqsvn.edu.vn`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName: authorName,
        role: Role.AUTHOR,
        passwordHash: await bcrypt.hash('password123', 10),
        org: 'Học viện Quốc phòng',
        isActive: true
      }
    })
    authorUsers[authorName] = user
    console.log(`✅ Đã tạo Author: ${authorName}`)
  }

  // 5. Tạo Articles với Submissions
  console.log('📝 Tạo Articles...')
  for (const articleData of ARTICLES) {
    const category = await prisma.category.findUnique({
      where: { code: articleData.category }
    })

    if (!category) {
      console.log(`⚠️ Không tìm thấy category: ${articleData.category}`)
      continue
    }

    // Lấy author đầu tiên làm corresponding author
    const mainAuthor = authorUsers[articleData.authors[0]]
    if (!mainAuthor) {
      console.log(`⚠️ Không tìm thấy author: ${articleData.authors[0]}`)
      continue
    }

    // Tạo submission code
    const submissionCode = `HCQS-${ISSUE_DATA.year}${String(ISSUE_DATA.issueNumber).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    // Tạo Submission
    const submission = await prisma.submission.create({
      data: {
        code: submissionCode,
        title: articleData.title,
        abstractVn: articleData.abstractVn,
        abstractEn: articleData.abstractVn, // Sử dụng tạm abstractVn
        keywords: articleData.keywords,
        createdBy: mainAuthor.id,
        categoryId: category.id,
        status: SubmissionStatus.PUBLISHED,
        createdAt: new Date(ISSUE_DATA.publishDate.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 ngày trước
      }
    })

    // Tạo Article liên kết với Submission và Issue
    const article = await prisma.article.create({
      data: {
        submissionId: submission.id,
        issueId: issue.id,
        pages: articleData.pages,
        publishedAt: ISSUE_DATA.publishDate,
        views: Math.floor(Math.random() * 500) + 50,
        downloads: Math.floor(Math.random() * 200) + 20,
        isFeatured: Math.random() > 0.8 // 20% bài viết được featured
      }
    })

    console.log(`✅ Đã tạo Article: ${articleData.title.substring(0, 50)}...`)
  }

  console.log('✨ Hoàn thành seed dữ liệu Số 01/2025!')
  console.log(`📊 Tổng kết:`)
  console.log(`   - Volume: ${volume.title}`)
  console.log(`   - Issue: ${issue.title}`)
  console.log(`   - Categories: ${CATEGORIES.length}`)
  console.log(`   - Authors: ${allAuthors.size}`)
  console.log(`   - Articles: ${ARTICLES.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
