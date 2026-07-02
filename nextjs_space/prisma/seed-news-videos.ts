/**
 * seed-news-videos.ts — Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)
 *
 * Dữ liệu demo cho News và Video (ảnh dùng asset local của NTQS).
 *
 * Idempotent — xóa News/Video/Banner cũ rồi tạo lại
 * Run: npx tsx --require dotenv/config prisma/seed-news-videos.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// Ảnh demo dùng asset local của NTQS (thay cho URL domain ngoài cũ).
const DEFAULT_NEWS_IMAGE = '/images/default-article.jpg'

// User IDs từ DB hiện tại
const AUTHOR_ADMIN   = '7557426a-ff70-4f9f-9d09-d609fbd59df5' // Quản trị viên hệ thống
const AUTHOR_EIC     = '76f7135c-a48b-4760-af20-182243dad991' // Tổng Biên Tập
const AUTHOR_EDITOR  = 'd407d227-c07e-4184-8cc6-beffbcfd6215' // Biên Tập Chính
const AUTHOR_SECTION = '6ee14ac7-0e5a-4bfa-9319-34f579f9c9af' // Biên Tập Chuyên Mục

async function main() {
  console.log('📰 seed-news-videos.ts — bắt đầu tạo dữ liệu test...')

  // ── 1. Xóa dữ liệu cũ ────────────────────────────────────────────────────────
  await db.news.deleteMany({})
  await db.video.deleteMany({})
  await db.banner.deleteMany({})
  console.log('  🗑  Đã xóa News / Video / Banner cũ')

  // ── 2. News Articles (dữ liệu demo) ───────────────────────────
  const newsData = [
    {
      slug: 'chuan-hoa-cong-tac-ke-hoach-hau-can-ky-thuat-tu-goc-nhin-chuyen-gia',
      title: 'Chuẩn hóa công tác kế hoạch hậu cần, kỹ thuật từ góc nhìn chuyên gia',
      summary: 'Công tác kế hoạch hậu cần, kỹ thuật thường xuyên của sư đoàn bộ binh là một nội dung trọng tâm của công tác tham mưu của cơ quan hậu cần - kỹ thuật trong tổ chức chỉ huy, bảo đảm cho các hoạt động của sư đoàn.',
      content: `<p>Công tác kế hoạch hậu cần, kỹ thuật thường xuyên của sư đoàn bộ binh là một nội dung trọng tâm của công tác tham mưu của cơ quan hậu cần - kỹ thuật trong tổ chức chỉ huy, bảo đảm cho các hoạt động của sư đoàn. Đây là nội dung có ý nghĩa quan trọng, thiết thực, là cơ sở để làm tốt công tác bảo đảm trực tiếp cho các lực lượng trong quá trình thực hiện nhiệm vụ.</p>
<p>Tại buổi giảng, bằng vốn kiến thức chuyên sâu và kinh nghiệm thực tiễn phong phú, đồng chí Phó Giám đốc đã tập trung phân tích, làm rõ những yếu tố tác động tới công tác xây dựng kế hoạch. Đồng thời, đồng chí cũng đưa ra một số vấn đề từ thực tiễn tại đơn vị, minh hoạ một cách sinh động cho những kiến thức lý luận và giúp học viên có cách nhìn đúng đắn, toàn diện hơn về tầm quan trọng của công tác lập kế hoạch.</p>
<p>Thay mặt tập thể Lớp Cao học Hậu cần quân sự Khóa 34, đại diện học viên đã gửi tặng đồng chí Phó Giám đốc bó hoa tươi thắm để bày tỏ sự trân trọng và biết ơn sâu sắc trước sự quan tâm, nhiệt huyết trong công tác đào tạo, bồi dưỡng nguồn cán bộ hậu cần kỹ thuật chất lượng cao cho quân đội.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'hoat_dong',
      tags: ['hậu cần quân sự', 'kế hoạch', 'đào tạo', 'cao học'],
      isFeatured: true,
      views: 312,
      publishedAt: new Date('2026-04-22T22:00:00Z'),
      authorId: AUTHOR_EIC,
    },
    {
      slug: 'hoc-vien-hau-can-xet-cong-nhan-danh-hieu-nha-giao-gioi-cap-hoc-vien-nam-2025-2026',
      title: 'Học viện Quốc phòng xét, công nhận danh hiệu Nhà giáo giỏi các cấp năm học 2025 - 2026',
      summary: 'Hội đồng nhất trí đề nghị Giám đốc Học viện công nhận danh hiệu Nhà giáo giỏi cho 116 nhà giáo đủ tiêu chí, bao gồm 01 nhà giáo đạt cấp toàn quân và nhiều nhà giáo đạt cấp Học viện và cấp khoa.',
      content: `<p>Thực hiện Quy chế thi đua, khen thưởng và công tác Nhà giáo giỏi của Học viện Quốc phòng, Hội đồng xét công nhận Nhà giáo giỏi Học viện Quốc phòng đã tiến hành họp xét, công nhận danh hiệu Nhà giáo giỏi các cấp năm học 2025 - 2026.</p>
<p>Hội đồng cơ bản nhất trí với các nội dung của bản báo cáo và tiến hành thảo luận, nhất trí đề nghị Giám đốc Học viện công nhận danh hiệu Nhà giáo giỏi cho các nhà giáo đủ tiêu chí theo tiêu chuẩn quy định. Kết quả, năm học 2025 - 2026, có 116 nhà giáo được đề nghị đạt danh hiệu Nhà giáo giỏi, trong đó: 01 nhà giáo đề nghị xét công nhận Nhà giáo giỏi cấp toàn quân; 22 nhà giáo xét công nhận Nhà giáo giỏi cấp Học viện; 93 nhà giáo xét công nhận Nhà giáo giỏi cấp Khoa.</p>
<p>Đây là hoạt động thường niên nhằm động viên, khuyến khích đội ngũ giảng viên không ngừng nâng cao trình độ chuyên môn, nghiệp vụ sư phạm, góp phần nâng cao chất lượng đào tạo của Học viện.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'hoat_dong',
      tags: ['nhà giáo giỏi', 'thi đua', 'khen thưởng', 'giảng viên'],
      isFeatured: true,
      views: 245,
      publishedAt: new Date('2026-04-22T18:00:00Z'),
      authorId: AUTHOR_EDITOR,
    },
    {
      slug: 'hoc-vien-hau-can-chung-tay-xay-dung-thu-vien-trung-tam-cham-soc-suc-khoe-xa-yen-trach-2026',
      title: 'Học viện Quốc phòng chung tay xây dựng thư viện và trung tâm chăm sóc sức khỏe cộng đồng xã Yên Trạch nhân Ngày Sách Việt Nam 2026',
      summary: 'Nhân dịp kỷ niệm Ngày Sách và Văn hóa đọc Việt Nam năm 2026, Học viện Quốc phòng tổ chức đoàn công tác ra mắt Thư viện và Trung tâm sinh hoạt văn hóa cộng đồng tại xã Yên Trạch, tỉnh Thái Nguyên.',
      content: `<p>Sáng 21/4, nhân dịp kỷ niệm Ngày Sách và Văn hóa đọc Việt Nam năm 2026, đoàn công tác của Học viện Quốc phòng do đồng chí Đại tá Lại Thị Lý, Phó Chủ nhiệm Chính trị Học viện làm Trưởng đoàn đã tham gia buổi ra mắt Thư viện và Trung tâm sinh hoạt văn hóa cộng đồng, Trung tâm chăm sóc sức khỏe cộng đồng và chăm sóc sức khỏe người cao tuổi xã Yên Trạch.</p>
<p>Tham gia buổi ra mắt, có đại biểu lãnh đạo sở, ban, ngành tỉnh Thái Nguyên, đại diện Đảng ủy, Hội đồng nhân dân, Ủy ban nhân dân và các tổ chức đoàn thể của xã Yên Trạch, với sự có mặt của đông đảo bà con nhân dân và các em học sinh thuộc nhiều bậc học trên địa bàn.</p>
<p>Đây là một trong những hoạt động ý nghĩa, thể hiện trách nhiệm xã hội và tình cảm của Học viện Quốc phòng với cộng đồng địa phương, góp phần phát triển văn hóa đọc và nâng cao chất lượng cuộc sống cho bà con nhân dân.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'su_kien',
      tags: ['ngày sách', 'cộng đồng', 'Thái Nguyên', 'văn hóa đọc'],
      isFeatured: false,
      views: 189,
      publishedAt: new Date('2026-04-21T18:00:00Z'),
      authorId: AUTHOR_EDITOR,
    },
    {
      slug: 'tro-ve-coi-nguon-tiep-lua-tu-hao-hoc-vien-hau-can',
      title: 'Trở về cội nguồn, tiếp lửa tự hào — Học viện Quốc phòng hành trình về di tích lịch sử',
      summary: 'Trải qua gần 75 năm xây dựng, chiến đấu và phát triển, các thế hệ cán bộ, giảng viên, học viên Học viện Quốc phòng đã không ngừng phấn đấu, vun đắp nên truyền thống vẻ vang.',
      content: `<p>Trải qua gần 75 năm xây dựng, chiến đấu và phát triển, các thế hệ cán bộ, giảng viên, học viên Học viện Quốc phòng đã không ngừng phấn đấu, vun đắp nên truyền thống vẻ vang <em>"Tuyệt đối trung thành, chủ động sáng tạo, đoàn kết chặt chẽ, dạy tốt học tốt, gắn với chiến trường, hướng về đơn vị."</em></p>
<p>Để tri ân công lao của Chủ tịch Hồ Chí Minh và ghi dấu sự kiện lịch sử thiêng liêng, năm 2000, Học viện xây dựng Bia kỷ niệm tại địa điểm tổ chức lớp huấn luyện đầu tiên. Đến ngày 15/6/2021, nơi đây được Bộ trưởng Bộ Văn hóa, Thể thao và Du lịch xếp hạng Di tích quốc gia, trở thành "địa chỉ đỏ" giàu ý nghĩa lịch sử, giáo dục truyền thống cho các thế hệ cán bộ, học viên.</p>
<p>Hành trình trở về cội nguồn không chỉ là dịp ôn lại lịch sử mà còn là ngọn lửa truyền cảm hứng, tiếp thêm động lực cho thế hệ trẻ tiếp tục sứ mệnh vẻ vang của Học viện.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'truyen_thong',
      tags: ['truyền thống', 'lịch sử', 'di tích quốc gia', '75 năm'],
      isFeatured: true,
      views: 478,
      publishedAt: new Date('2026-04-18T21:00:00Z'),
      authorId: AUTHOR_EIC,
    },
    {
      slug: 'nganh-quan-y-hoc-vien-hau-can-vung-chuyen-mon-cham-soc-suc-khoe-bo-doi',
      title: 'Ngành Quân y Học viện Quốc phòng vững chuyên môn, chăm sóc tốt sức khỏe bộ đội và nhân dân',
      summary: 'Trải qua 80 năm xây dựng và phát triển, ngành Quân y Học viện Quốc phòng đã hoàn thành xuất sắc nhiệm vụ chăm sóc, bảo vệ sức khỏe bộ đội, phục vụ chiến đấu, sẵn sàng chiến đấu và tham gia chăm sóc sức khỏe nhân dân.',
      content: `<p>Trải qua 80 năm xây dựng và phát triển, dưới sự lãnh đạo của Đảng, Quân ủy Trung ương, Bộ Quốc phòng, ngành Quân y đã không ngừng lớn mạnh, hoàn thành xuất sắc nhiệm vụ chăm sóc, bảo vệ sức khỏe bộ đội, phục vụ chiến đấu, sẵn sàng chiến đấu và tham gia chăm sóc sức khỏe nhân dân.</p>
<p>Phát huy truyền thống vẻ vang đó, ngành Quân y Học viện Quốc phòng luôn chủ động, tích cực tham mưu cho Đảng ủy, Ban Giám đốc Học viện về bảo đảm quân y; tổ chức tốt công tác chăm sóc sức khỏe cho cán bộ, giảng viên, học viên, sinh viên, chiến sĩ; thực hiện tốt nhiệm vụ chuyên môn, góp phần quan trọng vào sự nghiệp xây dựng và bảo vệ Tổ quốc.</p>
<p>Trong thời gian tới, ngành Quân y Học viện xác định tiếp tục đổi mới, nâng cao năng lực chuyên môn, ứng dụng y học hiện đại vào công tác chăm sóc sức khỏe, đáp ứng yêu cầu nhiệm vụ trong tình hình mới.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'hoat_dong',
      tags: ['quân y', '80 năm', 'sức khỏe', 'bộ đội'],
      isFeatured: false,
      views: 156,
      publishedAt: new Date('2026-04-17T07:00:00Z'),
      authorId: AUTHOR_SECTION,
    },
    {
      slug: 'hoc-vien-hau-can-ban-giao-can-bo-luan-chuyen-thuc-te-tai-quan-khu-5',
      title: 'Học viện Quốc phòng bàn giao cán bộ luân chuyển thực tế tại Quân khu 5',
      summary: 'Thực hiện Quyết định của Bộ trưởng Bộ Quốc phòng, Đại tá Đỗ Đức Tùng, Phó Chủ nhiệm Chính trị Học viện Quốc phòng được luân chuyển thực tế tại Sư đoàn 2, đảm nhiệm chức vụ Phó Chính ủy Sư đoàn.',
      content: `<p>Thực hiện Quyết định của Bộ trưởng Bộ Quốc phòng về công tác cán bộ, Đại tá Đỗ Đức Tùng, Phó Chủ nhiệm Chính trị Học viện Quốc phòng được luân chuyển thực tế tại Sư đoàn 2, đảm nhiệm chức vụ Phó Chính ủy Sư đoàn. Đây là một trong những nội dung quan trọng, được Học viện Quốc phòng triển khai thường xuyên, bài bản nhằm nâng cao năng lực thực tiễn cho cán bộ lãnh đạo.</p>
<p>Phát biểu tại hội nghị, Thiếu tướng Lê Thành Long nhấn mạnh, thời gian qua, công tác luân chuyển, thực tế cán bộ luôn được Thường vụ Đảng ủy, Ban Giám đốc Học viện Quốc phòng đặc biệt quan tâm lãnh đạo, chỉ đạo chặt chẽ, thống nhất. Trên cơ sở quán triệt sâu sắc các nghị quyết, chỉ thị của Quân ủy Trung ương, Bộ Quốc phòng, Học viện đã triển khai công tác này một cách nghiêm túc, hiệu quả.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'can_bo',
      tags: ['luân chuyển cán bộ', 'Quân khu 5', 'Sư đoàn 2', 'công tác cán bộ'],
      isFeatured: false,
      views: 203,
      publishedAt: new Date('2026-04-16T18:00:00Z'),
      authorId: AUTHOR_EDITOR,
    },
    {
      slug: 'to-chuc-kiem-tra-ban-dan-that-sung-ngan-k54-hoc-vien-phan-doi-khoa-32',
      title: 'Tổ chức kiểm tra bắn đạn thật súng ngắn K54 cho học viên Phân đội Khoá 32, Tiểu đoàn 1 tại Học viện Quốc phòng',
      summary: 'Thiếu tướng Nguyễn Văn Kiên, Phó Giám đốc Học viện trực tiếp quan sát, đánh giá từng nội dung thực hành bắn và chỉ ra những ưu điểm, hạn chế trong công tác tổ chức, hiệp đồng điều hành bắn.',
      content: `<p>Trong quá trình kiểm tra, Thiếu tướng Nguyễn Văn Kiên, Phó Giám đốc Học viện đã trực tiếp quan sát, đánh giá từng nội dung thực hành bắn, kiểm tra kết quả bắn của các học viên; đồng thời chỉ ra những ưu điểm, hạn chế trong công tác tổ chức, hiệp đồng và điều hành bắn. Trên cơ sở đó, đồng chí yêu cầu các đơn vị rút kinh nghiệm, tiếp tục nâng cao chất lượng trong những đợt kiểm tra tiếp theo.</p>
<p>Bài kiểm tra là cơ sở quan trọng để kiểm chứng nội dung lý thuyết đã huấn luyện, là cơ sở rút kinh nghiệm, tiếp tục đổi mới nội dung, phương pháp huấn luyện, nâng cao chất lượng đào tạo sĩ quan hậu cần, đáp ứng yêu cầu nhiệm vụ trong tình hình mới.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'dao_tao',
      tags: ['huấn luyện', 'bắn súng', 'K54', 'khoá 32', 'đào tạo sĩ quan'],
      isFeatured: false,
      views: 134,
      publishedAt: new Date('2026-04-22T21:30:00Z'),
      authorId: AUTHOR_SECTION,
    },
    {
      slug: 'chuyen-cong-tac-dang-nho-hoc-vien-hoc-vien-hau-can-uc-2026',
      title: 'Chuyến công tác đáng nhớ của người học viên Học viện Quốc phòng tại Úc năm 2026',
      summary: 'Từ 22/3 đến 29/3/2026, theo lời mời của Bộ Quốc phòng Úc, một học viên Học viện Quốc phòng đã tham gia chương trình "Southeast Asia English Language Training Cadet Study Tour 2026" tại Úc.',
      content: `<p>Từ 22/3 đến 29/3/2026, theo lời mời của Bộ Quốc phòng Úc, Bộ Quốc phòng Việt Nam đã tổ chức đoàn công tác, trong đó có sự tham gia của năm học viên, đại diện cho các Học viện, trường Sĩ quan trong toàn quân tham gia chương trình "Southeast Asia English Language Training Cadet Study Tour 2026".</p>
<p>Chia sẻ cảm nghĩ của bản thân, đồng chí Nam cho biết: <em>"Chuyến công tác tham gia chương trình 'Southeast Asia English Language Training Cadet Study Tour 2026' do Bộ Quốc phòng Úc tổ chức là một dấu mốc đáng nhớ trong quá trình học tập, rèn luyện của tôi. Được lựa chọn là đại diện của Học viện Quốc phòng, tôi nhận thức sâu sắc hơn về tầm quan trọng của ngoại ngữ và hợp tác quốc tế trong quân sự."</em></p>
<p>Chuyến đi không chỉ giúp các học viên nâng cao kỹ năng tiếng Anh mà còn mở rộng tầm nhìn về hợp tác quốc phòng khu vực Đông Nam Á và Thái Bình Dương.</p>`,
      coverImage: DEFAULT_NEWS_IMAGE,
      category: 'hop_tac_quoc_te',
      tags: ['hợp tác quốc tế', 'Úc', 'tiếng Anh', 'học viên', 'Đông Nam Á'],
      isFeatured: true,
      views: 521,
      publishedAt: new Date('2026-04-22T22:30:00Z'),
      authorId: AUTHOR_EIC,
    },
    // Thêm 4 bài từ thông báo tuyển sinh
    {
      slug: 'thong-bao-tuyen-sinh-sau-dai-hoc-he-dan-su-nam-2026',
      title: 'Thông báo tuyển sinh sau đại học hệ dân sự năm 2026',
      summary: 'Học viện Quốc phòng thông báo tuyển sinh sau đại học hệ dân sự năm 2026, bao gồm các chuyên ngành Hậu cần quân sự và các chuyên ngành liên quan.',
      content: `<p>Thực hiện kế hoạch đào tạo sau đại học năm 2026, Học viện Quốc phòng thông báo tuyển sinh đào tạo trình độ thạc sĩ hệ dân sự với các thông tin cụ thể như sau:</p>
<h3>Chỉ tiêu tuyển sinh</h3>
<p>Học viện dự kiến tuyển sinh 50 học viên cho ngành Hậu cần quân sự, đào tạo theo hình thức không tập trung (vừa học vừa làm) trong thời gian 2 năm.</p>
<h3>Điều kiện dự tuyển</h3>
<p>Người dự tuyển phải tốt nghiệp đại học ngành phù hợp, có kinh nghiệm công tác từ 2 năm trở lên, đáp ứng các tiêu chuẩn sức khỏe và các điều kiện khác theo quy định.</p>
<h3>Hồ sơ và thời gian nộp</h3>
<p>Hồ sơ đăng ký nộp trực tiếp tại Phòng Đào tạo Học viện Quốc phòng hoặc gửi qua đường bưu điện trước ngày 30/6/2026.</p>`,
      coverImage: `${DEFAULT_NEWS_IMAGE}`,
      category: 'thong_bao',
      tags: ['tuyển sinh', 'sau đại học', 'thạc sĩ', '2026'],
      isFeatured: false,
      views: 892,
      publishedAt: new Date('2026-04-10T08:00:00Z'),
      authorId: AUTHOR_ADMIN,
    },
    {
      slug: 'hoi-dong-tuyen-sinh-thong-bao-chi-tieu-2026',
      title: 'Hội đồng Tuyển sinh Học viện Quốc phòng thông báo chỉ tiêu tuyển sinh năm 2026',
      summary: 'Hội đồng Tuyển sinh Học viện Quốc phòng công bố chỉ tiêu tuyển sinh hệ chính quy năm 2026, bao gồm hệ đào tạo sĩ quan và hệ đào tạo kỹ thuật viên chuyên ngành hậu cần.',
      content: `<p>Căn cứ Quyết định của Bộ trưởng Bộ Quốc phòng về chỉ tiêu tuyển sinh quân sự năm 2026, Hội đồng Tuyển sinh Học viện Quốc phòng thông báo chỉ tiêu và điều kiện tuyển sinh hệ chính quy đào tạo sĩ quan hậu cần năm 2026.</p>
<h3>Chỉ tiêu tuyển sinh</h3>
<p>Tổng chỉ tiêu: 400 học viên, trong đó nam: 350, nữ: 50. Ngành đào tạo: Hậu cần quân sự, Kinh tế quân sự, Kỹ thuật hậu cần.</p>
<h3>Tiêu chuẩn tuyển sinh</h3>
<p>Thí sinh phải là công dân Việt Nam, tốt nghiệp THPT năm 2026, có lý lịch rõ ràng, đủ tiêu chuẩn sức khỏe theo quy định của Bộ Quốc phòng, điểm thi tốt nghiệp THPT đạt ngưỡng điểm xét tuyển do Bộ Quốc phòng quy định.</p>`,
      coverImage: `${DEFAULT_NEWS_IMAGE}`,
      category: 'thong_bao',
      tags: ['tuyển sinh', 'chỉ tiêu', '2026', 'sĩ quan hậu cần'],
      isFeatured: false,
      views: 1245,
      publishedAt: new Date('2026-04-05T09:00:00Z'),
      authorId: AUTHOR_ADMIN,
    },
    {
      slug: 'ket-qua-nghien-cuu-khoa-hoc-cap-hoc-vien-nam-2025',
      title: 'Tổng kết công tác nghiên cứu khoa học cấp Học viện năm 2025 - nhiều kết quả nổi bật',
      summary: 'Năm 2025, Học viện Quốc phòng triển khai 28 đề tài nghiên cứu khoa học các cấp, trong đó có 3 đề tài cấp Bộ Quốc phòng, đạt nhiều kết quả nổi bật trong nghiên cứu ứng dụng lĩnh vực hậu cần kỹ thuật.',
      content: `<p>Năm 2025, Học viện Quốc phòng đã triển khai 28 đề tài nghiên cứu khoa học các cấp, trong đó có 3 đề tài cấp Bộ Quốc phòng, 12 đề tài cấp Học viện và 13 đề tài cấp cơ sở. Tổng kinh phí đầu tư cho nghiên cứu khoa học đạt trên 2,5 tỷ đồng.</p>
<p>Các nghiên cứu tập trung vào các lĩnh vực trọng điểm như: ứng dụng công nghệ thông tin trong quản lý hậu cần; tối ưu hóa chuỗi cung ứng quân sự; nghiên cứu vật liệu mới phục vụ trang bị kỹ thuật; phát triển phương pháp giảng dạy hiện đại cho đào tạo sĩ quan hậu cần.</p>
<p>Nhiều kết quả nghiên cứu đã được ứng dụng trực tiếp vào thực tiễn, nâng cao hiệu quả công tác hậu cần tại các đơn vị trong toàn quân.</p>`,
      coverImage: `${DEFAULT_NEWS_IMAGE}`,
      category: 'nghien_cuu',
      tags: ['nghiên cứu khoa học', 'đề tài', 'cấp Bộ Quốc phòng', '2025'],
      isFeatured: true,
      views: 334,
      publishedAt: new Date('2026-03-20T10:00:00Z'),
      authorId: AUTHOR_EIC,
    },
    {
      slug: 'hoc-vien-hau-can-to-chuc-hoi-thao-khoa-hoc-bao-dam-hau-can-chien-dich',
      title: 'Học viện Quốc phòng tổ chức Hội thảo khoa học quốc gia về bảo đảm hậu cần trong chiến dịch hiện đại',
      summary: 'Hội thảo quy tụ hơn 150 nhà khoa học, chuyên gia hậu cần đầu ngành, tập trung thảo luận về các giải pháp nâng cao năng lực bảo đảm hậu cần trong điều kiện chiến tranh hiện đại.',
      content: `<p>Ngày 15/3/2026, Học viện Quốc phòng tổ chức thành công Hội thảo khoa học quốc gia với chủ đề "Nâng cao năng lực bảo đảm hậu cần trong chiến dịch hiện đại - Lý luận và thực tiễn". Hội thảo thu hút sự tham gia của hơn 150 nhà khoa học, chuyên gia đến từ các học viện, trường quân sự, cơ quan nghiên cứu trong toàn quân và các cơ sở đào tạo dân sự.</p>
<p>Tại hội thảo, các đại biểu đã trình bày và thảo luận về 45 báo cáo khoa học, tập trung vào các vấn đề: lý luận về bảo đảm hậu cần trong chiến tranh hiện đại; kinh nghiệm quốc tế về logistics quân sự; ứng dụng công nghệ số trong quản lý hậu cần; đào tạo nguồn nhân lực hậu cần chất lượng cao.</p>
<p>Kết quả hội thảo sẽ được tổng hợp thành tài liệu khoa học, đóng góp quan trọng vào việc hoàn thiện lý luận và thực tiễn công tác hậu cần quân sự Việt Nam trong giai đoạn mới.</p>`,
      coverImage: `${DEFAULT_NEWS_IMAGE}`,
      category: 'su_kien',
      tags: ['hội thảo', 'khoa học quốc gia', 'chiến dịch', 'bảo đảm hậu cần'],
      isFeatured: true,
      views: 412,
      publishedAt: new Date('2026-03-15T14:00:00Z'),
      authorId: AUTHOR_EIC,
    },
  ]

  const createdNews: string[] = []
  for (const news of newsData) {
    const created = await db.news.create({
      data: {
        ...news,
        isPublished: true,
      },
    })
    createdNews.push(created.id)
  }
  console.log(`  ✅ Đã tạo ${createdNews.length} bài tin tức`)

  // ── 3. Thêm 3 bài nháp (để test giao diện quản lý) ──────────────────────────
  const draftNews = [
    {
      slug: 'draft-bao-cao-tong-ket-nam-hoc-2025-2026',
      title: '[NHÁP] Báo cáo tổng kết năm học 2025-2026 của Học viện Quốc phòng',
      summary: 'Tổng kết kết quả công tác đào tạo, nghiên cứu khoa học và các mặt công tác năm học 2025-2026.',
      content: '<p>Nội dung đang được biên soạn...</p>',
      category: 'hoat_dong',
      tags: ['tổng kết', 'năm học', '2025-2026'],
      isFeatured: false,
      isPublished: false,
      views: 0,
      authorId: AUTHOR_EDITOR,
    },
    {
      slug: 'draft-ke-hoach-dao-tao-nam-2026-2027',
      title: '[NHÁP] Kế hoạch đào tạo năm học 2026-2027',
      summary: 'Kế hoạch chi tiết về các chương trình đào tạo sĩ quan hậu cần năm học 2026-2027.',
      content: '<p>Nội dung đang được biên soạn...</p>',
      category: 'dao_tao',
      tags: ['kế hoạch', 'đào tạo', '2026-2027'],
      isFeatured: false,
      isPublished: false,
      views: 0,
      authorId: AUTHOR_SECTION,
    },
    {
      slug: 'draft-tuyen-dung-giang-vien-2026',
      title: '[NHÁP] Thông báo tuyển dụng giảng viên năm 2026',
      summary: 'Học viện Quốc phòng thông báo tuyển dụng giảng viên các chuyên ngành hậu cần, kỹ thuật và khoa học xã hội.',
      content: '<p>Nội dung đang được biên soạn...</p>',
      category: 'thong_bao',
      tags: ['tuyển dụng', 'giảng viên', '2026'],
      isFeatured: false,
      isPublished: false,
      views: 0,
      authorId: AUTHOR_ADMIN,
    },
  ]

  for (const draft of draftNews) {
    await db.news.create({ data: draft })
  }
  console.log(`  ✅ Đã tạo ${draftNews.length} bài nháp`)

  // ── 4. Videos ───────────────────────────────────────────────────────────────
  // Hệ thống chạy air-gap LAN nên KHÔNG seed video YouTube nữa (không phát được).
  // Video demo LAN (file .mp4 nội bộ) được seed riêng bằng: npm run seed:videos-demo
  console.log('  ⏭  Bỏ qua seed video (dùng file LAN: npm run seed:videos-demo)')

  // ── 5. Banners ────────────────────────────────────────────────────────────────
  const bannersData = [
    {
      title: 'Tạp chí Khoa học Học viện Quốc phòng',
      titleEn: 'Journal of Science - National Defense Academy',
      subtitle: 'Diễn đàn khoa học uy tín hàng đầu về hậu cần quân sự và các lĩnh vực khoa học liên quan',
      subtitleEn: 'Leading scientific forum on military logistics and related scientific fields',
      imageUrl: `${DEFAULT_NEWS_IMAGE}`,
      linkUrl: '/about',
      buttonText: 'Tìm hiểu thêm',
      buttonTextEn: 'Learn More',
      altText: 'Tạp chí Khoa học Học viện Quốc phòng',
      isActive: true,
      position: 1,
      deviceType: 'all',
    },
    {
      title: 'Gửi bài nghiên cứu khoa học năm 2026',
      titleEn: 'Submit Research Paper 2026',
      subtitle: 'Mời các nhà khoa học, giảng viên, nghiên cứu viên gửi bài viết nghiên cứu khoa học đến Tạp chí',
      subtitleEn: 'Invite scientists, lecturers and researchers to submit papers to the Journal',
      imageUrl: `${DEFAULT_NEWS_IMAGE}`,
      linkUrl: '/submit',
      buttonText: 'Gửi bài ngay',
      buttonTextEn: 'Submit Now',
      altText: 'Gửi bài nghiên cứu 2026',
      isActive: true,
      position: 2,
      deviceType: 'all',
    },
    {
      title: 'Số tạp chí mới nhất - Quý I/2026',
      titleEn: 'Latest Issue - Q1/2026',
      subtitle: 'Tạp chí Khoa học Học viện Quốc phòng số 01/2026 đã phát hành với nhiều công trình nghiên cứu giá trị',
      subtitleEn: 'Journal of Science - National Defense Academy Issue 01/2026 has been published',
      imageUrl: `${DEFAULT_NEWS_IMAGE}`,
      linkUrl: '/issues',
      buttonText: 'Đọc ngay',
      buttonTextEn: 'Read Now',
      altText: 'Tạp chí số 01/2026',
      isActive: true,
      position: 3,
      deviceType: 'all',
    },
  ]

  for (const banner of bannersData) {
    await db.banner.create({ data: banner })
  }
  console.log(`  ✅ Đã tạo ${bannersData.length} banner`)

  console.log('\n🎉 Hoàn tất! Tổng kết:')
  console.log(`  📰 ${newsData.length} bài tin (published) + ${draftNews.length} bài nháp`)
  console.log('  🎬 Video: bỏ qua (dùng file LAN: npm run seed:videos-demo)')
  console.log(`  🖼  ${bannersData.length} banner`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
