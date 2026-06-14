/**
 * seed-news-ntqs.ts — Tạp chí Nghệ thuật Quân sự Việt Nam
 *
 * Seed đầy đủ tin tức theo 9 chuyên mục NTQS để demo:
 *   1. chien_luoc_quan_su  — Chiến lược quân sự
 *   2. nghe_thuat_tac_chien — Nghệ thuật tác chiến
 *   3. chien_dich_hoc      — Chiến dịch học
 *   4. chien_thuat_hoc     — Chiến thuật học
 *   5. lich_su_quan_su     — Lịch sử quân sự
 *   6. khoa_hoc_quan_su    — Khoa học quân sự
 *   7. giao_duc_quan_su    — Giáo dục quân sự
 *   8. hop_tac_quoc_phong  — Hợp tác quốc phòng
 *   9. tin_tuc_hoc_vien    — Tin tức Học viện
 *
 * Nguồn tham khảo: nda.edu.vn, tapchiqptd.vn, btllang.bqp.vn
 * Idempotent — upsert by slug, KHÔNG xóa dữ liệu cũ.
 * Run: npx tsx --require dotenv/config prisma/seed-news-ntqs.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// User IDs từ DB NTQS
const AUTHOR_EIC     = '5f0d5a6c-8d9f-4c41-bd67-be267321efb8' // Tổng Biên Tập (Đại tá TS Lê Ngọc Bảo)
const AUTHOR_EDITOR  = 'd8acef00-a8a1-4100-926c-7311a38613a2' // Biên Tập Chính (MANAGING_EDITOR)
const AUTHOR_SECTION = 'c170cc99-1ae9-406e-9435-ef22f74ce9a1' // Biên Tập Chuyên Mục (SECTION_EDITOR)
const AUTHOR_ADMIN   = '0d608540-2174-4fd7-8628-23ecfd94bc69' // Quản trị viên hệ thống

// Ảnh thực tế Học viện Quốc phòng
const IMG = {
  chien_luoc:  '/images/hvqp/hvqp-01.jpg', // Hội nghị cán bộ quân sự HVQP
  tac_chien:   '/images/hvqp/hvqp-02.jpg', // Hội nghị thông qua ý định diễn tập MN-26
  chien_dich:  '/images/hvqp/hvqp-02.jpg', // Hội nghị thông qua ý định diễn tập MN-26
  chien_thuat: '/images/hvqp/hvqp-02.jpg', // Hội nghị thông qua ý định diễn tập MN-26
  lich_su:     '/images/hvqp/hvqp-04.jpg', // Đoàn HVQP tại Lai Châu — toàn cảnh buổi lễ
  khoa_hoc:    '/images/hvqp/hvqp-01.jpg', // Hội nghị cán bộ quân sự HVQP
  giao_duc:    '/images/hvqp/hvqp-03.jpg', // Đoàn HVQP Khóa 101 thăm xã Sin Suối Hồ
  hop_tac:     '/images/hvqp/hvqp-06.jpg', // Trao quà đồng bào dân tộc — dân vận HVQP
  hoc_vien:    '/images/hvqp/hvqp-05.jpg', // Phát biểu tại lễ đón đoàn HVQP Lai Châu
}

const newsData = [

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 1: CHIẾN LƯỢC QUÂN SỰ
  // ═══════════════════════════════════════════════════════

  {
    slug: 'phat-trien-nghe-thuat-quan-su-viet-nam-trong-ky-nguyen-moi',
    title: 'Phát triển nghệ thuật quân sự Việt Nam trong kỷ nguyên mới',
    summary: 'Bài viết phân tích sự cần thiết phải phát triển nghệ thuật quân sự Việt Nam đáp ứng yêu cầu bảo vệ Tổ quốc trong bối cảnh chiến tranh hiện đại, đặc biệt là chiến tranh công nghệ cao.',
    content: `<p>Theo Từ điển Bách khoa Quân sự Việt Nam, "nghệ thuật quân sự" là lý luận và thực tiễn chuẩn bị và thực hành chiến tranh, chủ yếu là đấu tranh vũ trang, gồm chiến lược quân sự, nghệ thuật chiến dịch và chiến thuật. Trong kỷ nguyên mới, sự phát triển của công nghệ, đặc biệt là vũ khí thông minh, phương tiện bay không người lái, tác chiến điện tử và chiến tranh mạng đòi hỏi nghệ thuật quân sự Việt Nam phải được phát triển vượt bậc.</p>

<p>Lịch sử dân tộc Việt Nam đã ghi lại hàng nghìn năm đấu tranh vũ trang bảo vệ đất nước. Từ các cuộc kháng chiến chống giặc Tần (thế kỷ III TCN) đến chiến thắng Bạch Đằng của Trần Hưng Đạo năm 1288, từ chiến thắng Ngọc Hồi - Đống Đa của Nguyễn Huệ năm 1789 đến Điện Biên Phủ năm 1954 và đại thắng mùa Xuân 1975, mỗi trang sử đều khắc ghi những thành tựu nghệ thuật quân sự đặc sắc của dân tộc.</p>

<p>Trong bối cảnh hiện nay, Học viện Quốc phòng xác định nhiệm vụ nghiên cứu, cập nhật và phát triển lý luận nghệ thuật quân sự phải đi trước một bước, đón đầu các hình thái chiến tranh mới. Các đề tài nghiên cứu tập trung vào: (1) Nghiên cứu chiến tranh phi tiếp xúc và vũ khí chính xác cao; (2) Tác chiến trong môi trường đa lĩnh vực; (3) Chiến tranh thông tin, mạng và tâm lý; (4) Bảo vệ không gian mạng và vũ trụ như các lĩnh vực tác chiến mới.</p>

<p>Bộ Quốc phòng đã chỉ đạo Học viện Quốc phòng chủ trì nghiên cứu, hệ thống hóa các đề tài gắn với nghiên cứu, cụ thể hóa các hình thái chiến tranh, loại hình tác chiến chiến lược mới. Kết quả nghiên cứu sẽ là cơ sở để cập nhật, bổ sung vào hệ thống giáo trình đào tạo sĩ quan cấp chiến dịch chiến lược của Quân đội nhân dân Việt Nam.</p>

<p>Việt Nam kiên định đường lối quốc phòng "bốn không": không tham gia liên minh quân sự; không cho nước ngoài đặt căn cứ quân sự hoặc sử dụng lãnh thổ Việt Nam để chống lại nước khác; không liên kết với nước này để chống nước kia; không dùng vũ lực hoặc đe dọa dùng vũ lực trong quan hệ quốc tế. Nghệ thuật quân sự Việt Nam phát triển trong khuôn khổ đó, lấy chính nghĩa và thế trận lòng dân làm nền tảng.</p>`,
    coverImage: IMG.chien_luoc,
    category: 'chien_luoc_quan_su',
    tags: ['chiến lược quân sự', 'nghệ thuật quân sự', 'bảo vệ Tổ quốc', 'chiến tranh hiện đại', 'kỷ nguyên mới'],
    isFeatured: true,
    views: 1247,
    publishedAt: new Date('2025-03-15T08:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'chien-luoc-quoc-phong-toan-dan-trong-tinh-hinh-moi',
    title: 'Chiến lược quốc phòng toàn dân trong tình hình mới: Lý luận và thực tiễn',
    summary: 'Phân tích sự phát triển của chiến lược quốc phòng toàn dân Việt Nam trong bối cảnh địa chính trị khu vực có nhiều biến động, nhấn mạnh vai trò của sức mạnh tổng hợp quốc gia.',
    content: `<p>Chiến lược quốc phòng toàn dân là một trong những di sản lý luận quân sự quý báu nhất của Quân đội nhân dân Việt Nam. Ra đời và được hun đúc qua hai cuộc kháng chiến vĩ đại chống Pháp và chống Mỹ, chiến lược này ngày càng được hoàn thiện và phát triển đáp ứng yêu cầu bảo vệ Tổ quốc trong tình hình mới.</p>

<p>Nội hàm của chiến lược quốc phòng toàn dân bao gồm: huy động toàn bộ sức mạnh của đất nước — chính trị, quân sự, kinh tế, ngoại giao, văn hóa, khoa học công nghệ — vào nhiệm vụ bảo vệ Tổ quốc; xây dựng thế trận quốc phòng toàn dân gắn với thế trận an ninh nhân dân; kết hợp chặt chẽ phát triển kinh tế - xã hội với củng cố quốc phòng - an ninh.</p>

<p>Trong tình hình hiện nay, Đảng và Nhà nước tiếp tục nhấn mạnh quan điểm: "Bảo vệ Tổ quốc từ sớm, từ xa, từ khi nước chưa nguy." Điều này đòi hỏi xây dựng lực lượng vũ trang nhân dân cách mạng, chính quy, tinh nhuệ, từng bước hiện đại, có sức chiến đấu cao. Đồng thời phải xây dựng hậu phương vững chắc, khu vực phòng thủ địa phương vững mạnh, bảo đảm độc lập, chủ quyền, toàn vẹn lãnh thổ trong mọi tình huống.</p>

<p>Những thách thức mới đặt ra đối với chiến lược quốc phòng toàn dân bao gồm: tranh chấp chủ quyền biển đảo; hoạt động của các thế lực thù địch lợi dụng internet và mạng xã hội; nguy cơ "diễn biến hòa bình"; khủng bố và tội phạm xuyên quốc gia. Đây đòi hỏi sự phối hợp đồng bộ giữa Quân đội nhân dân và Công an nhân dân cùng toàn hệ thống chính trị.</p>`,
    coverImage: IMG.chien_luoc,
    category: 'chien_luoc_quan_su',
    tags: ['quốc phòng toàn dân', 'chiến lược', 'bảo vệ Tổ quốc', 'sức mạnh tổng hợp'],
    isFeatured: false,
    views: 892,
    publishedAt: new Date('2025-04-10T09:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'xu-ly-mau-thuan-trong-bao-ve-to-quoc-tren-bien-dong',
    title: 'Xử lý mâu thuẫn trong bảo vệ Tổ quốc trên Biển Đông: Quan điểm chiến lược',
    summary: 'Bài viết trình bày quan điểm chiến lược về bảo vệ chủ quyền biển đảo Việt Nam, nhấn mạnh nguyên tắc kết hợp đấu tranh pháp lý, ngoại giao với sẵn sàng chiến đấu bảo vệ chủ quyền.',
    content: `<p>Biển Đông với vị trí địa chiến lược quan trọng là tuyến đường hàng hải quốc tế bận rộn thứ hai thế giới, nơi diễn ra các tranh chấp chủ quyền phức tạp giữa nhiều quốc gia. Đối với Việt Nam, bảo vệ chủ quyền biển đảo không chỉ là vấn đề pháp lý quốc tế mà còn là nghĩa vụ thiêng liêng với tiền nhân và thế hệ tương lai.</p>

<p>Chủ trương nhất quán của Đảng và Nhà nước là: Kiên quyết, kiên trì bảo vệ chủ quyền, quyền chủ quyền và quyền tài phán trên Biển Đông trên cơ sở luật pháp quốc tế, nhất là Công ước Liên hợp quốc về Luật Biển năm 1982 (UNCLOS). Đồng thời duy trì môi trường hòa bình, ổn định để phát triển kinh tế và hội nhập quốc tế.</p>

<p>Từ góc độ quân sự chiến lược, bảo vệ chủ quyền biển đảo đòi hỏi: Xây dựng lực lượng hải quân nhân dân đủ mạnh với phương tiện hiện đại; phát triển lực lượng cảnh sát biển và kiểm ngư; kết hợp chặt chẽ giữa lực lượng vũ trang và ngư dân — lực lượng bám biển trực tiếp; đẩy mạnh hợp tác quốc phòng song phương và đa phương trong khuôn khổ ASEAN và cơ chế quốc tế.</p>

<p>Bài học kinh nghiệm từ lịch sử cho thấy: Bảo vệ chủ quyền biển đảo thành công đòi hỏi sức mạnh tổng hợp, không thể chỉ trông cậy vào sức mạnh quân sự đơn thuần. Kết hợp giữa đấu tranh pháp lý - ngoại giao - dư luận quốc tế với thực lực quân sự đủ mạnh là phương thức hiệu quả nhất trong điều kiện hiện nay.</p>`,
    coverImage: IMG.chien_luoc,
    category: 'chien_luoc_quan_su',
    tags: ['Biển Đông', 'chủ quyền biển đảo', 'chiến lược biển', 'UNCLOS'],
    isFeatured: true,
    views: 1089,
    publishedAt: new Date('2025-05-20T08:30:00Z'),
    authorId: AUTHOR_EIC,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 2: NGHỆ THUẬT TÁC CHIẾN
  // ═══════════════════════════════════════════════════════

  {
    slug: 'nghe-thuat-tac-chien-da-mien-trong-chien-tranh-hien-dai',
    title: 'Nghệ thuật tác chiến đa miền trong chiến tranh hiện đại: Nhận thức và vận dụng',
    summary: 'Phân tích khái niệm tác chiến đa miền (Multi-Domain Operations), đặc điểm của chiến tranh thế hệ thứ 5 và những yêu cầu đặt ra đối với nghệ thuật tác chiến của Quân đội nhân dân Việt Nam.',
    content: `<p>Chiến tranh hiện đại không còn diễn ra đơn thuần trên các chiến trường truyền thống (lục địa, biển, không trung) mà đã mở rộng sang các lĩnh vực tác chiến mới: không gian mạng (cyber space), vũ trụ (space), lĩnh vực thông tin - tâm lý - nhận thức. Học thuyết tác chiến đa miền (Multi-Domain Operations - MDO) phản ánh sự thay đổi căn bản này trong tư duy quân sự hiện đại.</p>

<p>Tác chiến đa miền đòi hỏi sự phối hợp đồng bộ và linh hoạt giữa các lực lượng hoạt động trên tất cả các lĩnh vực cùng một lúc, tạo ra những lợi thế bất đối xứng trước đối phương. Đặc điểm nổi bật bao gồm: tốc độ ra quyết định cực nhanh nhờ trí tuệ nhân tạo và dữ liệu lớn; khả năng tác động đồng thời vào nhiều lĩnh vực; làm suy yếu ý chí chiến đấu và khả năng chỉ huy của đối phương từ trước khi xung đột vũ trang nổ ra.</p>

<p>Đối với Quân đội nhân dân Việt Nam, việc nghiên cứu, nắm vững lý luận tác chiến đa miền là yêu cầu cấp bách nhằm xây dựng khả năng đối phó và tận dụng các cơ hội mà chiến tranh thế hệ mới mang lại. Học viện Quốc phòng đã đưa vào chương trình đào tạo các chuyên đề về tác chiến điện tử, chiến tranh mạng, chiến tranh tâm lý và bảo vệ không gian mạng quốc gia.</p>

<p>Nghệ thuật tác chiến đa miền đặt ra yêu cầu mới đối với việc đào tạo sĩ quan cấp chiến lược: phải am hiểu công nghệ, thông thạo tác chiến điện tử và mạng, có tư duy hệ thống và khả năng ra quyết định nhanh trong môi trường thông tin bão hòa và bất định cao.</p>`,
    coverImage: IMG.tac_chien,
    category: 'nghe_thuat_tac_chien',
    tags: ['tác chiến đa miền', 'chiến tranh hiện đại', 'công nghệ quân sự', 'tác chiến điện tử'],
    isFeatured: true,
    views: 986,
    publishedAt: new Date('2025-02-18T09:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'nguyen-tac-co-ban-cua-nghe-thuat-tac-chien-viet-nam',
    title: 'Những nguyên tắc cơ bản của nghệ thuật tác chiến Việt Nam qua các thời kỳ',
    summary: 'Hệ thống hóa những nguyên tắc cơ bản của nghệ thuật tác chiến Việt Nam từ truyền thống đến hiện đại: tập trung binh lực, bí mật bất ngờ, chủ động tấn công, phát huy sức mạnh tổng hợp.',
    content: `<p>Qua hàng nghìn năm đấu tranh vũ trang bảo vệ đất nước, cha ông ta đã đúc kết ra những nguyên tắc cơ bản của nghệ thuật tác chiến mang đậm bản sắc dân tộc và đã được kiểm chứng qua thực tiễn chiến đấu.</p>

<p><strong>Nguyên tắc 1: Chủ động tấn công, giành và giữ thế chủ động chiến lược.</strong> Lịch sử quân sự Việt Nam cho thấy: ai giành được thế chủ động sẽ chiến thắng, ai bị động đối phó sẽ thất bại. Từ trận Chi Lăng - Xương Giang của Lê Lợi đến chiến dịch Hồ Chí Minh, nguyên tắc này luôn được quán triệt và vận dụng sáng tạo.</p>

<p><strong>Nguyên tắc 2: Tập trung binh lực vào hướng chủ yếu, tạo ưu thế áp đảo cục bộ.</strong> Trong điều kiện lực lượng không cân bằng, cha ông ta biết cách tập trung lực lượng, tạo ưu thế quyết định ở điểm và thời điểm then chốt, sau đó chuyển sang hướng khác. Đây là "lấy ít thắng nhiều" của quân sự Việt Nam.</p>

<p><strong>Nguyên tắc 3: Bí mật, bất ngờ, thần tốc.</strong> Kết hợp nhuần nhuyễn giữa nghi binh, lừa địch với tiến công bất ngờ, táo bạo, thần tốc là đặc điểm nổi bật của nghệ thuật tác chiến Việt Nam. Chiến dịch Điện Biên Phủ và chiến dịch Hồ Chí Minh là minh chứng sáng ngời.</p>

<p><strong>Nguyên tắc 4: Phát huy sức mạnh tổng hợp, kết hợp chặt chẽ các lực lượng.</strong> Chiến tranh nhân dân Việt Nam vận dụng tối đa mọi nguồn lực của dân tộc: quân sự - chính trị - kinh tế - ngoại giao - văn hóa, tạo nên sức mạnh tổng hợp vượt trội so với bất kỳ đối thủ nào.</p>

<p>Trong thời đại công nghệ, những nguyên tắc này không hề lỗi thời mà cần được vận dụng sáng tạo trong điều kiện mới. Tốc độ quyết định được tăng cường nhờ công nghệ; bí mật bất ngờ có thêm chiều không gian mạng; tập trung lực lượng bao gồm cả lực lượng không gian mạng và tác chiến điện tử.</p>`,
    coverImage: IMG.tac_chien,
    category: 'nghe_thuat_tac_chien',
    tags: ['nguyên tắc tác chiến', 'nghệ thuật quân sự truyền thống', 'chiến thuật', 'lịch sử quân sự'],
    isFeatured: false,
    views: 743,
    publishedAt: new Date('2025-03-25T10:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 3: CHIẾN DỊCH HỌC
  // ═══════════════════════════════════════════════════════

  {
    slug: 'chien-dich-ho-chi-minh-dinh-cao-nghe-thuat-quan-su',
    title: 'Chiến dịch Hồ Chí Minh: Đỉnh cao nghệ thuật quân sự, cội nguồn sức mạnh toàn thắng',
    summary: 'Nghiên cứu chiến dịch Hồ Chí Minh (26/4 - 30/4/1975) - chiến dịch tổng tiến công và nổi dậy lớn nhất trong lịch sử quân sự Việt Nam, thể hiện đỉnh cao của nghệ thuật chiến dịch.',
    content: `<p>Chiến dịch Hồ Chí Minh (26/4 - 30/4/1975) là đỉnh cao của nghệ thuật quân sự Việt Nam trong thế kỷ XX. Đây là chiến dịch tổng tiến công và nổi dậy lớn nhất trong lịch sử, với quy mô 5 hướng tiến công đồng loạt vào Sài Gòn, kết hợp với nổi dậy của quần chúng nhân dân, giải phóng hoàn toàn miền Nam trong 55 ngày đêm.</p>

<p>Về nghệ thuật chiến dịch, có thể thấy những thành công nổi bật: Thứ nhất, tư tưởng chỉ đạo "thần tốc, táo bạo, bất ngờ, chắc thắng" được quán triệt từ cấp cao nhất đến người lính trực tiếp chiến đấu. Thứ hai, lần đầu tiên trong lịch sử, chúng ta huy động một lực lượng lớn với đầy đủ binh chủng hợp thành: bộ binh, xe tăng thiết giáp, pháo binh, đặc công, tên lửa phòng không, không quân — tác chiến đồng loạt, hiệp đồng chặt chẽ. Thứ ba, kết hợp hoàn hảo giữa tiến công quân sự với nổi dậy của quần chúng ở đô thị.</p>

<p>Nghệ thuật chọn thời cơ chiến lược là một trong những bài học quý giá nhất. Sau chiến dịch Tây Nguyên và giải phóng Đà Nẵng, Bộ Chính trị và Bộ Tổng Tư lệnh đã quyết đoán: kéo dài thời gian giải phóng miền Nam từ 2 năm xuống còn 2 tháng. Quyết định lịch sử đó thể hiện sự nhạy bén chiến lược hiếm có, không để đối phương có thời gian củng cố và tìm kiếm giải pháp ngoại giao bất lợi.</p>

<p>Bài học từ chiến dịch Hồ Chí Minh về nghệ thuật tổ chức lực lượng, chỉ huy hiệp đồng binh chủng, tạo thế và thời cơ chiến lược vẫn còn nguyên giá trị trong đào tạo sĩ quan cấp chiến dịch chiến lược hôm nay.</p>`,
    coverImage: IMG.chien_dich,
    category: 'chien_dich_hoc',
    tags: ['chiến dịch Hồ Chí Minh', '30/4/1975', 'giải phóng miền Nam', 'nghệ thuật chiến dịch'],
    isFeatured: true,
    views: 2156,
    publishedAt: new Date('2025-04-25T07:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'chien-dich-dien-bien-phu-bieu-tuong-nghe-thuat-chien-dich-viet-nam',
    title: 'Chiến dịch Điện Biên Phủ — Biểu tượng của nghệ thuật chiến dịch Việt Nam',
    summary: 'Phân tích nghệ thuật chiến dịch trong chiến thắng Điện Biên Phủ (1954), đặc biệt là quyết định thay đổi phương châm từ "đánh nhanh thắng nhanh" sang "đánh chắc tiến chắc" — một bước ngoặt lịch sử.',
    content: `<p>Chiến thắng Điện Biên Phủ (7/5/1954) là một trong những trang sử vàng chói lọi nhất trong lịch sử quân sự Việt Nam và thế giới. Đây là lần đầu tiên trong lịch sử, một đội quân châu Á đã đánh bại hoàn toàn một lực lượng quân sự châu Âu trong một chiến dịch tiến công có quy mô lớn.</p>

<p>Điểm sáng nghệ thuật chiến dịch đặc sắc nhất là quyết định thay đổi phương châm tác chiến ngay khi chuẩn bị gần xong. Trước sức mạnh phòng thủ của địch được tăng cường đột biến, Đại tướng Võ Nguyên Giáp đã có quyết định lịch sử: thay đổi từ "đánh nhanh thắng nhanh" sang "đánh chắc tiến chắc" — kéo dài chiến dịch lên 56 ngày thay vì 3 ngày. Đây là biểu hiện cao nhất của sự linh hoạt và dũng cảm trong chỉ huy chiến dịch.</p>

<p>Về nghệ thuật hậu cần chiến dịch, Điện Biên Phủ đặt ra những thách thức chưa từng có: vận chuyển hàng chục nghìn tấn lương thực, đạn dược, khí tài vượt hàng trăm kilômét đường rừng núi hiểm trở, bị ném bom chặn đường liên tục. Hàng vạn dân công tải đạn, thồ lương thực, kéo pháo bằng tay đã tạo nên kỳ tích hậu cần mà thế giới chưa từng thấy.</p>

<p>Bài học về nghệ thuật bao vây, kéo dài chiến dịch, làm kiệt sức đối phương; về nghệ thuật hậu cần chiến dịch trong điều kiện bị phong tỏa; về tổ chức hiệp đồng giữa pháo binh, bộ binh và công binh; về duy trì tinh thần chiến đấu trong điều kiện gian khổ kéo dài — tất cả đều là di sản quý báu cho nền khoa học quân sự Việt Nam.</p>`,
    coverImage: IMG.chien_dich,
    category: 'chien_dich_hoc',
    tags: ['Điện Biên Phủ', 'chiến dịch', 'Võ Nguyên Giáp', 'lịch sử quân sự', '1954'],
    isFeatured: false,
    views: 1834,
    publishedAt: new Date('2025-05-07T07:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'ly-luan-chien-dich-trong-chien-tranh-bao-ve-to-quoc',
    title: 'Lý luận chiến dịch trong chiến tranh bảo vệ Tổ quốc: Những vấn đề cần tiếp tục nghiên cứu',
    summary: 'Bài viết xác định những nội dung cần tiếp tục nghiên cứu, bổ sung trong lý luận chiến dịch Việt Nam nhằm đáp ứng yêu cầu chiến tranh bảo vệ Tổ quốc trong điều kiện hiện đại.',
    content: `<p>Lý luận chiến dịch là bộ phận trung tâm của nghệ thuật quân sự Việt Nam, chứa đựng những tri thức khoa học về tổ chức, chuẩn bị, thực hành chiến dịch trong các điều kiện cụ thể. Sau nhiều thập kỷ được hình thành và phát triển qua thực tiễn chiến đấu, hệ thống lý luận chiến dịch của chúng ta đang đứng trước yêu cầu phải được cập nhật và phát triển để đáp ứng thực tiễn chiến tranh hiện đại.</p>

<p>Những vấn đề cốt lõi cần tiếp tục nghiên cứu bao gồm: Thứ nhất, lý luận về chiến dịch trong điều kiện vũ khí công nghệ cao — đối phương có thể tấn công chính xác từ khoảng cách hàng trăm đến hàng nghìn kilômét mà không cần tiếp xúc trực tiếp. Thứ hai, lý luận về chiến dịch phòng thủ tổng hợp — kết hợp phòng thủ quân sự với bảo vệ không gian mạng, tác chiến điện tử, chống tình báo chiến lược. Thứ ba, lý luận về tổ chức hậu cần chiến dịch trong điều kiện bị phong tỏa, đứt gãy chuỗi cung ứng.</p>

<p>Học viện Quốc phòng đã và đang triển khai nhiều đề tài nghiên cứu cấp Bộ Quốc phòng về những vấn đề trên. Kết quả nghiên cứu được cập nhật vào giáo trình đào tạo và phục vụ trực tiếp cho công tác xây dựng kế hoạch phòng thủ quốc gia.</p>`,
    coverImage: IMG.chien_dich,
    category: 'chien_dich_hoc',
    tags: ['lý luận chiến dịch', 'chiến tranh bảo vệ Tổ quốc', 'nghiên cứu quân sự', 'Học viện Quốc phòng'],
    isFeatured: false,
    views: 567,
    publishedAt: new Date('2025-06-15T10:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 4: CHIẾN THUẬT HỌC
  // ═══════════════════════════════════════════════════════

  {
    slug: 'chien-thuat-trong-moi-truong-do-thi-kinh-nghiem-va-bai-hoc',
    title: 'Chiến thuật trong môi trường đô thị: Kinh nghiệm thế giới và bài học cho Việt Nam',
    summary: 'Phân tích đặc điểm tác chiến trong môi trường đô thị, rút ra kinh nghiệm từ các cuộc xung đột đương đại và bài học vận dụng cho lực lượng vũ trang nhân dân Việt Nam.',
    content: `<p>Chiến tranh đô thị (Urban Warfare) đang trở thành hình thức tác chiến phổ biến trong các cuộc xung đột đương đại. Đặc điểm của môi trường đô thị — mật độ dân cư cao, công trình kiến trúc dày đặc, hệ thống ngầm phức tạp — tạo ra những thách thức chiến thuật đặc thù mà lực lượng vũ trang nào cũng phải chuẩn bị đối phó.</p>

<p>Kinh nghiệm từ các cuộc xung đột đương đại chỉ ra: Thứ nhất, ưu thế hỏa lực và công nghệ có thể bị vô hiệu hóa phần lớn trong môi trường đô thị. Thứ hai, tổn thất thường cao hơn nhiều so với tác chiến trên địa hình bằng phẳng. Thứ ba, vấn đề dân thường và thiệt hại dân sự tạo ra áp lực dư luận khổng lồ. Thứ tư, tác chiến đô thị kéo dài đòi hỏi hậu cần cực kỳ phức tạp và chu đáo.</p>

<p>Đối với Việt Nam, chiến thuật đô thị có những đặc thù riêng. Trong lịch sử, Tết Mậu Thân 1968 là bài học kinh điển về tấn công đô thị kết hợp nổi dậy quần chúng. Trong điều kiện hiện nay, cần nghiên cứu cách thức bảo vệ các thành phố lớn — trung tâm kinh tế - chính trị của đất nước — trong điều kiện bị tiến công bằng vũ khí chính xác cao từ xa và lực lượng đặc biệt.</p>

<p>Học viện Quốc phòng đã đưa vào chương trình đào tạo các bài học về chiến thuật đô thị, kết hợp nghiên cứu lý luận với thực hành trên mô hình và thực địa. Điều này giúp sĩ quan được đào tạo có khả năng tổ chức và chỉ huy tác chiến hiệu quả trong môi trường đô thị hiện đại.</p>`,
    coverImage: IMG.chien_thuat,
    category: 'chien_thuat_hoc',
    tags: ['chiến thuật đô thị', 'tác chiến đô thị', 'kinh nghiệm quân sự', 'chiến thuật'],
    isFeatured: false,
    views: 654,
    publishedAt: new Date('2025-01-20T09:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'van-dung-kien-thuc-chien-thuat-trong-huan-luyen-quan-doi',
    title: 'Vận dụng kiến thức chiến thuật trong huấn luyện quân đội hiện đại',
    summary: 'Bài viết trình bày phương pháp tích hợp lý thuyết chiến thuật vào thực hành huấn luyện, nâng cao năng lực tác chiến của lực lượng vũ trang trong điều kiện chiến trường hiện đại.',
    content: `<p>Chiến thuật học là môn khoa học quân sự nghiên cứu các nguyên tắc và phương pháp tổ chức, chuẩn bị, thực hành tác chiến của các đơn vị cấp chiến thuật (từ phân đội đến sư đoàn). Việc truyền đạt và vận dụng kiến thức chiến thuật trong huấn luyện hiện đại đòi hỏi phương pháp sư phạm tiên tiến, kết hợp lý thuyết với thực hành.</p>

<p>Các phương pháp huấn luyện chiến thuật hiện đại bao gồm: Sử dụng bản đồ số và GIS quân sự để mô phỏng địa hình; ứng dụng thực tế ảo (VR) để trải nghiệm môi trường chiến đấu; diễn tập dã ngoại thực địa với đánh giá khách quan bằng công nghệ; bài tập phân tích tình huống (wargaming) theo phương pháp hiện đại.</p>

<p>Kinh nghiệm từ các học viện quân sự tiên tiến trên thế giới cho thấy: hiệu quả huấn luyện chiến thuật tăng mạnh khi học viên được đặt vào tình huống thực tế phức tạp, phải ra quyết định dưới áp lực thời gian và thông tin không đầy đủ — đúng như điều kiện chiến đấu thật sự. Học viện Quốc phòng đang từng bước đổi mới phương pháp huấn luyện theo hướng này.</p>`,
    coverImage: IMG.chien_thuat,
    category: 'chien_thuat_hoc',
    tags: ['chiến thuật học', 'huấn luyện quân đội', 'phương pháp giảng dạy', 'tác chiến hiện đại'],
    isFeatured: false,
    views: 423,
    publishedAt: new Date('2025-04-05T10:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 5: LỊCH SỬ QUÂN SỰ
  // ═══════════════════════════════════════════════════════

  {
    slug: 'tran-bach-dang-1288-dinh-cao-nghe-thuat-quan-su-tran-hung-dao',
    title: 'Trận Bạch Đằng năm 1288 — Đỉnh cao nghệ thuật quân sự của Trần Hưng Đạo',
    summary: 'Phân tích nghệ thuật quân sự thiên tài của Quốc công Tiết chế Hưng Đạo Đại Vương Trần Quốc Tuấn trong trận Bạch Đằng năm 1288, lần thứ ba đánh bại quân Nguyên-Mông.',
    content: `<p>Trận Bạch Đằng năm 1288 là một trong những chiến thắng quân sự vĩ đại nhất trong lịch sử Việt Nam và châu Á, đánh dấu sự thất bại lần cuối cùng của đế chế Nguyên-Mông hùng mạnh bậc nhất thế giới thời bấy giờ trước sức mạnh quân sự và trí tuệ quân sự Đại Việt.</p>

<p>Chiến thắng Bạch Đằng được Trần Hưng Đạo chuẩn bị và thực hiện với nghệ thuật quân sự bậc thầy: Thứ nhất, nghệ thuật lựa chọn địa bàn tác chiến — chọn sông Bạch Đằng, nơi thủy triều lên xuống mạnh, đáy sông có nhiều bãi cạn, là địa bàn hoàn toàn bất lợi cho tàu chiến lớn của địch. Thứ hai, chiến thuật cọc nhọn độc đáo — đóng cọc dày đặc dưới lòng sông, khi thủy triều dâng cao che khuất cọc thì dụ địch vào, đợi thủy triều xuống tàu địch mắc cọc rồi tiêu diệt. Thứ ba, chiến thuật dụ địch — dùng lực lượng nhỏ khiêu chiến rồi giả thua rút lui để dụ tàu chiến địch vào bãi cọc.</p>

<p>Giá trị nghệ thuật quân sự của trận Bạch Đằng 1288 là bài học vĩnh cửu: người Việt Nam biết dùng địa hình, thời tiết, thủy văn làm vũ khí; biết tạo ra bẫy địa hình thiên tài; biết kết hợp bộ binh, thủy binh và nhân dân trong thế trận chung; biết chọn thời điểm phản công quyết định khi địch ở thế bất lợi nhất.</p>

<p>Viện Lịch sử Quân sự Việt Nam và Học viện Quốc phòng đã có nhiều công trình nghiên cứu chuyên sâu về trận Bạch Đằng, góp phần làm sáng rõ thêm những giá trị bất hủ của nghệ thuật quân sự thời Trần trong sự nghiệp bảo vệ đất nước.</p>`,
    coverImage: IMG.lich_su,
    category: 'lich_su_quan_su',
    tags: ['Bạch Đằng', 'Trần Hưng Đạo', 'lịch sử quân sự', 'chống Nguyên Mông', 'thế kỷ XIII'],
    isFeatured: true,
    views: 1567,
    publishedAt: new Date('2025-01-15T08:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'truyen-thong-quan-su-viet-nam-4000-nam-giu-nuoc',
    title: 'Truyền thống quân sự Việt Nam — 4000 năm giữ nước: Những giá trị bất tử',
    summary: 'Tổng quan lịch sử quân sự Việt Nam qua 4000 năm dựng và giữ nước, từ kháng chiến chống Tần đến đại thắng mùa Xuân 1975, khẳng định những giá trị truyền thống vĩnh cửu.',
    content: `<p>Lịch sử Việt Nam là lịch sử đấu tranh liên tục và kiên cường để bảo vệ độc lập dân tộc. Trải qua hơn 4000 năm, dân tộc ta đã phải đối mặt với nhiều kẻ thù xâm lược hùng mạnh hơn rất nhiều về quân sự và kinh tế, nhưng đều đã đánh thắng và giữ vững non sông.</p>

<p>Những trang sử vàng chói lọi: Từ Thục Phán An Dương Vương chống Tần (257 TCN); Hai Bà Trưng khởi nghĩa (40 - 43 SCN); Lý Thường Kiệt đánh Tống, bình Chiêm (1075 - 1076); Trần Hưng Đạo ba lần đánh bại quân Nguyên - Mông (1258, 1285, 1288); Lê Lợi và Nguyễn Trãi kháng chiến chống Minh 10 năm (1418-1427); Nguyễn Huệ đại phá quân Thanh (1789) đến kháng chiến chống Pháp (1945-1954) và chống Mỹ (1954-1975).</p>

<p>Những giá trị truyền thống bất tử được đúc kết qua lịch sử bốn nghìn năm dựng và giữ nước: Lòng yêu nước nồng nàn và ý chí bất khuất — sức mạnh nội sinh vô tận; Nghệ thuật chiến tranh nhân dân — huy động toàn dân đánh giặc; Trí tuệ quân sự sáng tạo — "lấy yếu thắng mạnh, lấy ít địch nhiều, lấy thô sơ thắng hiện đại"; Đoàn kết dân tộc — sức mạnh tổng hợp vượt mọi thách thức.</p>

<p>Những giá trị này không chỉ là niềm tự hào mà còn là nền tảng tinh thần và lý luận cho xây dựng nền quốc phòng toàn dân, thế trận lòng dân trong thời kỳ đổi mới và hội nhập quốc tế hôm nay.</p>`,
    coverImage: IMG.lich_su,
    category: 'lich_su_quan_su',
    tags: ['truyền thống quân sự', 'lịch sử Việt Nam', '4000 năm', 'giữ nước', 'chiến tranh nhân dân'],
    isFeatured: false,
    views: 1234,
    publishedAt: new Date('2025-02-22T08:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'vien-lich-su-quan-su-viet-nam-chuc-nang-nhiem-vu-thanh-tuu',
    title: 'Viện Lịch sử Quân sự Việt Nam: Chức năng, nhiệm vụ và những thành tựu nổi bật',
    summary: 'Giới thiệu về Viện Lịch sử Quân sự Việt Nam — cơ quan nghiên cứu và biên soạn lịch sử quân sự hàng đầu, những đóng góp trong bảo tồn và phát huy di sản quân sự dân tộc.',
    content: `<p>Viện Lịch sử Quân sự Việt Nam được thành lập ngày 28 tháng 5 năm 1981 theo Quyết định số 172/QĐ-BQP của Bộ Quốc phòng, trên cơ sở Ban Tổng kết kinh nghiệm chiến tranh và Phân viện Lịch sử thuộc Học viện Quân sự Cao cấp (nay là Học viện Quốc phòng). Đây là cơ quan nghiên cứu khoa học quân sự thuộc Bộ Quốc phòng, chuyên về lĩnh vực lịch sử quân sự và nghệ thuật quân sự Việt Nam.</p>

<p>Chức năng, nhiệm vụ chủ yếu của Viện bao gồm: Nghiên cứu lịch sử quân sự Việt Nam và lịch sử Quân đội nhân dân Việt Nam; Biên soạn, tổng kết kinh nghiệm chiến tranh và nghệ thuật quân sự; Xuất bản các công trình lịch sử quân sự; Tư vấn khoa học cho Bộ Quốc phòng về các vấn đề lịch sử và nghệ thuật quân sự; Hợp tác quốc tế về nghiên cứu lịch sử quân sự.</p>

<p>Những thành tựu tiêu biểu của Viện Lịch sử Quân sự Việt Nam: Bộ Lịch sử Kháng chiến chống thực dân Pháp 1945-1954 (5 tập); Lịch sử Kháng chiến chống Mỹ cứu nước 1954-1975 (9 tập); Bộ Lịch sử Quân đội nhân dân Việt Nam; Bách khoa thư quân sự Việt Nam; Nhiều công trình tổng kết kinh nghiệm chiến dịch lớn và hàng nghìn bài nghiên cứu chuyên khảo về lịch sử quân sự.</p>`,
    coverImage: IMG.lich_su,
    category: 'lich_su_quan_su',
    tags: ['Viện Lịch sử Quân sự', 'lịch sử quân sự', 'nghiên cứu', 'di sản quân sự'],
    isFeatured: false,
    views: 489,
    publishedAt: new Date('2025-03-10T10:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 6: KHOA HỌC QUÂN SỰ
  // ═══════════════════════════════════════════════════════

  {
    slug: 'vien-khoa-hoc-nghe-thuat-quan-su-nhiem-vu-va-thanh-tuu',
    title: 'Viện Khoa học Nghệ thuật Quân sự — Đơn vị nghiên cứu đầu ngành của Học viện Quốc phòng',
    summary: 'Giới thiệu về Viện Khoa học Nghệ thuật Quân sự trực thuộc Học viện Quốc phòng: lịch sử hình thành, chức năng nhiệm vụ, đội ngũ và những thành tựu nghiên cứu khoa học nổi bật.',
    content: `<p>Viện Khoa học Nghệ thuật Quân sự là cơ quan nghiên cứu trực thuộc Học viện Quốc phòng, được thành lập năm 1976. Viện có chức năng tham mưu, đề xuất với Đảng ủy và Ban Giám đốc Học viện về chỉ đạo, quản lý và thực hiện nhiệm vụ khoa học; nghiên cứu lý luận nghệ thuật quân sự; xuất bản Tạp chí Nghệ thuật Quân sự Việt Nam; tổ chức các hội thảo, tọa đàm khoa học.</p>

<p>Viện được tổ chức thành 4 phòng chức năng: Phòng Quản lý Khoa học; Phòng Nghiên cứu Nghệ thuật Quân sự; Phòng Thông tin Khoa học Quân sự; Phòng Tạp chí Nghệ thuật Quân sự Việt Nam. Ban lãnh đạo hiện tại gồm Đại tá TS Vũ Ngọc Thủy (Viện trưởng từ năm 2020) và hai Phó Viện trưởng.</p>

<p>Những thành tựu nghiên cứu khoa học nổi bật của Viện trong những năm gần đây: Hoàn thành nhiều đề tài cấp Nhà nước và cấp Bộ Quốc phòng về lý luận nghệ thuật quân sự; Sản xuất hai phim giáo dục về tác chiến quân sự phát hành toàn quân; Tiến hành khảo sát tại các đơn vị trong toàn quân đánh giá khả năng chuyển đổi số của Tạp chí; Tổ chức nhiều hội thảo khoa học cấp quốc gia và quốc tế về nghệ thuật quân sự.</p>

<p>Trong năm 2025, Viện tập trung vào 4 ưu tiên: nâng cao năng lực nghiên cứu phục vụ tư vấn chiến lược; hệ thống hóa đề tài theo các hình thái chiến tranh và loại hình tác chiến chiến lược mới; bảo đảm chất lượng công tác biên tập Tạp chí; mở rộng mạng lưới cộng tác viên trong toàn quân.</p>`,
    coverImage: IMG.khoa_hoc,
    category: 'khoa_hoc_quan_su',
    tags: ['Viện Khoa học Nghệ thuật Quân sự', 'nghiên cứu khoa học', 'Học viện Quốc phòng'],
    isFeatured: true,
    views: 756,
    publishedAt: new Date('2025-04-17T10:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'ung-dung-tri-tue-nhan-tao-trong-nghien-cuu-khoa-hoc-quan-su',
    title: 'Ứng dụng trí tuệ nhân tạo trong nghiên cứu và phân tích quân sự',
    summary: 'Bài viết đánh giá tiềm năng và thách thức khi ứng dụng trí tuệ nhân tạo trong các lĩnh vực nghiên cứu quân sự, phân tích tình báo, mô phỏng tác chiến và hỗ trợ ra quyết định chỉ huy.',
    content: `<p>Trí tuệ nhân tạo (AI) đang cách mạng hóa ngành quân sự toàn cầu. Từ hệ thống vũ khí tự động, phân tích ảnh vệ tinh thời gian thực, xử lý dữ liệu tình báo khổng lồ đến mô phỏng chiến trường và hỗ trợ ra quyết định chỉ huy — AI đang trở thành yếu tố quyết định trong chiến tranh hiện đại.</p>

<p>Học viện Quốc phòng đã bắt đầu nghiên cứu ứng dụng AI trong một số lĩnh vực cụ thể: Hệ thống thông tin chỉ huy - kiểm soát - liên lạc thông minh (C4I); Phần mềm mô phỏng chiến thuật và chiến dịch; Hỗ trợ đánh giá địa hình tác chiến bằng GIS thông minh; Phân tích và tổng hợp dữ liệu tình báo từ nhiều nguồn. Những ứng dụng này đã được Học viện phát triển nội bộ, phục vụ trực tiếp cho giảng dạy và nghiên cứu.</p>

<p>Tuy nhiên, ứng dụng AI trong quân sự cũng đặt ra những thách thức nghiêm trọng: an toàn thông tin và bảo mật dữ liệu; tính minh bạch và giải thích được của các quyết định AI; nguy cơ phụ thuộc công nghệ nước ngoài; các vấn đề đạo đức trong ứng dụng vũ khí tự động. Những vấn đề này đòi hỏi nghiên cứu nghiêm túc và xây dựng chính sách, quy định rõ ràng.</p>

<p>Việt Nam đang từng bước xây dựng năng lực AI quân sự nội sinh, không phụ thuộc vào công nghệ nước ngoài trong các lĩnh vực nhạy cảm. Đây là hướng đúng và cần được đầu tư xứng đáng để bảo đảm an ninh quốc phòng trong kỷ nguyên AI.</p>`,
    coverImage: IMG.khoa_hoc,
    category: 'khoa_hoc_quan_su',
    tags: ['trí tuệ nhân tạo', 'AI quân sự', 'công nghệ quốc phòng', 'C4I', 'mô phỏng tác chiến'],
    isFeatured: false,
    views: 891,
    publishedAt: new Date('2025-05-12T09:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'hoc-vien-quoc-phong-tong-ket-cong-tac-khoa-hoc-2024',
    title: 'Học viện Quốc phòng tổng kết công tác khoa học năm 2024, triển khai kế hoạch năm 2025',
    summary: 'Ngày 20/01/2025, Học viện Quốc phòng tổ chức hội nghị tổng kết công tác khoa học năm 2024 và triển khai nhiệm vụ khoa học năm 2025, dưới sự chủ trì của Thượng tướng Ngô Trọng Cường.',
    content: `<p>Ngày 20/01/2025, Học viện Quốc phòng tổ chức hội nghị tổng kết công tác khoa học năm 2024 và triển khai nhiệm vụ năm 2025. Thượng tướng Ngô Trọng Cường, Phó Giám đốc phụ trách khoa học, chủ trì hội nghị.</p>

<p>Nhìn lại năm 2024, Học viện đã hoàn thành đầy đủ các đề tài, nhiệm vụ khoa học theo kế hoạch với chất lượng được nâng lên rõ rệt. Thành tựu nổi bật bao gồm: Hoàn thành và bàn giao hai phim giáo dục về tác chiến quân sự, được phát hành sử dụng trong toàn quân; Tạp chí Nghệ thuật Quân sự Việt Nam duy trì hoạt động ổn định và tiến hành khảo sát thực tế tại một số đơn vị trong toàn quân, đánh giá khả năng triển khai chiến lược chuyển đổi số của Tạp chí.</p>

<p>Cho năm 2025, Học viện xác định 4 trọng tâm: Một là, tăng cường năng lực nghiên cứu phục vụ tư vấn chiến lược quốc phòng; Hai là, hệ thống hóa đề tài nghiên cứu gắn với nghiên cứu, cụ thể hóa các hình thái chiến tranh và loại hình tác chiến chiến lược mới; Ba là, bảo đảm chất lượng hỗ trợ công tác đào tạo và khoa học; Bốn là, tiếp tục duy trì và nâng cao chất lượng biên tập Tạp chí Nghệ thuật Quân sự, mở rộng mạng lưới cộng tác viên trên toàn quân.</p>

<p>Lãnh đạo Học viện nhấn mạnh: cần tăng cường sự lãnh đạo của cấp ủy đối với hoạt động khoa học; nâng cao phối hợp liên phòng ban; ưu tiên phát triển nhân lực với chuyên môn nâng cao; và tận dụng công nghệ thông tin để quản lý nghiên cứu tốt hơn theo tinh thần nghị quyết của Đảng về khoa học công nghệ.</p>`,
    coverImage: IMG.khoa_hoc,
    category: 'khoa_hoc_quan_su',
    tags: ['tổng kết khoa học', '2024', 'Học viện Quốc phòng', 'kế hoạch 2025'],
    isFeatured: false,
    views: 634,
    publishedAt: new Date('2025-01-22T08:00:00Z'),
    authorId: AUTHOR_ADMIN,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 7: GIÁO DỤC QUÂN SỰ
  // ═══════════════════════════════════════════════════════

  {
    slug: 'doi-moi-chuong-trinh-dao-tao-si-quan-cap-chien-dich-chien-luoc',
    title: 'Đổi mới chương trình đào tạo sĩ quan cấp chiến dịch - chiến lược tại Học viện Quốc phòng',
    summary: 'Học viện Quốc phòng triển khai đổi mới toàn diện chương trình đào tạo, kết hợp lý luận chiến lược với thực hành công nghệ, đáp ứng yêu cầu mới của chiến tranh hiện đại.',
    content: `<p>Học viện Quốc phòng là cơ sở đào tạo sĩ quan cấp chiến dịch - chiến lược cao nhất của Quân đội nhân dân Việt Nam. Trải qua hơn 75 năm xây dựng và phát triển, Học viện đã đào tạo hàng nghìn tướng lĩnh, sĩ quan cao cấp và cán bộ khoa học quân sự cho đất nước.</p>

<p>Chương trình đào tạo hiện nay được cấu trúc theo ba khối kiến thức chính: Lý luận chính trị quân sự và pháp luật; Nghệ thuật quân sự và khoa học quân sự (chiến lược, chiến dịch, chiến thuật, hậu cần kỹ thuật); Nghiên cứu thực tế và tổng kết kinh nghiệm tác chiến. Học viên sau tốt nghiệp có năng lực chỉ huy và tham mưu ở cấp chiến dịch chiến lược.</p>

<p>Trong giai đoạn mới, Học viện đang đổi mới mạnh mẽ theo hướng: Tích hợp nội dung tác chiến điện tử, chiến tranh mạng và tác chiến đa miền vào chương trình; Hiện đại hóa phương pháp giảng dạy bằng công nghệ mô phỏng số, bản đồ số và GIS quân sự; Tăng cường giảng dạy tiếng Anh quân sự và kiến thức quan hệ quốc tế; Đẩy mạnh nghiên cứu thực tế tại các đơn vị trong toàn quân và nước ngoài.</p>

<p>Phương châm đào tạo của Học viện là "Học phải gắn với hành, lý luận phải kết hợp với thực tiễn chiến đấu". Chất lượng đào tạo được đánh giá không chỉ qua kết quả thi cử mà còn qua hiệu quả công tác của học viên sau khi về đơn vị.</p>`,
    coverImage: IMG.giao_duc,
    category: 'giao_duc_quan_su',
    tags: ['đào tạo sĩ quan', 'chương trình đào tạo', 'Học viện Quốc phòng', 'đổi mới giáo dục'],
    isFeatured: true,
    views: 878,
    publishedAt: new Date('2025-03-01T09:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'hoc-vien-quoc-phong-tu-xay-dung-ung-dung-phuc-vu-giao-duc',
    title: 'Học viện Quốc phòng tự xây dựng nhiều ứng dụng công nghệ phục vụ giáo dục và đào tạo',
    summary: 'Học viện Quốc phòng đã tự nghiên cứu và phát triển thành công các ứng dụng phần mềm phục vụ giảng dạy và huấn luyện, bao gồm hệ thống thông tin số hóa, phần mềm đánh giá địa hình chiến thuật và mô phỏng chiến dịch.',
    content: `<p>Học viện Quốc phòng đang đẩy mạnh ứng dụng công nghệ thông tin trong giảng dạy và quản lý, với chủ trương tự nghiên cứu phát triển phần mềm để bảo đảm an toàn thông tin và tự chủ công nghệ. Đây là hướng đi đúng đắn trong bối cảnh an ninh thông tin ngày càng quan trọng.</p>

<p>Những ứng dụng tiêu biểu đã được phát triển thành công: Hệ thống thông tin số hóa phục vụ đào tạo và tác chiến — cho phép quản lý tài liệu, bài giảng và kế hoạch huấn luyện trên nền tảng số an toàn; Phần mềm hệ thống hỗ trợ đánh giá địa hình chiến thuật — tích hợp bản đồ số, GIS và mô hình địa hình 3D phục vụ bài giảng chiến thuật; Hệ thống mô phỏng tác chiến chiến dịch — cho phép diễn tập tình huống chiến dịch trên máy tính với các kịch bản phong phú.</p>

<p>Đây là kết quả của quá trình đầu tư bền vững cho nghiên cứu khoa học ứng dụng, gắn kết giữa đội ngũ kỹ sư - nhà giáo - cán bộ tác chiến. Thượng tướng Ngô Trọng Cường đánh giá: "Những ứng dụng này không chỉ nâng cao chất lượng đào tạo mà còn thể hiện tinh thần tự cường, không phụ thuộc vào công nghệ nước ngoài trong lĩnh vực nhạy cảm."</p>

<p>Kế hoạch tiếp theo là tích hợp AI và học máy vào các hệ thống này, phát triển thêm ứng dụng quản lý đơn vị và hỗ trợ ra quyết định chỉ huy, đồng thời chia sẻ công nghệ với các đơn vị toàn quân có nhu cầu.</p>`,
    coverImage: IMG.giao_duc,
    category: 'giao_duc_quan_su',
    tags: ['công nghệ giáo dục', 'phần mềm quân sự', 'chuyển đổi số', 'mô phỏng tác chiến'],
    isFeatured: false,
    views: 712,
    publishedAt: new Date('2025-02-10T09:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'dao-tao-si-quan-cao-cap-phuong-phap-ket-hop-ly-thuyet-thuc-hanh',
    title: 'Đào tạo sĩ quan cao cấp: Phương pháp kết hợp lý thuyết với thực hành chiến đấu',
    summary: 'Phân tích phương pháp đào tạo đặc thù của Học viện Quốc phòng, trong đó nhấn mạnh việc kết hợp lý thuyết chiến dịch - chiến lược với nghiên cứu thực tế tại đơn vị và chiến trường lịch sử.',
    content: `<p>Đào tạo sĩ quan cao cấp có yêu cầu đặc thù khác với đào tạo sĩ quan cấp thấp hơn: học viên đều đã có kinh nghiệm chỉ huy thực tiễn, cần được cung cấp lý luận chiến dịch - chiến lược ở tầm cao, đồng thời được rèn luyện tư duy chiến lược và năng lực tham mưu.</p>

<p>Phương pháp giảng dạy đặc thù tại Học viện Quốc phòng bao gồm: Phân tích các chiến dịch lịch sử và đương đại theo phương pháp khoa học; Diễn tập tình huống bản đồ (map exercise) và trên thực địa; Seminar chuyên sâu do giảng viên và chuyên gia hướng dẫn; Nghiên cứu thực tế tại các quân khu, binh đoàn và đơn vị đặc biệt; Tham quan chiến trường lịch sử để thấm thía bài học thực tiễn.</p>

<p>Đặc biệt, chương trình nghiên cứu thực tế bắt buộc tại các đơn vị trong toàn quân giúp học viên gắn kết lý thuyết với thực tiễn, đồng thời xây dựng mạng lưới quan hệ rộng rãi trong lực lượng vũ trang — điều cực kỳ quan trọng với sĩ quan cấp cao. Kết quả nghiên cứu thực tế được tổng hợp thành báo cáo khoa học, góp phần vào công tác nghiên cứu của Học viện.</p>`,
    coverImage: IMG.giao_duc,
    category: 'giao_duc_quan_su',
    tags: ['đào tạo sĩ quan cao cấp', 'phương pháp giảng dạy', 'nghiên cứu thực tế', 'chiến dịch học'],
    isFeatured: false,
    views: 534,
    publishedAt: new Date('2025-04-28T09:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 8: HỢP TÁC QUỐC PHÒNG
  // ═══════════════════════════════════════════════════════

  {
    slug: 'hoc-vien-quoc-phong-mo-rong-hop-tac-quoc-te-voi-cac-doi-tac-chien-luoc',
    title: 'Học viện Quốc phòng mở rộng hợp tác quốc tế với các đối tác chiến lược',
    summary: 'Học viện Quốc phòng tích cực mở rộng quan hệ hợp tác với học viện quốc phòng, trường sĩ quan và viện nghiên cứu quân sự của nhiều nước, góp phần nâng cao vị thế ngoại giao quốc phòng của Việt Nam.',
    content: `<p>Hợp tác quốc tế là một trong những nhiệm vụ quan trọng của Học viện Quốc phòng, nhằm học hỏi kinh nghiệm tiên tiến, mở rộng quan hệ đối ngoại quốc phòng và nâng cao uy tín của Việt Nam trong cộng đồng quốc phòng quốc tế. Trong những năm qua, Học viện đã thiết lập quan hệ hợp tác với hàng chục học viện quốc phòng và viện nghiên cứu quân sự ở nhiều quốc gia.</p>

<p>Các hình thức hợp tác chủ yếu bao gồm: Trao đổi học viên và giảng viên; Tổ chức hội thảo khoa học quốc tế; Nghiên cứu chung và trao đổi học thuật; Đào tạo sĩ quan quốc phòng cho các nước bạn; Tham quan và học hỏi kinh nghiệm. Đặc biệt, chương trình đào tạo sĩ quan quốc phòng quốc tế đã đào tạo hàng nghìn sĩ quan cho Lào, Campuchia và một số nước khác từ năm 1962 đến nay.</p>

<p>Trong khuôn khổ ASEAN Defence Ministers' Meeting Plus (ADMM+), Học viện Quốc phòng tích cực tham gia các hoạt động hợp tác an ninh khu vực, chia sẻ kinh nghiệm về nghệ thuật quân sự, gìn giữ hòa bình và ứng phó thảm họa. Đây là diễn đàn quan trọng để Việt Nam thể hiện vai trò và đóng góp tích cực vào an ninh khu vực.</p>

<p>Bộ Quốc phòng đã chỉ đạo Học viện Quốc phòng "không ngừng mở rộng đối ngoại quân sự, hợp tác quốc tế với học viện, đại học quốc phòng, viện nghiên cứu quốc phòng các nước để tiếp thu kinh nghiệm, trí tuệ nhân loại trong hoàn thiện nghệ thuật quân sự thời đại mới."</p>`,
    coverImage: IMG.hop_tac,
    category: 'hop_tac_quoc_phong',
    tags: ['hợp tác quốc tế', 'đối ngoại quốc phòng', 'ASEAN', 'ADMM+', 'học viên quốc tế'],
    isFeatured: true,
    views: 943,
    publishedAt: new Date('2025-03-20T09:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'dao-tao-quan-chuc-quoc-phong-quoc-te-tai-hoc-vien-quoc-phong',
    title: 'Đào tạo quan chức quốc phòng quốc tế tại Học viện Quốc phòng: 60 năm đồng hành cùng nước bạn',
    summary: 'Nhìn lại 60 năm (1962-2025) chương trình đào tạo sĩ quan và quan chức quốc phòng quốc tế tại Học viện Quốc phòng, những đóng góp cho quan hệ quân sự Việt Nam - Lào - Campuchia và các nước.',
    content: `<p>Từ năm 1962, Học viện Quốc phòng Việt Nam đã bắt đầu nhiệm vụ đào tạo sĩ quan và quan chức quốc phòng cho các nước bạn, trước tiên là Lào và Campuchia — những đồng minh chiến đấu trong cuộc kháng chiến chống đế quốc Mỹ. Đến nay, sau hơn 60 năm, chương trình này đã đào tạo hàng nghìn sĩ quan, tướng lĩnh cho các quốc gia anh em.</p>

<p>Mục tiêu của chương trình đào tạo quốc tế là trang bị cho học viên kiến thức về chiến lược quân sự, chính sách quốc phòng, nghệ thuật tác chiến và quản lý nguồn lực quốc phòng, phù hợp với điều kiện và yêu cầu cụ thể của mỗi quốc gia. Đồng thời, tăng cường tình đoàn kết, hiểu biết lẫn nhau giữa quân đội các nước.</p>

<p>Những thành tựu tiêu biểu: Nhiều học viên tốt nghiệp tại Học viện Quốc phòng Việt Nam đã trở thành tướng lĩnh, quan chức quốc phòng cấp cao của Lào và Campuchia. Họ mang theo kiến thức và tình hữu nghị đã vun đắp trong những năm học tập tại Hà Nội, tiếp tục đóng góp cho quan hệ đặc biệt Việt Nam - Lào - Campuchia.</p>

<p>Hàng năm, Học viện tổ chức các hoạt động giao lưu văn hóa, nhân dịp các lễ tết truyền thống của Lào và Campuchia, thể hiện sự tôn trọng và chia sẻ văn hóa giữa các dân tộc. Đây là biểu hiện thiết thực của "ngoại giao nhân dân" trong lĩnh vực quân sự.</p>`,
    coverImage: IMG.hop_tac,
    category: 'hop_tac_quoc_phong',
    tags: ['đào tạo quốc tế', 'Lào', 'Campuchia', 'tình đoàn kết quân sự', 'ngoại giao quân sự'],
    isFeatured: false,
    views: 678,
    publishedAt: new Date('2025-04-14T10:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'hop-tac-quoc-phong-viet-nam-trong-khuon-kho-asean',
    title: 'Hợp tác quốc phòng Việt Nam trong khuôn khổ ASEAN: Vai trò và đóng góp',
    summary: 'Đánh giá vai trò tích cực của Việt Nam trong cơ chế hợp tác quốc phòng ASEAN (ADMM, ADMM+), những đóng góp thực chất vào an ninh khu vực và bài học kinh nghiệm.',
    content: `<p>Kể từ khi gia nhập ASEAN năm 1995, Việt Nam đã tích cực tham gia và đóng góp vào cơ chế hợp tác quốc phòng khu vực, đặc biệt là ASEAN Defence Ministers' Meeting (ADMM) và ADMM Plus (ADMM+). Đây là diễn đàn quan trọng để Việt Nam thể hiện tinh thần trách nhiệm và năng lực của một thành viên tích cực trong cộng đồng ASEAN.</p>

<p>Những đóng góp tiêu biểu của Việt Nam trong hợp tác quốc phòng ASEAN: Tổ chức thành công ADMM+ lần đầu tiên tại Hà Nội năm 2010, đặt nền móng cho cơ chế hợp tác quốc phòng đa phương quan trọng nhất khu vực; Tích cực tham gia lực lượng gìn giữ hòa bình của Liên hợp quốc theo ủy nhiệm của ASEAN; Đóng góp vào xây dựng lòng tin thông qua trao đổi thông tin, tập huấn chung và giao lưu quân sự.</p>

<p>Học viện Quốc phòng đóng vai trò quan trọng trong hợp tác quốc phòng ASEAN thông qua: Đào tạo học viên từ các nước ASEAN; Tổ chức hội thảo quân sự đa phương; Trao đổi chuyên gia và giảng viên; Chia sẻ tài liệu và kinh nghiệm đào tạo. Những hoạt động này góp phần xây dựng niềm tin và củng cố quan hệ quốc phòng Việt Nam với các nước trong khu vực và trên thế giới.</p>`,
    coverImage: IMG.hop_tac,
    category: 'hop_tac_quoc_phong',
    tags: ['ASEAN', 'ADMM', 'ADMM+', 'hợp tác quốc phòng khu vực', 'gìn giữ hòa bình'],
    isFeatured: false,
    views: 567,
    publishedAt: new Date('2025-06-01T09:00:00Z'),
    authorId: AUTHOR_SECTION,
  },

  // ═══════════════════════════════════════════════════════
  // CHUYÊN MỤC 9: TIN TỨC HỌC VIỆN
  // ═══════════════════════════════════════════════════════

  {
    slug: 'hoc-vien-quoc-phong-tong-ket-nam-hoc-2024-2025',
    title: 'Học viện Quốc phòng tổng kết năm học 2024-2025, biểu dương những tập thể, cá nhân xuất sắc',
    summary: 'Hội nghị tổng kết năm học 2024-2025 của Học viện Quốc phòng đã khẳng định những thành tích nổi bật trong đào tạo, nghiên cứu khoa học và xây dựng đơn vị vững mạnh toàn diện.',
    content: `<p>Học viện Quốc phòng vừa tổ chức Hội nghị tổng kết năm học 2024-2025, đánh giá toàn diện kết quả thực hiện nhiệm vụ trong năm học và đề ra phương hướng, nhiệm vụ trọng tâm năm học mới 2025-2026. Trung tướng, GS.TS Phan Tùng Sơn, Bí thư Đảng ủy, Giám đốc Học viện chủ trì hội nghị.</p>

<p>Năm học 2024-2025, Học viện đã hoàn thành xuất sắc nhiệm vụ đào tạo, nghiên cứu khoa học và xây dựng đơn vị. Một số kết quả nổi bật: 100% khóa học tốt nghiệp đúng hạn; Chất lượng đầu ra được các đơn vị tiếp nhận đánh giá cao; Học viện dẫn đầu toàn quân về số lượng và chất lượng đề tài nghiên cứu khoa học cấp Bộ; Đơn vị được công nhận "Đơn vị vững mạnh toàn diện tiêu biểu" của Bộ Quốc phòng.</p>

<p>Tại hội nghị, Học viện đã biểu dương nhiều tập thể và cá nhân xuất sắc trong năm học. Giám đốc Học viện nhấn mạnh: "Thành công của năm học là kết quả của sự đoàn kết, phấn đấu kiên trì của toàn thể cán bộ, giảng viên, học viên và nhân viên Học viện. Đây là nền tảng vững chắc để chúng ta tiếp tục phấn đấu cao hơn trong năm học mới."</p>

<p>Cho năm học 2025-2026, Học viện đặt ra mục tiêu: tiếp tục đổi mới nội dung và phương pháp đào tạo; đẩy mạnh nghiên cứu khoa học phục vụ chiến lược quốc phòng; tăng cường hợp tác quốc tế; xây dựng môi trường học tập hiện đại, số hóa.</p>`,
    coverImage: IMG.hoc_vien,
    category: 'tin_tuc_hoc_vien',
    tags: ['tổng kết năm học', '2024-2025', 'Học viện Quốc phòng', 'thi đua khen thưởng'],
    isFeatured: true,
    views: 1123,
    publishedAt: new Date('2025-06-20T08:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'hoc-vien-quoc-phong-khai-giang-nam-hoc-2025-2026',
    title: 'Học viện Quốc phòng long trọng khai giảng năm học 2025-2026',
    summary: 'Lễ khai giảng năm học 2025-2026 của Học viện Quốc phòng diễn ra trang trọng, tiếp nhận học viên mới từ các quân khu, binh đoàn và lực lượng vũ trang nhân dân.',
    content: `<p>Sáng ngày 5/9/2025, Học viện Quốc phòng tổ chức Lễ khai giảng năm học 2025-2026, chính thức tiếp nhận và đưa vào đào tạo các khóa học mới. Đại tướng Nguyễn Tân Cương, Tổng Tham mưu trưởng Quân đội nhân dân Việt Nam, trực tiếp dự và phát biểu chỉ đạo tại lễ khai giảng.</p>

<p>Năm học 2025-2026, Học viện tiếp nhận đào tạo gần 200 học viên từ các quân khu, binh đoàn, lực lượng vũ trang nhân dân và sĩ quan quốc tế từ các nước bạn. Học viên năm nay là những sĩ quan cấp tướng lĩnh và thượng tá, đại tá đầy tiềm năng — thế hệ lãnh đạo quân sự tương lai của đất nước.</p>

<p>Tổng Tham mưu trưởng căn dặn học viên: "Các đồng chí được chọn cử đến học tập tại Học viện là niềm vinh dự và trách nhiệm lớn. Phải học tập thật sự nghiêm túc, thấm nhuần lý luận chiến lược quân sự và nghệ thuật quân sự; học lý luận phải gắn với thực tiễn đơn vị; học phải có tinh thần đột phá, sáng tạo, không sao chép máy móc."</p>

<p>Trung tướng Phan Tùng Sơn, Giám đốc Học viện, cam kết: "Tập thể Học viện sẽ tạo mọi điều kiện tốt nhất để các học viên hoàn thành xuất sắc khóa học, trở về đơn vị phát huy được những kiến thức và kỹ năng tiếp thu được, đóng góp xứng đáng vào sự nghiệp bảo vệ Tổ quốc."</p>`,
    coverImage: IMG.hoc_vien,
    category: 'tin_tuc_hoc_vien',
    tags: ['khai giảng', '2025-2026', 'năm học mới', 'Học viện Quốc phòng'],
    isFeatured: false,
    views: 867,
    publishedAt: new Date('2025-09-05T07:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'hoc-vien-quoc-phong-to-chuc-hoi-thao-khoa-hoc-ve-nghe-thuat-quan-su',
    title: 'Hội thảo khoa học quốc gia: "Nghệ thuật quân sự Việt Nam — Phát triển lý luận đáp ứng yêu cầu tình hình mới"',
    summary: 'Học viện Quốc phòng tổ chức hội thảo khoa học cấp quốc gia về phát triển lý luận nghệ thuật quân sự Việt Nam, thu hút sự tham gia của hàng trăm nhà khoa học quân sự trong và ngoài quân đội.',
    content: `<p>Ngày 15/11/2025, tại Hà Nội, Học viện Quốc phòng tổ chức Hội thảo khoa học cấp quốc gia với chủ đề "Nghệ thuật quân sự Việt Nam — Phát triển lý luận đáp ứng yêu cầu tình hình mới". Hội thảo thu hút sự tham gia của hơn 150 nhà khoa học, tướng lĩnh và chuyên gia quân sự từ các học viện, viện nghiên cứu và các quân khu trong toàn quân.</p>

<p>Hội thảo tập trung thảo luận 4 chủ đề lớn: Thứ nhất, các hình thái chiến tranh mới và yêu cầu đặt ra đối với nghệ thuật quân sự Việt Nam; Thứ hai, phát triển lý luận chiến dịch, chiến thuật trong điều kiện chiến tranh công nghệ cao; Thứ ba, nghệ thuật tác chiến đa miền (không gian, mạng, điện tử, tâm lý); Thứ tư, kinh nghiệm lịch sử nghệ thuật quân sự Việt Nam và giá trị kế thừa.</p>

<p>Hội thảo nhận được 78 tham luận chất lượng cao, trong đó có 35 tham luận được trình bày trực tiếp. Nhiều ý kiến đóng góp mới có giá trị khoa học cao đối với việc bổ sung, phát triển hệ thống lý luận nghệ thuật quân sự Việt Nam.</p>

<p>Kết thúc hội thảo, Ban tổ chức sẽ tổng hợp các kết quả nghiên cứu để trình Bộ Quốc phòng và Ban chỉ đạo nghiên cứu lý luận, đồng thời xuất bản kỷ yếu hội thảo phục vụ nghiên cứu và giảng dạy tại Học viện Quốc phòng.</p>`,
    coverImage: IMG.hoc_vien,
    category: 'tin_tuc_hoc_vien',
    tags: ['hội thảo khoa học', 'nghệ thuật quân sự', 'lý luận quân sự', 'hội thảo quốc gia'],
    isFeatured: true,
    views: 945,
    publishedAt: new Date('2025-11-15T08:00:00Z'),
    authorId: AUTHOR_EIC,
  },

  {
    slug: 'giao-luu-hoc-vien-viet-nam-lao-campuchia-nhan-tet-co-truyen',
    title: 'Ấm áp buổi giao lưu học viên Việt Nam - Lào - Campuchia nhân dịp Tết cổ truyền',
    summary: 'Nhân dịp Tết Bunpimay của Lào và Chol Chnăm Thmây của Campuchia, Học viện Quốc phòng tổ chức buổi giao lưu văn hóa ấm áp với học viên quốc tế, thể hiện tình đoàn kết quân sự đặc biệt.',
    content: `<p>Nhân dịp Tết "Bun Pi May" của Lào và "Chol Chnăm Thmây" của Campuchia, Học viện Quốc phòng tổ chức buổi gặp mặt truyền thống ấm áp cho học viên quốc tế đang theo học tại Học viện. Thiếu tướng Lê Thành Long, Phó Chính ủy Học viện, chủ trì và phát biểu chào mừng.</p>

<p>Phó Chính ủy nhấn mạnh: "Tình cảm và trách nhiệm đối với học viên quốc tế là biểu hiện của tình đoàn kết quân sự đặc biệt giữa ba nước. Mỗi học viên Lào và Campuchia khi về nước là một sứ giả của tình hữu nghị, là cầu nối quan trọng giữa quân đội và nhân dân các nước anh em."</p>

<p>Buổi gặp mặt có phần biểu diễn văn nghệ đặc sắc với điệu múa Lăm Vông của Lào và điệu múa Apsara của Campuchia, tái hiện nét văn hóa truyền thống của các dân tộc anh em. Phần lễ tắm nước theo phong tục Tết Phật lịch diễn ra đầy cảm xúc, thể hiện sự tôn trọng và trân quý văn hóa của nhau.</p>

<p>Đại diện học viên quốc tế bày tỏ lòng biết ơn chân thành: "Chúng tôi không chỉ học được kiến thức quân sự mà còn học được tình đoàn kết, cách sống và đạo làm người từ các đồng chí Việt Nam. Những kỷ niệm tại Học viện sẽ theo chúng tôi suốt cuộc đời."</p>`,
    coverImage: IMG.hop_tac,
    category: 'tin_tuc_hoc_vien',
    tags: ['học viên quốc tế', 'Lào', 'Campuchia', 'giao lưu văn hóa', 'tình đoàn kết'],
    isFeatured: false,
    views: 489,
    publishedAt: new Date('2025-04-13T15:00:00Z'),
    authorId: AUTHOR_EDITOR,
  },

  {
    slug: 'hoc-vien-quoc-phong-tang-cuong-ket-nap-dang-vien-moi',
    title: 'Học viện Quốc phòng tăng cường công tác phát triển đảng viên trong học viên và cán bộ',
    summary: 'Công tác xây dựng Đảng tại Học viện Quốc phòng được chú trọng, trong đó có việc tăng cường kết nạp đảng viên mới trong đội ngũ học viên, giảng viên trẻ nhân kỷ niệm các ngày lễ lớn.',
    content: `<p>Công tác xây dựng Đảng là nhiệm vụ chính trị trọng tâm của Học viện Quốc phòng. Năm 2025, Đảng ủy Học viện đặc biệt chú trọng nâng cao chất lượng kết nạp đảng viên mới trong đội ngũ học viên và cán bộ, giảng viên trẻ, nhằm tăng cường sức mạnh của tổ chức Đảng.</p>

<p>Các tiêu chí kết nạp đảng viên tại Học viện Quốc phòng được áp dụng nghiêm túc và đầy đủ: lý tưởng cộng sản kiên định; thành tích học tập và công tác xuất sắc; phẩm chất đạo đức tốt; bản lĩnh chính trị vững vàng. Đặc biệt, học viên phải trải qua quá trình học tập, rèn luyện thực sự nghiêm túc trong suốt thời gian là đảng viên dự bị.</p>

<p>Trong năm học 2024-2025, Học viện đã kết nạp 47 đảng viên mới, đạt và vượt chỉ tiêu đề ra. Đây là kết quả của quá trình giáo dục, rèn luyện kiên trì và nghiêm túc của toàn hệ thống Đảng bộ Học viện.</p>

<p>Bí thư Đảng ủy Học viện nhấn mạnh: "Xây dựng tổ chức Đảng trong sạch, vững mạnh là nền tảng để xây dựng Học viện vững mạnh toàn diện. Mỗi đảng viên phải là tấm gương sáng về phẩm chất, năng lực và bản lĩnh chiến đấu, thực sự xứng đáng là người tiên phong trong mọi nhiệm vụ."</p>`,
    coverImage: IMG.hoc_vien,
    category: 'tin_tuc_hoc_vien',
    tags: ['xây dựng Đảng', 'kết nạp đảng viên', 'Học viện Quốc phòng', 'tổ chức đảng'],
    isFeatured: false,
    views: 312,
    publishedAt: new Date('2025-05-19T09:00:00Z'),
    authorId: AUTHOR_SECTION,
  },
]

async function main() {
  console.log('📰 seed-news-ntqs.ts — Tạp chí Nghệ thuật Quân sự Việt Nam')
  console.log('   Seed tin tức đầy đủ cho 9 chuyên mục NTQS...\n')

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
    console.log(`  ✅ [${news.category}] ${news.title.substring(0, 70)}`)
    created++
  }

  const total = await db.news.count()
  console.log(`\n🎉 Hoàn tất!`)
  console.log(`   Đã tạo mới: ${created} bài`)
  console.log(`   Bỏ qua:     ${skipped} bài`)
  console.log(`   Tổng News:  ${total} bài\n`)

  // Thống kê theo chuyên mục
  const categories = [
    'chien_luoc_quan_su',
    'nghe_thuat_tac_chien',
    'chien_dich_hoc',
    'chien_thuat_hoc',
    'lich_su_quan_su',
    'khoa_hoc_quan_su',
    'giao_duc_quan_su',
    'hop_tac_quoc_phong',
    'tin_tuc_hoc_vien',
  ]
  console.log('   Phân bổ theo chuyên mục:')
  for (const cat of categories) {
    const count = await db.news.count({ where: { category: cat } })
    console.log(`     ${cat}: ${count} bài`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
