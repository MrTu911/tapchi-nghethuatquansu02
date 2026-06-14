/**
 * seed-news-batch2.ts — Tapchi-HCQS
 *
 * Thêm 10 bài tin tức mới từ hocvienhaucan.edu.vn (batch 2).
 * Idempotent — upsert by slug, KHÔNG xóa dữ liệu cũ.
 * Run: npx tsx --require dotenv/config prisma/seed-news-batch2.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

const BASE_IMG = 'https://hocvienhaucan.edu.vn/storage/app/media/uploaded-files'

// User IDs từ DB hiện tại
const AUTHOR_EIC     = '76f7135c-a48b-4760-af20-182243dad991' // Tổng Biên Tập
const AUTHOR_EDITOR  = 'd407d227-c07e-4184-8cc6-beffbcfd6215' // Biên Tập Chính
const AUTHOR_SECTION = '6ee14ac7-0e5a-4bfa-9319-34f579f9c9af' // Biên Tập Chuyên Mục
const AUTHOR_ADMIN   = '7557426a-ff70-4f9f-9d09-d609fbd59df5' // Quản trị viên hệ thống

const newsData = [
  // ── 1. hoat_dong ──────────────────────────────────────────────────────────
  {
    slug: 'hoc-vien-hau-can-quyet-liet-doi-moi-nang-cao-chat-luong-giao-duc-dao-tao',
    title: 'Học viện Quốc phòng: Quyết liệt đổi mới, nâng cao chất lượng giáo dục, đào tạo',
    summary: 'Học viện Quốc phòng tham dự hội nghị trực tuyến toàn quân do Thượng tướng Nguyễn Tân Cương, Tổng Tham mưu trưởng chủ trì, qua đó thể hiện quyết tâm đổi mới mạnh mẽ trong giáo dục, đào tạo.',
    content: `<p>Học viện Quốc phòng tham dự hội nghị trực tuyến toàn quân do Thượng tướng Nguyễn Tân Cương, Tổng Tham mưu trưởng Quân đội nhân dân Việt Nam trực tiếp chủ trì, với hơn 100 điểm cầu trên toàn quốc. Tại hội nghị, Học viện được biểu dương về những thành tích nổi bật trong năm học vừa qua.</p>
<p>Học viện xác định "chất lượng giáo dục trực tiếp quyết định sức chiến đấu của đơn vị". Các sáng kiến trọng tâm bao gồm: hiện đại hóa chương trình và phương pháp giảng dạy, tích hợp công nghệ thông tin và chuyển đổi số, nâng cao trình độ giảng viên về cả chuyên môn lẫn nghiệp vụ sư phạm.</p>
<p>Ban Giám đốc Học viện đặc biệt chú trọng đào tạo thực hành gắn với chiến trường thực tế, đồng thời triển khai phương pháp đánh giá toàn diện nhằm bảo đảm học viên tốt nghiệp thực sự đáp ứng yêu cầu nhiệm vụ trong tình hình mới.</p>
<p>Kết quả đáng tự hào, toàn quân đạt "169 huy chương trong 14 cuộc thi trong nước và quốc tế" trong năm học. Học viện Quốc phòng đóng góp không nhỏ vào thành tích chung đó, đồng thời được ghi nhận là một trong những đơn vị đi đầu về đổi mới phương pháp dạy - học.</p>`,
    coverImage: `${BASE_IMG}/2026/04/16/dsc_9219_20260416061848.jpg`,
    category: 'hoat_dong',
    tags: ['giáo dục', 'đào tạo', 'đổi mới', 'chất lượng', 'toàn quân'],
    isFeatured: true,
    views: 387,
    publishedAt: new Date('2026-04-15T10:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  // ── 2. hoat_dong ──────────────────────────────────────────────────────────
  {
    slug: 'hoc-vien-hau-can-chuc-thanh-cong-hoi-thi-nha-giao-gioi-cap-hoc-vien-nam-2026',
    title: 'Học viện Quốc phòng tổ chức thành công Hội thi Nhà giáo giỏi cấp Học viện năm 2026',
    summary: 'Hội thi Nhà giáo giỏi cấp Học viện năm 2026 kết thúc thành công với nhiều tiết dạy xuất sắc, góp phần quan trọng nâng cao chất lượng đội ngũ giảng viên.',
    content: `<p>Hội thi Nhà giáo giỏi cấp Học viện năm 2026 đã kết thúc thành công tốt đẹp sau nhiều ngày tổ chức sôi nổi và nghiêm túc. Đây là hoạt động thường niên nhằm tôn vinh, phát huy tài năng và sự cống hiến của đội ngũ giảng viên Học viện Quốc phòng.</p>
<p>Hội thi được đánh giá cao về "nội dung được chuẩn bị công phu, hình thức thi đổi mới gắn với chuyển đổi số". Quy trình chấm điểm được thực hiện nghiêm túc, bảo đảm tính khách quan và chính xác. Sáu giảng viên đạt giải nhất, nhì, ba; ba giảng viên được khen thưởng về "thành tích xuất sắc trong hội thi".</p>
<p>Ban Giám đốc Học viện nhấn mạnh đây không chỉ là cuộc thi mà còn là dịp để các giảng viên học hỏi, trao đổi kinh nghiệm, cùng nhau nâng cao năng lực giảng dạy. Kết quả hội thi sẽ là căn cứ quan trọng trong công tác thi đua, khen thưởng và quy hoạch cán bộ giảng dạy của Học viện.</p>`,
    coverImage: `${BASE_IMG}/2026/04/08/1775661854589_20260408222416.png`,
    category: 'hoat_dong',
    tags: ['nhà giáo giỏi', 'hội thi', 'giảng viên', '2026', 'thi đua khen thưởng'],
    isFeatured: false,
    views: 198,
    publishedAt: new Date('2026-04-08T20:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  // ── 3. hop_tac_quoc_te ────────────────────────────────────────────────────
  {
    slug: 'lan-toa-gia-tri-van-hoa-vun-dap-tinh-doan-ket-viet-nam-lao-campuchia',
    title: 'Học viện Quốc phòng lan tỏa giá trị văn hóa, vun đắp tình đoàn kết Việt Nam - Lào - Campuchia',
    summary: 'Nhân dịp Tết cổ truyền của Lào và Campuchia, Học viện Quốc phòng tổ chức buổi gặp mặt ấm cúng cho học viên quốc tế, thể hiện tình cảm và trách nhiệm với học viên nước bạn.',
    content: `<p>Nhân dịp Tết "Bun Pi May" của Lào và "Chol Chnăm Thmây" của Campuchia, Học viện Quốc phòng tổ chức buổi gặp mặt truyền thống cho học viên quốc tế đang theo học tại Học viện. Thiếu tướng Lê Thành Long, Phó Chính ủy Học viện, chủ trì buổi gặp mặt.</p>
<p>Phó Chính ủy nhấn mạnh "tình cảm, trách nhiệm đối với học viên quốc tế là biểu hiện của tình đoàn kết quân sự đặc biệt" giữa ba nước. Từ năm 1962 đến nay, Học viện Quốc phòng đã đào tạo hàng nghìn sĩ quan hậu cần, tài chính cho lực lượng vũ trang Lào và Campuchia, góp phần quan trọng vào sự nghiệp xây dựng và bảo vệ đất nước của nước bạn.</p>
<p>Buổi gặp mặt có phần biểu diễn văn nghệ và lễ tắm nước theo phong tục truyền thống, thể hiện sự tôn trọng và giao thoa văn hóa. Đại diện học viên quốc tế bày tỏ lòng biết ơn chân thành trước sự quan tâm, chăm sóc tận tình của Học viện trong suốt quá trình học tập và sinh hoạt.</p>`,
    coverImage: `${BASE_IMG}/2026/04/13/5_20260413183534.jpg`,
    category: 'hop_tac_quoc_te',
    tags: ['Lào', 'Campuchia', 'đoàn kết quốc tế', 'tết cổ truyền', 'học viên quốc tế'],
    isFeatured: true,
    views: 289,
    publishedAt: new Date('2026-04-13T17:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  // ── 4. truyen_thong ───────────────────────────────────────────────────────
  {
    slug: 'hoc-vien-hau-can-thap-sang-dao-ly-uong-nuoc-nho-nguon-tu-nhung-viec-lam-thiet-thuc',
    title: 'Học viện Quốc phòng thắp sáng đạo lý "Uống nước nhớ nguồn" từ những việc làm thiết thực',
    summary: 'Học viện Quốc phòng trao hỗ trợ tài chính xây dựng "Nhà tình nghĩa" cho thân nhân liệt sĩ, tiếp tục phát huy truyền thống đền ơn đáp nghĩa của quân đội.',
    content: `<p>Sáng ngày 10/4/2026, tại trụ sở Học viện Quốc phòng, lễ trao hỗ trợ tài chính xây dựng "Nhà tình nghĩa" cho bà Phạm Thị Thái, thân nhân liệt sĩ Nguyễn Danh Khoát, đã diễn ra trang trọng và đầy cảm xúc. Học viện trích từ quỹ "Đền ơn đáp nghĩa" số tiền 80 triệu đồng cho công trình này.</p>
<p>Thiếu tướng Lê Thành Long nhấn mạnh "Học viện luôn coi việc thực hiện chính sách hậu phương quân đội là nhiệm vụ chính trị quan trọng", thể hiện trách nhiệm và tấm lòng của tập thể Học viện đối với các gia đình đã có công với cách mạng, với đất nước.</p>
<p>Chính quyền địa phương cam kết phối hợp chặt chẽ, huy động nguồn lực và bảo đảm tiến độ thi công, đồng thời hỗ trợ gia đình ổn định cuộc sống và phát triển kinh tế. Đây là một trong nhiều hoạt động thực tiễn mà Học viện triển khai nhằm lan tỏa đạo lý "Uống nước nhớ nguồn" trong cán bộ, giảng viên, học viên toàn Học viện.</p>`,
    coverImage: `${BASE_IMG}/2026/04/10/1_20260410155214.jpg`,
    category: 'truyen_thong',
    tags: ['đền ơn đáp nghĩa', 'liệt sĩ', 'nhà tình nghĩa', 'truyền thống'],
    isFeatured: false,
    views: 156,
    publishedAt: new Date('2026-04-10T14:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  // ── 5. dao_tao ────────────────────────────────────────────────────────────
  {
    slug: 'chuc-ren-luyen-hanh-quan-duong-dai-ket-hop-mang-vac-nang-cho-hoc-vien',
    title: 'Tổ chức rèn luyện hành quân đường dài kết hợp mang vác nặng cho học viên đào tạo sĩ quan hậu cần',
    summary: 'Tiểu đoàn 1 tổ chức huấn luyện hành quân đường dài kết hợp mang vác nặng cho 95 cán bộ, học viên năm thứ nhất, rèn luyện thể lực và ý chí chiến đấu.',
    content: `<p>Ngày 10/4/2026, Tiểu đoàn 1, Học viện Quốc phòng tổ chức huấn luyện hành quân đường dài kết hợp mang vác nặng với sự tham gia của 95 cán bộ, học viên dưới sự chỉ huy trực tiếp của Đại úy Phạm Văn Hùng, Phó Tiểu đoàn trưởng.</p>
<p>Mục tiêu của bài tập nhằm nâng cao thể lực, tôi luyện ý chí và xây dựng tinh thần kỷ luật. Các học viên duy trì đội hình, thể hiện "sự kiên định và ý chí bền bỉ bất chấp gian khó". Một tiểu đội trưởng chia sẻ trải nghiệm đã giúp anh hiểu hơn về "ý nghĩa của sự đoàn kết và vượt khó", khi sự khích lệ từ chỉ huy và đồng đội là động lực để hoàn thành nhiệm vụ.</p>
<p>Buổi huấn luyện kết thúc an toàn, đạt đầy đủ các mục tiêu đề ra, đóng góp tích cực vào việc nâng cao sức mạnh thể chất và tinh thần của học viên, góp phần xây dựng đơn vị tiểu đoàn vững mạnh toàn diện.</p>`,
    coverImage: `${BASE_IMG}/2026/04/11/1775915195469_20260411204636.png`,
    category: 'dao_tao',
    tags: ['hành quân', 'huấn luyện', 'thể lực', 'tiểu đoàn 1', 'sĩ quan hậu cần'],
    isFeatured: false,
    views: 121,
    publishedAt: new Date('2026-04-11T18:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ── 6. can_bo ─────────────────────────────────────────────────────────────
  {
    slug: 'hoc-vien-hau-can-khao-sat-kiem-tra-cong-tac-thuc-tap-tai-quan-khu-4',
    title: 'Học viện Quốc phòng khảo sát, kiểm tra công tác thực tập tại Quân khu 4',
    summary: 'Đoàn công tác do Đại tá PGS Vũ Hồng Hà dẫn đầu trực tiếp khảo sát, kiểm tra chất lượng thực tập của học viên tại các đơn vị thuộc Quân khu 4.',
    content: `<p>Đoàn công tác của Học viện Quốc phòng do Đại tá PGS Vũ Hồng Hà, Phó Giám đốc Học viện làm Trưởng đoàn, đã trực tiếp đến kiểm tra, khảo sát công tác thực tập của cán bộ, giảng viên và học viên tại các đơn vị chỉ huy quân sự thuộc Quân khu 4.</p>
<p>Kết quả đánh giá ghi nhận "100% học viên có bản lĩnh chính trị vững vàng, ý thức tổ chức kỷ luật tốt". Đoàn cũng chỉ ra một số hạn chế cần khắc phục, trong đó có sự phân bổ thời gian thực tập chưa đều và một số vị trí luân chuyển chưa phù hợp với chuyên ngành đào tạo.</p>
<p>Lãnh đạo Học viện yêu cầu tăng cường phối hợp giữa Học viện và đơn vị tiếp nhận, tạo điều kiện thuận lợi nhất để học viên được thực hành đúng chuyên ngành, nâng cao năng lực thực tiễn đáp ứng yêu cầu nhiệm vụ sau khi ra trường.</p>`,
    coverImage: `${BASE_IMG}/2026/04/14/z7722732232378_a8c737a81499308b9e1556c5535ba188_20260414181215.jpg`,
    category: 'can_bo',
    tags: ['thực tập', 'Quân khu 4', 'kiểm tra', 'cán bộ', 'học viên'],
    isFeatured: false,
    views: 167,
    publishedAt: new Date('2026-04-13T17:30:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  // ── 7. dao_tao ────────────────────────────────────────────────────────────
  {
    slug: 'lam-tot-cong-tac-phoi-hop-giang-day-giua-hoc-vien-hau-can-voi-tong-cuc-hau-can-ky-thuat',
    title: 'Làm tốt công tác phối hợp trong giảng dạy giữa Học viện Quốc phòng với Tổng cục Hậu cần Kỹ thuật',
    summary: 'Buổi giảng chuyên đề do Đại tá Vũ Tiến Hưng trực tiếp truyền đạt đã gắn lý luận với thực tiễn quản lý vận chuyển logistics tại các đơn vị, nhận được phản hồi tích cực từ học viên.',
    content: `<p>Ngày 10/4/2026, Học viện Quốc phòng phối hợp với Tổng cục Hậu cần Kỹ thuật tổ chức buổi giảng chuyên đề do Đại tá Vũ Tiến Hưng trực tiếp truyền đạt cho lớp 103ABCD về quản lý hậu cần quân sự.</p>
<p>Bài giảng tích hợp "thực tiễn quản lý vận chuyển trong logistics ở các đơn vị" với các tình huống thực tế, giúp học viên hình dung rõ ràng trách nhiệm của người sĩ quan trong tổ chức và điều hành vận tải quân sự. Người học tiếp thu được cách ra quyết định, tuân thủ quy trình an toàn và phối hợp liên đơn vị trong thực tế.</p>
<p>Đội ngũ giảng viên Học viện cũng được hưởng lợi từ buổi học, giúp tích hợp những kinh nghiệm thực tiễn quý báu vào thiết kế chương trình giảng dạy, tăng cường kết nối giữa lý thuyết và thực hành trong đào tạo sĩ quan hậu cần.</p>`,
    coverImage: `${BASE_IMG}/2026/04/10/0U1A3620_20260410165617.jpg`,
    category: 'dao_tao',
    tags: ['phối hợp giảng dạy', 'logistics', 'vận chuyển', 'Tổng cục Hậu cần Kỹ thuật'],
    isFeatured: false,
    views: 143,
    publishedAt: new Date('2026-04-10T15:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ── 8. hoat_dong ──────────────────────────────────────────────────────────
  {
    slug: 'hoi-nghi-rut-kinh-nghiem-huan-luyen-xay-dung-chinh-quy-quan-ly-ky-luat-quy-i-2026',
    title: 'Hội nghị rút kinh nghiệm công tác huấn luyện, xây dựng chính quy, quản lý kỷ luật Quý I năm 2026',
    summary: 'Trung tướng Phan Tùng Sơn chủ trì hội nghị đánh giá toàn diện kết quả công tác huấn luyện, xây dựng chính quy, quản lý kỷ luật trong Quý I/2026.',
    content: `<p>Ngày 9/4/2026, Học viện Quốc phòng tổ chức hội nghị rút kinh nghiệm công tác huấn luyện, xây dựng chính quy, quản lý kỷ luật Quý I/2026. Trung tướng, GS.TS Phan Tùng Sơn, Bí thư Đảng ủy, Giám đốc Học viện chủ trì hội nghị.</p>
<p>Văn phòng trình bày báo cáo đánh giá toàn diện về công tác chuẩn bị, triển khai nhiệm vụ, những thành tích đạt được và các tồn tại, hạn chế trong Quý I. Báo cáo xác định rõ các trọng tâm ưu tiên cho hoạt động Quý II sắp tới. Đại biểu tham dự đã thảo luận sôi nổi, "làm rõ những khó khăn, vướng mắc" trong quá trình thực hiện.</p>
<p>Giám đốc Phan Tùng Sơn ghi nhận nỗ lực của toàn Học viện, đồng thời nhấn mạnh sự cần thiết phải phân tích sâu hơn những tồn tại để nâng cao chất lượng công tác, hướng tới kỷ niệm 75 năm ngày truyền thống Học viện một cách xứng đáng.</p>`,
    coverImage: `${BASE_IMG}/2026/04/10/z7707991898536_87fb4968c610380451cf1ddeecfd69f7_20260410160420.jpg`,
    category: 'hoat_dong',
    tags: ['hội nghị', 'huấn luyện', 'chính quy', 'kỷ luật', 'Quý I 2026'],
    isFeatured: false,
    views: 112,
    publishedAt: new Date('2026-04-09T14:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  // ── 9. nghien_cuu ─────────────────────────────────────────────────────────
  {
    slug: 'tri-tue-tap-the-diem-tua-vung-chac-chap-canh-cho-giang-vien-tre',
    title: 'Trí tuệ tập thể: Điểm tựa vững chắc chắp cánh cho giảng viên trẻ phấn đấu hoàn thành xuất sắc nhiệm vụ',
    summary: 'Gương sáng giảng viên trẻ Thượng úy Nguyễn Minh Anh vừa hoàn thành nhiều nhiệm vụ song song, được tập thể Khoa hỗ trợ, góp phần vào thành công của Hội thi báo cáo khoa học cấp Học viện.',
    content: `<p>Câu chuyện về Thượng úy Nguyễn Minh Anh, giảng viên trẻ tại Khoa Công tác Hậu cần Kỹ thuật, là minh chứng sinh động cho tinh thần "trí tuệ tập thể là nền tảng vững chắc, là động lực và niềm tin" để cán bộ trẻ vượt qua thử thách.</p>
<p>Trong thời điểm cùng lúc đảm nhận nhiều nhiệm vụ, Thượng úy Minh Anh chuẩn bị bài tham dự Hội thi báo cáo khoa học cấp Học viện về "những thành tựu kinh tế Việt Nam sau 40 năm đổi mới". Đảng ủy Khoa đã chủ động khuyến khích, hướng dẫn và tổ chức đóng góp ý kiến tập thể cho bản báo cáo, giúp nâng cao chất lượng đáng kể.</p>
<p>Sự hỗ trợ của đồng nghiệp có kinh nghiệm đã giúp bài báo cáo được hoàn thiện từng chi tiết, từ lập luận khoa học đến cách trình bày. Kết quả, tham luận đạt kết quả tốt, góp phần vào thành tích nghiên cứu khoa học của Khoa và Học viện trong năm 2026.</p>`,
    coverImage: `${BASE_IMG}/2026/04/09/1775710274337_20260409115115.png`,
    category: 'nghien_cuu',
    tags: ['giảng viên trẻ', 'nghiên cứu khoa học', 'hội thi', 'tập thể', 'báo cáo khoa học'],
    isFeatured: false,
    views: 98,
    publishedAt: new Date('2026-04-09T10:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ── 10. dao_tao ───────────────────────────────────────────────────────────
  {
    slug: 'trien-khai-cong-tac-nghiep-vu-huong-toi-tuyen-sinh-nam-hoc-2026-2027',
    title: 'Triển khai công tác nghiệp vụ, hướng tới kỳ tuyển sinh năm học 2026-2027 đạt kết quả tốt',
    summary: 'Hội đồng Tuyển sinh Học viện Quốc phòng tổ chức hội nghị giao nhiệm vụ cho ban thư ký và các hội đồng phúc khảo, bảo đảm kỳ tuyển sinh 2026-2027 diễn ra nghiêm túc, chính xác.',
    content: `<p>Ngày 2/2, Hội đồng Tuyển sinh Học viện tổ chức hội nghị triển khai công tác nghiệp vụ, giao nhiệm vụ cho ban thư ký và các hội đồng phúc khảo chuyên ngành. Thiếu tướng Nguyễn Quang Dũng, Phó Giám đốc Học viện, Chủ tịch Hội đồng trực tiếp chủ trì.</p>
<p>Số lượng hồ sơ đăng ký dự tuyển tăng khoảng 114% so với năm 2025, phản ánh sự quan tâm ngày càng lớn của thí sinh và gia đình đối với Học viện Quốc phòng và các trường quân đội nói chung. Ban thư ký báo cáo tiến độ xét hồ sơ, dự kiến hoàn thành trước ngày 4/5/2026, sau đó thông báo kết quả cho các hội đồng tuyển sinh quân sự tỉnh, thành phố trước ngày 6/5/2026.</p>
<p>Lãnh đạo Học viện yêu cầu giữ vững quy trình nghiêm túc, khách quan dù áp lực công việc tăng cao. Sự phối hợp nhịp nhàng giữa các bộ phận là yếu tố quyết định để kỳ tuyển sinh diễn ra thành công, bảo đảm tuyển chọn được những học viên xứng đáng nhất vào đội ngũ sĩ quan hậu cần tương lai.</p>`,
    coverImage: `${BASE_IMG}/2026/04/23/1776959651601_20260423225412.png`,
    category: 'dao_tao',
    tags: ['tuyển sinh', '2026-2027', 'hội đồng tuyển sinh', 'nghiệp vụ'],
    isFeatured: false,
    views: 276,
    publishedAt: new Date('2026-04-23T20:00:00Z'),
    authorId: AUTHOR_ADMIN,
  },
]

async function main() {
  console.log('📰 seed-news-batch2.ts — thêm 10 bài tin tức mới...')

  let created = 0
  let skipped = 0

  for (const news of newsData) {
    const existing = await db.news.findUnique({ where: { slug: news.slug } })
    if (existing) {
      console.log(`  ⏭  Bỏ qua (đã tồn tại): ${news.slug}`)
      skipped++
      continue
    }

    await db.news.create({
      data: { ...news, isPublished: true },
    })
    console.log(`  ✅ Đã tạo: ${news.title.substring(0, 60)}...`)
    created++
  }

  console.log(`\n🎉 Hoàn tất! Đã tạo ${created} bài mới, bỏ qua ${skipped} bài đã có.`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
