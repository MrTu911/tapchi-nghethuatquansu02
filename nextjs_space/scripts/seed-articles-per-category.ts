/**
 * Seed 10 bài viết đã xuất bản cho mỗi chuyên mục (11 chuyên mục × 10 = 110 bài)
 * Mục tiêu: cung cấp dữ liệu hiển thị trang chủ và trang chuyên mục
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Nội dung bài viết theo từng chuyên mục ───────────────────────────────────

const ARTICLES_BY_CATEGORY: Record<string, Array<{
  title: string
  abstractVn: string
  abstractEn: string
  keywords: string[]
  isFeatured?: boolean
}>> = {
  CDHD: [
    {
      title: 'Chỉ thị về tăng cường công tác hậu cần trong tình hình mới',
      abstractVn: 'Bài viết phân tích các chỉ thị của Bộ Quốc phòng về tăng cường công tác hậu cần quân sự trong giai đoạn hiện nay, nhấn mạnh vào việc nâng cao năng lực tổ chức và quản lý nguồn lực hậu cần.',
      abstractEn: 'This article analyzes the Ministry of National Defense directives on strengthening military logistics in the current period, emphasizing improving organizational capacity and logistics resource management.',
      keywords: ['chỉ thị', 'hậu cần quân sự', 'tình hình mới', 'Bộ Quốc phòng'],
      isFeatured: true,
    },
    {
      title: 'Hướng dẫn thực hiện Nghị quyết về đổi mới công tác bảo đảm hậu cần',
      abstractVn: 'Tài liệu hướng dẫn chi tiết việc triển khai Nghị quyết số 05/NQ-QUTƯ về đổi mới, nâng cao chất lượng công tác bảo đảm hậu cần cho lực lượng vũ trang trong giai đoạn 2024–2030.',
      abstractEn: 'Detailed guidance on implementing Resolution No. 05/NQ-QUTƯ on innovation and quality improvement of logistics assurance for armed forces in the 2024–2030 period.',
      keywords: ['nghị quyết', 'bảo đảm hậu cần', 'lực lượng vũ trang', 'đổi mới'],
    },
    {
      title: 'Chỉ đạo xây dựng kho hậu cần chiến lược trong điều kiện hiện đại hóa',
      abstractVn: 'Phân tích các chỉ đạo của cấp trên về xây dựng hệ thống kho hậu cần chiến lược, đáp ứng yêu cầu tổ chức hậu cần trong điều kiện quân đội đang thực hiện hiện đại hóa toàn diện.',
      abstractEn: 'Analysis of higher-level directives on building a strategic logistics warehouse system to meet logistics organizational requirements under conditions of comprehensive military modernization.',
      keywords: ['kho chiến lược', 'hiện đại hóa', 'hậu cần chiến lược', 'xây dựng'],
    },
    {
      title: 'Văn bản hướng dẫn quản lý trang bị kỹ thuật hậu cần cấp chiến dịch',
      abstractVn: 'Bài viết tổng hợp các văn bản hướng dẫn về quản lý, sử dụng trang bị kỹ thuật hậu cần cấp chiến dịch, bao gồm quy trình kiểm kê, bảo dưỡng và bàn giao.',
      abstractEn: 'A synthesis of guidance documents on management and use of campaign-level logistics technical equipment, including inventory, maintenance and handover procedures.',
      keywords: ['trang bị kỹ thuật', 'chiến dịch', 'quản lý', 'kiểm kê'],
    },
    {
      title: 'Chỉ đạo nâng cao hiệu quả công tác quân y trong hậu cần tác chiến',
      abstractVn: 'Tổng quan về các chỉ đạo tăng cường năng lực quân y trong hệ thống hậu cần tác chiến, đặc biệt chú trọng công tác cứu thương tiền tuyến và hậu phương.',
      abstractEn: 'Overview of directives to enhance military medical capacity within the combat logistics system, with particular emphasis on frontline and rear casualty care.',
      keywords: ['quân y', 'tác chiến', 'cứu thương', 'hậu cần'],
    },
    {
      title: 'Hướng dẫn tổ chức bảo đảm lương thực, thực phẩm cho bộ đội trong chiến đấu',
      abstractVn: 'Tài liệu hướng dẫn cụ thể việc tổ chức bảo đảm lương thực, thực phẩm cho bộ đội trong các tình huống chiến đấu, dã ngoại và diễn tập lớn.',
      abstractEn: 'Specific guidance documents on organizing food and provisions assurance for troops in combat, field operations and large-scale exercises.',
      keywords: ['lương thực', 'thực phẩm', 'chiến đấu', 'bảo đảm'],
    },
    {
      title: 'Chỉ thị về đổi mới quản lý tài chính hậu cần trong đơn vị cơ sở',
      abstractVn: 'Phân tích nội dung chỉ thị về đổi mới cơ chế quản lý tài chính hậu cần tại các đơn vị cơ sở, nhằm tăng cường tính minh bạch và hiệu quả sử dụng ngân sách quốc phòng.',
      abstractEn: 'Analysis of directives on reforming the financial management mechanism for logistics at grassroots units, to enhance transparency and effective use of defense budget.',
      keywords: ['tài chính', 'quản lý', 'đơn vị cơ sở', 'minh bạch'],
    },
    {
      title: 'Văn bản chỉ đạo ứng dụng công nghệ thông tin trong quản lý hậu cần',
      abstractVn: 'Hệ thống văn bản chỉ đạo về việc ứng dụng công nghệ thông tin, phần mềm quản lý vào công tác nghệ thuật quân sự, từ quản lý kho đến theo dõi logistic.',
      abstractEn: 'System of directives on applying information technology and management software to military logistics work, from warehouse management to logistics tracking.',
      keywords: ['công nghệ thông tin', 'phần mềm', 'quản lý kho', 'logistic'],
    },
    {
      title: 'Chỉ đạo xây dựng nguồn nhân lực hậu cần chất lượng cao',
      abstractVn: 'Các chỉ đạo về công tác đào tạo, bồi dưỡng cán bộ hậu cần chuyên nghiệp, xây dựng đội ngũ sĩ quan hậu cần có trình độ lý luận và thực tiễn đáp ứng yêu cầu nhiệm vụ.',
      abstractEn: 'Directives on training and developing professional logistics cadres, building a corps of logistics officers with both theoretical and practical capacity to meet mission requirements.',
      keywords: ['nhân lực', 'đào tạo', 'sĩ quan hậu cần', 'chất lượng cao'],
    },
    {
      title: 'Hướng dẫn công tác kiểm tra, giám sát hoạt động hậu cần các cấp',
      abstractVn: 'Tài liệu hướng dẫn về phương pháp và quy trình kiểm tra, giám sát hoạt động hậu cần từ cấp chiến lược đến cấp cơ sở, đảm bảo thực hiện đúng chỉ thị, mệnh lệnh.',
      abstractEn: 'Guidance documents on methods and procedures for inspecting and supervising logistics activities from strategic to grassroots level, ensuring compliance with directives and orders.',
      keywords: ['kiểm tra', 'giám sát', 'các cấp', 'quy trình'],
    },
  ],

  NVDC: [
    {
      title: 'Lý luận về hậu cần quân sự trong chiến tranh nhân dân hiện đại',
      abstractVn: 'Bài viết phân tích sâu các vấn đề lý luận về hậu cần quân sự trong điều kiện chiến tranh nhân dân hiện đại, gắn với học thuyết quân sự Việt Nam và kinh nghiệm quốc tế.',
      abstractEn: 'An in-depth analysis of theoretical issues in military logistics under modern people\'s war conditions, linked to Vietnamese military doctrine and international experience.',
      keywords: ['lý luận', 'chiến tranh nhân dân', 'hậu cần', 'học thuyết'],
      isFeatured: true,
    },
    {
      title: 'Những vấn đề cơ bản về tổ chức hậu cần trong tác chiến phi đối xứng',
      abstractVn: 'Nghiên cứu các vấn đề cơ bản về tổ chức hậu cần trong điều kiện tác chiến phi đối xứng, rút ra bài học từ các cuộc xung đột hiện đại trên thế giới.',
      abstractEn: 'Study of fundamental issues in logistics organization under asymmetric warfare conditions, drawing lessons from modern conflicts worldwide.',
      keywords: ['tác chiến phi đối xứng', 'tổ chức hậu cần', 'bài học', 'xung đột'],
    },
    {
      title: 'Vai trò của hậu cần trong bảo đảm sức chiến đấu bền vững',
      abstractVn: 'Phân tích vai trò then chốt của hệ thống hậu cần trong việc duy trì và nâng cao sức chiến đấu bền vững của quân đội, đặc biệt trong các chiến dịch kéo dài.',
      abstractEn: 'Analysis of the pivotal role of the logistics system in maintaining and enhancing the sustained combat capability of the military, especially in prolonged campaigns.',
      keywords: ['sức chiến đấu', 'bền vững', 'chiến dịch', 'hệ thống hậu cần'],
    },
    {
      title: 'Chuỗi cung ứng quân sự - Lý luận và thực tiễn ở Việt Nam',
      abstractVn: 'Tổng quan lý luận về chuỗi cung ứng quân sự và đánh giá thực tiễn xây dựng chuỗi cung ứng hậu cần tại Việt Nam trong bối cảnh hội nhập quốc tế.',
      abstractEn: 'A theoretical overview of military supply chains and an evaluation of the practical development of logistics supply chains in Vietnam in the context of international integration.',
      keywords: ['chuỗi cung ứng', 'quân sự', 'Việt Nam', 'hội nhập'],
    },
    {
      title: 'Những vấn đề về hậu cần trong tác chiến đô thị',
      abstractVn: 'Nghiên cứu những thách thức và giải pháp đặc thù về tổ chức hậu cần trong môi trường tác chiến đô thị, nơi các phương thức bảo đảm truyền thống gặp nhiều hạn chế.',
      abstractEn: 'Research on specific challenges and solutions for logistics organization in urban warfare environments, where traditional assurance methods face many limitations.',
      keywords: ['tác chiến đô thị', 'thách thức', 'giải pháp', 'hậu cần'],
    },
    {
      title: 'Nghệ thuật tác chiến trong điều kiện chiến tranh mạng và không gian mạng',
      abstractVn: 'Phân tích các vấn đề mới nảy sinh trong tổ chức hậu cần quân sự khi tích hợp với tác chiến mạng, bảo vệ hệ thống thông tin hậu cần trước các mối đe dọa không gian mạng.',
      abstractEn: 'Analysis of new issues arising in military logistics organization when integrated with cyber warfare, and protection of logistics information systems against cyber threats.',
      keywords: ['chiến tranh mạng', 'không gian mạng', 'bảo vệ', 'thông tin hậu cần'],
    },
    {
      title: 'Tự chủ chiến lược trong hậu cần quân sự quốc gia',
      abstractVn: 'Luận bàn về tầm quan trọng của tự chủ chiến lược trong xây dựng hệ thống hậu cần quốc gia, giảm phụ thuộc vào nguồn cung nước ngoài trong các tình huống khủng hoảng.',
      abstractEn: 'Discussion on the importance of strategic autonomy in building the national logistics system, reducing dependence on foreign supply sources in crisis situations.',
      keywords: ['tự chủ chiến lược', 'hậu cần quốc gia', 'khủng hoảng', 'nguồn cung'],
    },
    {
      title: 'Mối quan hệ giữa hậu cần quân sự và hậu cần quốc gia',
      abstractVn: 'Nghiên cứu mối quan hệ biện chứng giữa hệ thống hậu cần quân sự và hậu cần quốc gia, từ đó đề xuất cơ chế phối hợp hiệu quả trong thời bình và thời chiến.',
      abstractEn: 'Study of the dialectical relationship between the military logistics system and national logistics, proposing effective coordination mechanisms in peacetime and wartime.',
      keywords: ['hậu cần quốc gia', 'phối hợp', 'thời bình', 'thời chiến'],
    },
    {
      title: 'Vấn đề bảo đảm hậu cần trong các hoạt động gìn giữ hòa bình',
      abstractVn: 'Đánh giá kinh nghiệm và thách thức trong bảo đảm hậu cần cho các đơn vị Việt Nam tham gia hoạt động gìn giữ hòa bình Liên Hợp Quốc ở nước ngoài.',
      abstractEn: 'Assessment of experiences and challenges in logistics assurance for Vietnamese units participating in UN peacekeeping operations abroad.',
      keywords: ['gìn giữ hòa bình', 'Liên Hợp Quốc', 'kinh nghiệm', 'thách thức'],
    },
    {
      title: 'Những vấn đề lý luận về hậu cần biển đảo trong bảo vệ chủ quyền',
      abstractVn: 'Phân tích hệ thống lý luận về tổ chức hậu cần biển đảo trong sứ mệnh bảo vệ chủ quyền biển đảo Việt Nam, gồm các đặc thù về địa lý, hải văn và tác chiến.',
      abstractEn: 'Analysis of the theoretical system for maritime island logistics in Vietnam\'s sovereignty protection mission, including geographic, oceanographic and operational characteristics.',
      keywords: ['biển đảo', 'chủ quyền', 'hậu cần biển', 'địa lý'],
    },
  ],

  NCTD: [
    {
      title: 'Nghiên cứu ứng dụng trí tuệ nhân tạo trong dự báo nhu cầu hậu cần',
      abstractVn: 'Bài báo trình bày kết quả nghiên cứu ứng dụng thuật toán học máy và trí tuệ nhân tạo trong dự báo nhu cầu hậu cần, giúp tối ưu hóa dự trữ và giảm lãng phí.',
      abstractEn: 'This paper presents research results on applying machine learning algorithms and artificial intelligence in forecasting logistics demand, helping optimize inventory and reduce waste.',
      keywords: ['trí tuệ nhân tạo', 'học máy', 'dự báo', 'tối ưu hóa'],
      isFeatured: true,
    },
    {
      title: 'Trao đổi về mô hình hậu cần tích hợp cho quân đội hiện đại',
      abstractVn: 'Bài viết trao đổi về mô hình hậu cần tích hợp, kết hợp bảo đảm vật chất và dịch vụ hậu cần trong một hệ thống thống nhất, phù hợp với yêu cầu của quân đội hiện đại.',
      abstractEn: 'Discussion of an integrated logistics model combining material assurance and logistics services in a unified system, suitable for modern military requirements.',
      keywords: ['mô hình tích hợp', 'dịch vụ hậu cần', 'hệ thống', 'hiện đại'],
    },
    {
      title: 'Nghiên cứu xây dựng chỉ số đánh giá hiệu quả hệ thống hậu cần',
      abstractVn: 'Nghiên cứu đề xuất bộ chỉ số KPI đánh giá toàn diện hiệu quả hoạt động hệ thống nghệ thuật quân sự, từ cấp chiến thuật đến cấp chiến lược.',
      abstractEn: 'Research proposing a comprehensive set of KPIs to evaluate the operational effectiveness of the military logistics system, from tactical to strategic levels.',
      keywords: ['KPI', 'chỉ số đánh giá', 'hiệu quả', 'chiến lược'],
    },
    {
      title: 'Trao đổi về kinh nghiệm hậu cần quân đội các nước ASEAN',
      abstractVn: 'So sánh và trao đổi kinh nghiệm về tổ chức hậu cần quân sự của các nước ASEAN, rút ra bài học có thể áp dụng vào thực tiễn xây dựng hậu cần Việt Nam.',
      abstractEn: 'Comparison and exchange of military logistics organization experiences among ASEAN countries, drawing applicable lessons for building Vietnamese logistics.',
      keywords: ['ASEAN', 'kinh nghiệm quốc tế', 'so sánh', 'bài học'],
    },
    {
      title: 'Nghiên cứu mô hình logistics xanh trong hậu cần quân sự',
      abstractVn: 'Nghiên cứu khả năng áp dụng mô hình logistics xanh, thân thiện môi trường trong hệ thống nghệ thuật quân sự, đáp ứng cam kết về bảo vệ môi trường của quốc gia.',
      abstractEn: 'Study of the feasibility of applying green, environmentally friendly logistics models in the military logistics system, meeting national environmental protection commitments.',
      keywords: ['logistics xanh', 'môi trường', 'bền vững', 'phát triển xanh'],
    },
    {
      title: 'Trao đổi về cải tiến quy trình bảo dưỡng vũ khí, trang bị hậu cần',
      abstractVn: 'Bài trao đổi về các phương pháp cải tiến quy trình bảo dưỡng vũ khí và trang bị hậu cần, áp dụng tiếp cận bảo dưỡng dự phòng và công nghệ số.',
      abstractEn: 'Discussion of methods to improve weapons and logistics equipment maintenance processes, applying predictive maintenance approaches and digital technology.',
      keywords: ['bảo dưỡng', 'vũ khí trang bị', 'dự phòng', 'công nghệ số'],
    },
    {
      title: 'Nghiên cứu hệ thống thông tin hậu cần tích hợp thời gian thực',
      abstractVn: 'Đề xuất kiến trúc hệ thống thông tin hậu cần tích hợp thời gian thực, cho phép chỉ huy theo dõi trạng thái hậu cần toàn diện trong mọi điều kiện tác chiến.',
      abstractEn: 'Proposal for a real-time integrated logistics information system architecture, allowing commanders to comprehensively monitor logistics status in all operational conditions.',
      keywords: ['hệ thống thông tin', 'thời gian thực', 'tích hợp', 'chỉ huy'],
    },
    {
      title: 'Trao đổi về xã hội hóa một số dịch vụ hậu cần trong quân đội',
      abstractVn: 'Luận bàn về chủ trương và điều kiện xã hội hóa một số dịch vụ hậu cần không thuộc lĩnh vực cốt lõi chiến đấu, nhằm giải phóng lực lượng và tập trung cho nhiệm vụ quân sự.',
      abstractEn: 'Discussion of the policy and conditions for socializing certain non-core combat logistics services, to free up forces and focus on military missions.',
      keywords: ['xã hội hóa', 'dịch vụ hậu cần', 'cải cách', 'hiệu quả'],
    },
    {
      title: 'Nghiên cứu tác động của biến đổi khí hậu đến hậu cần quân sự',
      abstractVn: 'Phân tích tác động của biến đổi khí hậu và thiên tai đến khả năng bảo đảm hậu cần, đề xuất các giải pháp thích ứng và tăng cường khả năng phục hồi.',
      abstractEn: 'Analysis of the impact of climate change and natural disasters on logistics assurance capability, proposing adaptation solutions and resilience enhancement.',
      keywords: ['biến đổi khí hậu', 'thiên tai', 'thích ứng', 'phục hồi'],
    },
    {
      title: 'Trao đổi về chuẩn hóa thiết bị hậu cần trong liên minh quân sự',
      abstractVn: 'Nghiên cứu về tầm quan trọng và cách tiếp cận chuẩn hóa thiết bị hậu cần trong khuôn khổ hợp tác quân sự quốc tế, chia sẻ kinh nghiệm của NATO và các liên minh khác.',
      abstractEn: 'Research on the importance and approach to standardizing logistics equipment in international military cooperation frameworks, sharing experiences from NATO and other alliances.',
      keywords: ['chuẩn hóa', 'liên minh quân sự', 'NATO', 'hợp tác quốc tế'],
    },
  ],

  TTKN: [
    {
      title: 'Kinh nghiệm tổ chức hậu cần trong chiến dịch Hồ Chí Minh năm 1975',
      abstractVn: 'Bài viết tổng kết kinh nghiệm tổ chức hậu cần trong Chiến dịch Hồ Chí Minh lịch sử, phân tích các bài học về bảo đảm hậu cần cho chiến dịch tiến công lớn.',
      abstractEn: 'Summary of logistics organization experience in the historic Ho Chi Minh Campaign, analyzing lessons on logistics assurance for large-scale offensive campaigns.',
      keywords: ['Chiến dịch Hồ Chí Minh', '1975', 'kinh nghiệm lịch sử', 'tiến công'],
      isFeatured: true,
    },
    {
      title: 'Thực tiễn bảo đảm hậu cần trong diễn tập Trung đoàn bộ binh',
      abstractVn: 'Báo cáo thực tiễn về công tác bảo đảm hậu cần trong một cuộc diễn tập quy mô trung đoàn, rút ra các bài học kinh nghiệm về quy trình, tổ chức và phối hợp.',
      abstractEn: 'Practical report on logistics assurance in a regimental-scale exercise, drawing lessons on procedures, organization and coordination.',
      keywords: ['diễn tập', 'trung đoàn', 'thực tiễn', 'phối hợp'],
    },
    {
      title: 'Kinh nghiệm xây dựng kho hậu cần dã chiến trong điều kiện khó khăn',
      abstractVn: 'Chia sẻ kinh nghiệm thực tiễn về xây dựng và quản lý kho hậu cần dã chiến trong điều kiện địa hình phức tạp, thời tiết khắc nghiệt và nguồn lực hạn chế.',
      abstractEn: 'Sharing of practical experience in building and managing field logistics depots under conditions of complex terrain, harsh weather and limited resources.',
      keywords: ['kho dã chiến', 'địa hình phức tạp', 'thời tiết khắc nghiệt', 'kinh nghiệm'],
    },
    {
      title: 'Thực tiễn ứng phó hậu cần trong phòng chống thiên tai, lũ lụt',
      abstractVn: 'Tổng kết kinh nghiệm thực tiễn về huy động và tổ chức hậu cần quân sự trong các hoạt động phòng chống thiên tai và cứu hộ cứu nạn lũ lụt tại miền Trung.',
      abstractEn: 'Summary of practical experience in mobilizing and organizing military logistics in disaster prevention and flood relief operations in Central Vietnam.',
      keywords: ['thiên tai', 'lũ lụt', 'cứu hộ', 'miền Trung'],
    },
    {
      title: 'Kinh nghiệm bảo đảm xăng dầu cho lực lượng cơ giới hóa',
      abstractVn: 'Chia sẻ kinh nghiệm tổ chức bảo đảm xăng dầu cho các đơn vị cơ giới hóa trong điều kiện vận động và chiến đấu liên tục, đảm bảo không gián đoạn nhiên liệu.',
      abstractEn: 'Sharing of experience in organizing petroleum product assurance for mechanized units under conditions of continuous movement and combat, ensuring no fuel interruption.',
      keywords: ['xăng dầu', 'cơ giới hóa', 'nhiên liệu', 'vận động'],
    },
    {
      title: 'Thực tiễn triển khai bếp dã chiến phục vụ chiến sĩ trong huấn luyện',
      abstractVn: 'Báo cáo thực tiễn về triển khai hệ thống bếp dã chiến, bảo đảm chất lượng bữa ăn cho bộ đội trong các đợt huấn luyện tập trung kéo dài tại rừng núi.',
      abstractEn: 'Practical report on deploying field kitchen systems, ensuring food quality for troops in extended concentrated training in forested mountain areas.',
      keywords: ['bếp dã chiến', 'huấn luyện', 'rừng núi', 'bữa ăn'],
    },
    {
      title: 'Kinh nghiệm quản lý vật tư y tế hậu cần trong phòng dịch COVID-19',
      abstractVn: 'Tổng kết kinh nghiệm quản lý, phân phối vật tư y tế và hậu cần trong thời gian quân đội tham gia phòng, chống dịch bệnh COVID-19 toàn quốc.',
      abstractEn: 'Summary of experience in managing and distributing medical supplies and logistics during the military\'s participation in national COVID-19 epidemic prevention.',
      keywords: ['COVID-19', 'vật tư y tế', 'phòng dịch', 'phân phối'],
    },
    {
      title: 'Thực tiễn xây dựng căn cứ hậu cần tiền phương trên đảo',
      abstractVn: 'Chia sẻ kinh nghiệm thực tiễn xây dựng và duy trì căn cứ hậu cần tiền phương trên các đảo tiền tiêu, vượt qua thách thức về tiếp vận và điều kiện tự nhiên.',
      abstractEn: 'Sharing of practical experience in building and maintaining forward logistics bases on outlying islands, overcoming challenges in resupply and natural conditions.',
      keywords: ['căn cứ tiền phương', 'đảo tiền tiêu', 'tiếp vận', 'thách thức'],
    },
    {
      title: 'Kinh nghiệm hậu cần Quân khu 4 trong chiến tranh biên giới Tây Nam',
      abstractVn: 'Hệ thống kinh nghiệm về tổ chức hậu cần của Quân khu 4 trong chiến tranh biên giới Tây Nam 1977–1989, đặc biệt trong bảo đảm cho tuyến hành lang chiến lược.',
      abstractEn: 'Systematic experience of Military Region 4\'s logistics organization in the 1977–1989 Southwestern Border War, particularly in assuring the strategic corridor.',
      keywords: ['Quân khu 4', 'biên giới Tây Nam', 'hành lang chiến lược', 'lịch sử'],
    },
    {
      title: 'Thực tiễn ứng dụng phần mềm quản lý hậu cần tại đơn vị cấp sư đoàn',
      abstractVn: 'Báo cáo thực tiễn triển khai và sử dụng phần mềm quản lý hậu cần số hóa tại cấp sư đoàn, bao gồm kết quả đạt được, hạn chế và kiến nghị hoàn thiện.',
      abstractEn: 'Practical report on the deployment and use of digital logistics management software at division level, including achievements, limitations and improvement recommendations.',
      keywords: ['phần mềm', 'số hóa', 'sư đoàn', 'quản lý hậu cần'],
    },
  ],

  LSHK: [
    {
      title: 'Lịch sử hình thành và phát triển ngành hậu cần Quân đội nhân dân Việt Nam (1945–1954)',
      abstractVn: 'Nghiên cứu lịch sử hình thành và những bước phát triển đầu tiên của ngành hậu cần Quân đội nhân dân Việt Nam từ khi thành lập đến kết thúc cuộc kháng chiến chống Pháp.',
      abstractEn: 'Research on the formation history and first developmental steps of the Vietnam People\'s Army logistics corps from its founding to the end of the resistance war against France.',
      keywords: ['lịch sử', '1945', 'kháng chiến', 'hình thành'],
      isFeatured: true,
    },
    {
      title: 'Kỹ thuật quân sự Việt Nam qua các giai đoạn lịch sử',
      abstractVn: 'Tổng quan lịch sử phát triển kỹ thuật quân sự Việt Nam từ thời phong kiến đến hiện đại, phân tích sự tiến hóa của vũ khí, trang bị và phương tiện chiến đấu.',
      abstractEn: 'Overview of the development history of Vietnamese military technology from feudal times to modernity, analyzing the evolution of weapons, equipment and combat vehicles.',
      keywords: ['kỹ thuật quân sự', 'lịch sử', 'vũ khí', 'tiến hóa'],
    },
    {
      title: 'Hậu cần đường Trường Sơn trong kháng chiến chống Mỹ',
      abstractVn: 'Nghiên cứu hệ thống hậu cần trên đường Trường Sơn - tuyến vận tải chiến lược quan trọng nhất trong cuộc kháng chiến chống Mỹ cứu nước, với những sáng tạo độc đáo về tổ chức và vận hành.',
      abstractEn: 'Research on the logistics system along the Ho Chi Minh Trail - the most important strategic transport corridor in the resistance war against America, with unique organizational and operational innovations.',
      keywords: ['Trường Sơn', 'đường Hồ Chí Minh', 'vận tải', 'kháng chiến chống Mỹ'],
    },
    {
      title: 'Sự phát triển của xe tăng và thiết giáp trong kỹ thuật quân sự Việt Nam',
      abstractVn: 'Lịch sử ứng dụng và phát triển lực lượng xe tăng, thiết giáp trong quân đội Việt Nam, từ những chiếc T-34 đầu tiên đến các thế hệ xe tăng hiện đại ngày nay.',
      abstractEn: 'History of the application and development of tank and armored forces in the Vietnamese military, from the first T-34s to modern tank generations today.',
      keywords: ['xe tăng', 'thiết giáp', 'T-34', 'phát triển'],
    },
    {
      title: 'Lịch sử phát triển hậu cần hải quân Việt Nam',
      abstractVn: 'Nghiên cứu lịch sử hình thành và phát triển hậu cần hải quân Việt Nam, từ những ngày đầu thành lập đến khi trở thành lực lượng hậu cần biển đảo vững mạnh.',
      abstractEn: 'Research on the formation and development history of Vietnam Naval logistics, from its early days to becoming a strong maritime logistics force.',
      keywords: ['hải quân', 'hậu cần biển', 'lịch sử', 'phát triển'],
    },
    {
      title: 'Đóng góp của phụ nữ trong hậu cần kháng chiến',
      abstractVn: 'Ghi nhận và tôn vinh những đóng góp to lớn của phụ nữ Việt Nam trong công tác hậu cần kháng chiến qua hai cuộc kháng chiến trường kỳ của dân tộc.',
      abstractEn: 'Recognition and tribute to the great contributions of Vietnamese women in resistance logistics work through two protracted national resistance wars.',
      keywords: ['phụ nữ', 'kháng chiến', 'đóng góp', 'lịch sử'],
    },
    {
      title: 'Lịch sử phát triển công nghiệp quốc phòng phục vụ hậu cần',
      abstractVn: 'Tổng quan lịch sử hình thành và phát triển nền công nghiệp quốc phòng Việt Nam, với trọng tâm là sản xuất vật tư, trang bị phục vụ nghệ thuật quân sự.',
      abstractEn: 'Overview of the formation and development history of Vietnam\'s defense industry, focusing on production of materials and equipment for military logistics.',
      keywords: ['công nghiệp quốc phòng', 'sản xuất', 'trang bị', 'lịch sử'],
    },
    {
      title: 'Kỹ thuật pháo binh Việt Nam qua các cuộc chiến tranh',
      abstractVn: 'Nghiên cứu sự phát triển kỹ thuật và chiến thuật pháo binh Việt Nam qua các cuộc chiến tranh, từ những khẩu pháo thô sơ đến hệ thống pháo hiện đại.',
      abstractEn: 'Research on the development of Vietnamese artillery techniques and tactics through the wars, from primitive cannons to modern artillery systems.',
      keywords: ['pháo binh', 'kỹ thuật', 'chiến thuật', 'phát triển'],
    },
    {
      title: 'Lịch sử hậu cần Quân khu 5 trong chiến tranh giải phóng',
      abstractVn: 'Tái hiện lịch sử tổ chức và hoạt động hậu cần của Quân khu 5 trong cuộc chiến tranh giải phóng miền Nam, với những nét đặc sắc về thích ứng với địa hình Tây Nguyên và duyên hải.',
      abstractEn: 'Reconstruction of the logistics organization and operations history of Military Region 5 in the Southern liberation war, with distinctive features of adaptation to Highland and coastal terrain.',
      keywords: ['Quân khu 5', 'Tây Nguyên', 'giải phóng', 'lịch sử'],
    },
    {
      title: 'Nguồn gốc và sự phát triển của hệ thống hậu cần phòng không',
      abstractVn: 'Lịch sử hình thành, phát triển và các bước trưởng thành của hệ thống hậu cần phục vụ lực lượng phòng không Việt Nam qua các cuộc kháng chiến.',
      abstractEn: 'History of the formation, development and maturation of the logistics system serving the Vietnamese air defense forces through the resistance wars.',
      keywords: ['phòng không', 'hậu cần', 'lịch sử hình thành', 'trưởng thành'],
    },
  ],

  LSTT: [
    {
      title: 'Truyền thống vẻ vang của lực lượng hậu cần Cục Hậu cần Quân đội',
      abstractVn: 'Bài viết tôn vinh những truyền thống vẻ vang của Cục Hậu cần Quân đội trong suốt chặng đường lịch sử xây dựng và chiến đấu, là niềm tự hào của toàn quân.',
      abstractEn: 'Article honoring the glorious traditions of the Army Logistics Department throughout the historical journey of building and fighting, a pride of the entire army.',
      keywords: ['truyền thống', 'Cục Hậu cần', 'vẻ vang', 'lịch sử'],
      isFeatured: true,
    },
    {
      title: 'Những tấm gương tiêu biểu trong lực lượng hậu cần quân sự',
      abstractVn: 'Tuyển tập gương điển hình về các cán bộ, chiến sĩ hậu cần quân sự tiêu biểu, những người đã có những đóng góp xuất sắc trong bảo đảm hậu cần qua các thời kỳ.',
      abstractEn: 'Collection of typical examples of outstanding military logistics officers and soldiers who have made excellent contributions to logistics assurance through the ages.',
      keywords: ['gương điển hình', 'tiêu biểu', 'đóng góp', 'xuất sắc'],
    },
    {
      title: 'Anh hùng Lực lượng vũ trang nhân dân trong ngành hậu cần',
      abstractVn: 'Giới thiệu về các Anh hùng Lực lượng vũ trang nhân dân trong ngành nghệ thuật quân sự, những người đã lập công xuất sắc và được Nhà nước phong tặng danh hiệu cao quý.',
      abstractEn: 'Introduction to Heroes of the People\'s Armed Forces in the Vietnamese military art sector, those who have distinguished themselves and been awarded the prestigious title by the State.',
      keywords: ['Anh hùng', 'Lực lượng vũ trang', 'danh hiệu', 'công trạng'],
    },
    {
      title: 'Truyền thống đoàn kết quân dân trong bảo đảm hậu cần',
      abstractVn: 'Phân tích truyền thống đoàn kết quân dân trong công tác bảo đảm hậu cần chiến tranh và hòa bình, biểu hiện cụ thể qua các sự kiện lịch sử tiêu biểu.',
      abstractEn: 'Analysis of the army-people solidarity tradition in wartime and peacetime logistics assurance, manifested concretely through typical historical events.',
      keywords: ['đoàn kết quân dân', 'truyền thống', 'hậu cần', 'lịch sử'],
    },
    {
      title: 'Phong trào thi đua "Quyết tâm chiến thắng" trong hậu cần',
      abstractVn: 'Tổng kết phong trào thi đua trong lực lượng hậu cần qua các thời kỳ, từ phong trào "Quyết tâm chiến thắng" thời chiến đến các phong trào thi đua đổi mới trong thời bình.',
      abstractEn: 'Review of emulation movements in logistics forces through the ages, from the "Determined to Win" movement in wartime to innovation emulation movements in peacetime.',
      keywords: ['thi đua', 'phong trào', 'chiến thắng', 'đổi mới'],
    },
    {
      title: 'Truyền thống vượt khó của hậu cần trong điều kiện bao vây cấm vận',
      abstractVn: 'Nhìn lại giai đoạn hậu cần quân sự Việt Nam vượt qua khó khăn trong điều kiện bao vây, cấm vận, thể hiện ý chí tự lực, tự cường của quân đội và nhân dân.',
      abstractEn: 'Looking back at the period when Vietnamese military logistics overcame difficulties under embargo conditions, demonstrating the self-reliant spirit of the army and people.',
      keywords: ['bao vây', 'cấm vận', 'tự lực', 'vượt khó'],
    },
    {
      title: 'Di sản tinh thần trong hậu cần quân đội Việt Nam',
      abstractVn: 'Phân tích di sản tinh thần và giá trị văn hóa trong ngành hậu cần quân đội Việt Nam, những giá trị cần được gìn giữ và phát huy trong thời đại mới.',
      abstractEn: 'Analysis of spiritual heritage and cultural values in the Vietnamese Vietnamese military art sector, values that need to be preserved and promoted in the new era.',
      keywords: ['di sản tinh thần', 'văn hóa', 'giá trị', 'phát huy'],
    },
    {
      title: 'Truyền thống hậu cần Sư đoàn 325 trong các cuộc chiến tranh',
      abstractVn: 'Ghi chép về truyền thống hậu cần của Sư đoàn 325 qua các cuộc chiến tranh bảo vệ Tổ quốc, những kinh nghiệm quý báu và chiến công hậu cần đặc sắc.',
      abstractEn: 'Notes on the logistics tradition of Division 325 through the wars defending the homeland, precious experiences and distinctive logistics achievements.',
      keywords: ['Sư đoàn 325', 'truyền thống', 'bảo vệ Tổ quốc', 'chiến công'],
    },
    {
      title: 'Những câu chuyện hậu cần trong Chiến dịch Điện Biên Phủ',
      abstractVn: 'Tập hợp những câu chuyện xúc động về công tác hậu cần trong Chiến dịch Điện Biên Phủ lịch sử, thể hiện tinh thần "tất cả cho tiền tuyến" của hậu phương.',
      abstractEn: 'Collection of moving stories about logistics work in the historic Dien Bien Phu Campaign, reflecting the spirit of "everything for the front" of the rear.',
      keywords: ['Điện Biên Phủ', 'câu chuyện', 'hậu phương', 'tiền tuyến'],
    },
    {
      title: 'Bảo tàng Hậu cần - Kho tàng lịch sử và truyền thống',
      abstractVn: 'Giới thiệu Bảo tàng Hậu cần Quân đội với các hiện vật lịch sử quý giá, là nơi lưu giữ và phát huy truyền thống của ngành hậu cần quân sự Việt Nam.',
      abstractEn: 'Introduction to the Vietnam Military Art Museum with its precious historical artifacts, a place to preserve and promote the traditions of the Vietnamese Vietnamese military art sector.',
      keywords: ['Bảo tàng Hậu cần', 'hiện vật', 'lưu giữ', 'phát huy'],
    },
  ],

  KHKT: [
    {
      title: 'Công nghệ blockchain trong quản lý chuỗi cung ứng quân sự',
      abstractVn: 'Nghiên cứu tiềm năng ứng dụng công nghệ blockchain để tăng cường tính minh bạch, truy xuất nguồn gốc và bảo mật trong quản lý chuỗi cung ứng quân sự.',
      abstractEn: 'Research on the potential of blockchain technology to enhance transparency, traceability and security in military supply chain management.',
      keywords: ['blockchain', 'chuỗi cung ứng', 'minh bạch', 'bảo mật'],
      isFeatured: true,
    },
    {
      title: 'Drone logistics trong bảo đảm hậu cần tiền tuyến',
      abstractVn: 'Phân tích khả năng ứng dụng thiết bị bay không người lái (drone) trong bảo đảm hậu cần cho các vị trí tiền tuyến, nơi phương tiện vận tải truyền thống khó tiếp cận.',
      abstractEn: 'Analysis of the feasibility of applying unmanned aerial vehicles (drones) in logistics assurance for frontline positions where traditional transport vehicles are difficult to access.',
      keywords: ['drone', 'UAV', 'tiền tuyến', 'vận tải'],
    },
    {
      title: 'Công nghệ in 3D trong sản xuất phụ tùng và vật tư hậu cần',
      abstractVn: 'Nghiên cứu ứng dụng công nghệ in 3D trong sản xuất nhanh các phụ tùng thay thế và vật tư hậu cần, giảm phụ thuộc vào chuỗi cung ứng và rút ngắn thời gian sửa chữa.',
      abstractEn: 'Research on applying 3D printing technology in rapid production of replacement parts and logistics supplies, reducing supply chain dependence and shortening repair times.',
      keywords: ['in 3D', 'phụ tùng', 'sản xuất nhanh', 'sửa chữa'],
    },
    {
      title: 'Hệ thống năng lượng tái tạo cho căn cứ hậu cần dã chiến',
      abstractVn: 'Đánh giá tiềm năng ứng dụng năng lượng mặt trời và gió cho các căn cứ hậu cần dã chiến, nhằm giảm phụ thuộc vào nhiên liệu hóa thạch và tăng khả năng tự chủ.',
      abstractEn: 'Assessment of the potential for applying solar and wind energy at field logistics bases, to reduce dependence on fossil fuels and increase autonomy.',
      keywords: ['năng lượng tái tạo', 'năng lượng mặt trời', 'dã chiến', 'tự chủ'],
    },
    {
      title: 'Internet of Things (IoT) trong theo dõi trang bị hậu cần',
      abstractVn: 'Nghiên cứu giải pháp IoT để theo dõi trạng thái, vị trí và tình trạng kỹ thuật của trang bị hậu cần trong thời gian thực, nâng cao hiệu quả quản lý.',
      abstractEn: 'Research on IoT solutions to monitor the status, location and technical condition of logistics equipment in real time, improving management efficiency.',
      keywords: ['IoT', 'theo dõi', 'thời gian thực', 'trang bị'],
    },
    {
      title: 'Kỹ thuật hàn tiên tiến trong bảo dưỡng trang bị quân sự',
      abstractVn: 'Giới thiệu các kỹ thuật hàn tiên tiến như hàn laser, hàn ma sát khuấy được ứng dụng trong bảo dưỡng và sửa chữa trang bị cơ khí quân sự.',
      abstractEn: 'Introduction to advanced welding techniques such as laser welding and friction stir welding applied in maintenance and repair of military mechanical equipment.',
      keywords: ['hàn laser', 'hàn tiên tiến', 'bảo dưỡng', 'cơ khí quân sự'],
    },
    {
      title: 'Vật liệu composite trong chế tạo trang bị hậu cần nhẹ hóa',
      abstractVn: 'Nghiên cứu ứng dụng vật liệu composite tiên tiến để giảm trọng lượng trang bị hậu cần, tăng cường tính cơ động mà vẫn đảm bảo độ bền và chức năng.',
      abstractEn: 'Research on applying advanced composite materials to reduce the weight of logistics equipment, enhancing mobility while ensuring durability and function.',
      keywords: ['composite', 'nhẹ hóa', 'cơ động', 'độ bền'],
    },
    {
      title: 'Công nghệ lọc nước dã chiến cho bộ đội trong tác chiến',
      abstractVn: 'Đánh giá các công nghệ lọc nước dã chiến hiện đại, đảm bảo cung cấp nước uống sạch cho bộ đội trong mọi điều kiện địa hình và nguồn nước.',
      abstractEn: 'Evaluation of modern field water purification technologies, ensuring clean drinking water supply for troops in all terrain conditions and water sources.',
      keywords: ['lọc nước', 'dã chiến', 'nước uống sạch', 'tác chiến'],
    },
    {
      title: 'Ứng dụng GIS trong lập kế hoạch hậu cần và vận tải',
      abstractVn: 'Nghiên cứu ứng dụng hệ thống thông tin địa lý (GIS) trong lập kế hoạch tuyến vận tải hậu cần, tối ưu hóa tuyến đường và quản lý địa hình.',
      abstractEn: 'Research on applying Geographic Information Systems (GIS) in logistics transport route planning, optimizing routes and terrain management.',
      keywords: ['GIS', 'thông tin địa lý', 'vận tải', 'tối ưu hóa'],
    },
    {
      title: 'Công nghệ bảo quản lương thực, thực phẩm cho dự trữ chiến lược',
      abstractVn: 'Nghiên cứu các công nghệ bảo quản hiện đại - đông khô, bao gói khí quyển điều chỉnh - nhằm kéo dài thời hạn sử dụng lương thực trong hệ thống dự trữ chiến lược.',
      abstractEn: 'Research on modern preservation technologies - freeze-drying, modified atmosphere packaging - to extend the shelf life of food in the strategic reserve system.',
      keywords: ['đông khô', 'bảo quản', 'dự trữ chiến lược', 'thực phẩm'],
    },
  ],

  QTNQ: [
    {
      title: 'Quán triệt và triển khai Nghị quyết Đại hội XIII về xây dựng quân đội',
      abstractVn: 'Bài viết phân tích nội dung cốt lõi của Nghị quyết Đại hội XIII liên quan đến xây dựng quân đội, hướng dẫn quán triệt và triển khai trong lực lượng hậu cần.',
      abstractEn: 'Analysis of the core content of the 13th National Congress Resolution related to army building, guiding comprehension and implementation in logistics forces.',
      keywords: ['Đại hội XIII', 'xây dựng quân đội', 'quán triệt', 'nghị quyết'],
      isFeatured: true,
    },
    {
      title: 'Nghị quyết 29-NQ/TW về đổi mới căn bản giáo dục và đào tạo trong quân sự',
      abstractVn: 'Phân tích nội dung Nghị quyết 29-NQ/TW và định hướng triển khai trong hệ thống đào tạo cán bộ nghệ thuật quân sự, từ cơ sở đến học viện.',
      abstractEn: 'Analysis of Resolution 29-NQ/TW content and implementation directions in the military logistics officer training system, from grassroots to academies.',
      keywords: ['Nghị quyết 29', 'giáo dục đào tạo', 'cán bộ', 'học viện'],
    },
    {
      title: 'Quán triệt tinh thần Nghị quyết về bảo vệ nền tảng tư tưởng của Đảng',
      abstractVn: 'Hướng dẫn quán triệt và vận dụng Nghị quyết 35-NQ/TW về bảo vệ nền tảng tư tưởng của Đảng trong toàn lực lượng nghệ thuật quân sự.',
      abstractEn: 'Guidelines for comprehending and applying Resolution 35-NQ/TW on protecting the ideological foundation of the Party throughout the military logistics force.',
      keywords: ['Nghị quyết 35', 'tư tưởng', 'nền tảng', 'bảo vệ'],
    },
    {
      title: 'Triển khai Nghị quyết về tăng cường quốc phòng-an ninh trong tình hình mới',
      abstractVn: 'Phân tích và hướng dẫn triển khai các nghị quyết về tăng cường quốc phòng-an ninh, với trọng tâm là vai trò của ngành hậu cần trong thực hiện nhiệm vụ quốc phòng.',
      abstractEn: 'Analysis and guidance on implementing resolutions on strengthening defense and security, focusing on the role of the logistics sector in fulfilling defense tasks.',
      keywords: ['quốc phòng', 'an ninh', 'tình hình mới', 'triển khai'],
    },
    {
      title: 'Học tập Nghị quyết về xây dựng đảng trong sạch, vững mạnh trong hậu cần',
      abstractVn: 'Hướng dẫn học tập, quán triệt các nghị quyết về xây dựng Đảng trong sạch, vững mạnh trong các tổ chức đảng thuộc lực lượng nghệ thuật quân sự.',
      abstractEn: 'Guidance on studying and comprehending resolutions on building a clean and strong Party within Party organizations of the military logistics force.',
      keywords: ['xây dựng Đảng', 'trong sạch', 'vững mạnh', 'tổ chức đảng'],
    },
    {
      title: 'Nghị quyết về chủ động phòng ngừa và ngăn chặn suy thoái trong quân đội',
      abstractVn: 'Phân tích nội dung nghị quyết về phòng ngừa, ngăn chặn suy thoái về tư tưởng chính trị trong quân đội, với các biện pháp cụ thể áp dụng trong lực lượng hậu cần.',
      abstractEn: 'Analysis of resolution content on preventing and stopping ideological and political degradation in the military, with specific measures applied in logistics forces.',
      keywords: ['phòng ngừa', 'suy thoái', 'tư tưởng chính trị', 'biện pháp'],
    },
    {
      title: 'Triển khai Nghị quyết về phát triển kinh tế - xã hội vùng biên giới',
      abstractVn: 'Hướng dẫn triển khai các nghị quyết về phát triển kinh tế - xã hội vùng biên giới, hải đảo, với đóng góp đặc thù của lực lượng nghệ thuật quân sự.',
      abstractEn: 'Guidelines for implementing resolutions on socio-economic development of border and island areas, with the specific contributions of military logistics forces.',
      keywords: ['biên giới', 'hải đảo', 'kinh tế xã hội', 'phát triển'],
    },
    {
      title: 'Quán triệt Nghị quyết về tăng cường liên minh chiến đấu Việt Nam - Lào - Campuchia',
      abstractVn: 'Nội dung quán triệt nghị quyết về tăng cường liên minh chiến đấu, với chú trọng đến hợp tác hậu cần quân sự giữa ba nước Việt Nam, Lào, Campuchia.',
      abstractEn: 'Content for comprehending the resolution on strengthening the fighting alliance, focusing on military logistics cooperation among the three countries Vietnam, Laos and Cambodia.',
      keywords: ['liên minh chiến đấu', 'Lào', 'Campuchia', 'hợp tác'],
    },
    {
      title: 'Học tập và thực hiện Nghị quyết chuyên đề về phòng, chống tham nhũng',
      abstractVn: 'Hướng dẫn học tập và thực hiện các nghị quyết chuyên đề về phòng, chống tham nhũng, tiêu cực trong lực lượng nghệ thuật quân sự, bảo đảm quản lý tài chính minh bạch.',
      abstractEn: 'Guidelines for studying and implementing specialized resolutions on anti-corruption and negativity prevention in military logistics forces, ensuring transparent financial management.',
      keywords: ['phòng chống tham nhũng', 'tiêu cực', 'tài chính', 'minh bạch'],
    },
    {
      title: 'Triển khai Nghị quyết về đổi mới, sắp xếp tổ chức bộ máy quân đội',
      abstractVn: 'Phân tích tác động của nghị quyết về đổi mới, sắp xếp tổ chức bộ máy quân đội đến cơ cấu tổ chức hậu cần, và hướng dẫn triển khai trong toàn ngành.',
      abstractEn: 'Analysis of the impact of the resolution on reforming and reorganizing the military apparatus on logistics organizational structure, and guidance on implementation across the sector.',
      keywords: ['sắp xếp tổ chức', 'đổi mới', 'bộ máy', 'cơ cấu'],
    },
  ],

  DBHB: [
    {
      title: 'Nhận diện âm mưu "Diễn biến hòa bình" trong lĩnh vực hậu cần quân sự',
      abstractVn: 'Bài viết phân tích các chiêu thức, âm mưu của các thế lực thù địch trong việc thực hiện chiến lược "Diễn biến hòa bình" nhằm vào lĩnh vực hậu cần quân sự Việt Nam.',
      abstractEn: 'Analysis of the tactics and schemes of hostile forces in implementing the "peaceful evolution" strategy targeting Vietnam\'s Vietnamese military art sector.',
      keywords: ['Diễn biến hòa bình', 'âm mưu', 'thế lực thù địch', 'nhận diện'],
      isFeatured: true,
    },
    {
      title: 'Đấu tranh bảo vệ nền tảng tư tưởng trong ngành hậu cần',
      abstractVn: 'Phân tích vai trò và phương pháp đấu tranh bảo vệ nền tảng tư tưởng Marxist-Leninist và tư tưởng Hồ Chí Minh trong lực lượng nghệ thuật quân sự.',
      abstractEn: 'Analysis of the role and methods of fighting to protect the Marxist-Leninist and Ho Chi Minh thought foundation in military logistics forces.',
      keywords: ['tư tưởng Marxist', 'tư tưởng Hồ Chí Minh', 'bảo vệ', 'đấu tranh'],
    },
    {
      title: 'Chống lại các luận điệu xuyên tạc về hậu cần quân sự Việt Nam',
      abstractVn: 'Vạch trần và bác bỏ các luận điệu xuyên tạc của các thế lực thù địch về công tác hậu cần quân sự Việt Nam, khẳng định thành tựu và tiềm lực hậu cần.',
      abstractEn: 'Exposure and refutation of distorted claims by hostile forces about Vietnamese military logistics, affirming achievements and logistics potential.',
      keywords: ['xuyên tạc', 'bác bỏ', 'thành tựu', 'tiềm lực'],
    },
    {
      title: 'Bảo vệ an ninh kinh tế quốc phòng trước mưu đồ thôn tính',
      abstractVn: 'Phân tích nguy cơ và giải pháp bảo vệ an ninh kinh tế quốc phòng trước các mưu đồ của thế lực thù địch thông qua đầu tư kinh tế và thâm nhập chuỗi cung ứng.',
      abstractEn: 'Analysis of risks and solutions to protect national defense economic security against hostile forces\' schemes through economic investment and supply chain infiltration.',
      keywords: ['an ninh kinh tế', 'quốc phòng', 'thôn tính', 'chuỗi cung ứng'],
    },
    {
      title: 'Vai trò của hậu cần trong chống "tự diễn biến, tự chuyển hóa"',
      abstractVn: 'Phân tích nguy cơ "tự diễn biến, tự chuyển hóa" trong lực lượng hậu cần và các biện pháp phòng ngừa thông qua giáo dục chính trị tư tưởng và quản lý chặt chẽ.',
      abstractEn: 'Analysis of the risk of "self-evolution, self-transformation" in logistics forces and preventive measures through political-ideological education and strict management.',
      keywords: ['tự diễn biến', 'tự chuyển hóa', 'phòng ngừa', 'giáo dục chính trị'],
    },
    {
      title: 'Bảo vệ bí mật nhà nước trong các hoạt động hậu cần quân sự',
      abstractVn: 'Hệ thống các biện pháp bảo vệ bí mật nhà nước và thông tin quân sự trong hoạt động hậu cần, phòng chống gián điệp thu thập thông tin hậu cần chiến lược.',
      abstractEn: 'Systematic measures to protect state secrets and military information in logistics operations, preventing espionage from collecting strategic logistics information.',
      keywords: ['bí mật nhà nước', 'gián điệp', 'bảo vệ thông tin', 'hậu cần chiến lược'],
    },
    {
      title: 'Nâng cao cảnh giác trước chiến lược xâm nhập kinh tế quốc phòng',
      abstractVn: 'Phân tích các hình thức xâm nhập kinh tế quốc phòng của các thế lực thù địch qua hợp tác kinh tế, đầu tư nước ngoài và nhập khẩu vũ khí trang bị.',
      abstractEn: 'Analysis of hostile forces\' forms of national defense economic infiltration through economic cooperation, foreign investment and weapons equipment imports.',
      keywords: ['xâm nhập kinh tế', 'hợp tác', 'đầu tư nước ngoài', 'cảnh giác'],
    },
    {
      title: 'Đấu tranh chống tin giả về năng lực hậu cần quân đội Việt Nam',
      abstractVn: 'Vạch trần và phản bác các thông tin sai lệch, tin giả về năng lực và tiềm lực hậu cần quân đội Việt Nam trên không gian mạng và truyền thông nước ngoài.',
      abstractEn: 'Exposure and refutation of disinformation and fake news about the capacity and potential of Vietnamese military logistics on cyberspace and foreign media.',
      keywords: ['tin giả', 'thông tin sai lệch', 'không gian mạng', 'phản bác'],
    },
    {
      title: 'Tăng cường bảo mật hệ thống thông tin hậu cần quân sự',
      abstractVn: 'Phân tích các mối đe dọa an ninh mạng đối với hệ thống thông tin hậu cần và các giải pháp kỹ thuật, tổ chức để tăng cường bảo mật toàn diện.',
      abstractEn: 'Analysis of cybersecurity threats to logistics information systems and technical and organizational solutions to enhance comprehensive security.',
      keywords: ['bảo mật', 'an ninh mạng', 'hệ thống thông tin', 'mối đe dọa'],
    },
    {
      title: 'Làm thất bại chiến lược phi quân sự hóa ngành hậu cần',
      abstractVn: 'Vạch trần chiến lược nhằm phi quân sự hóa và tư nhân hóa ngành hậu cần quân đội Việt Nam của các thế lực thù địch, và giải pháp đấu tranh hiệu quả.',
      abstractEn: 'Exposure of the strategy aimed at demilitarizing and privatizing the Vietnamese Vietnamese military art sector by hostile forces, and effective countermeasures.',
      keywords: ['phi quân sự hóa', 'tư nhân hóa', 'chiến lược', 'đối phó'],
    },
  ],

  HTDT: [
    {
      title: 'Tư tưởng Hồ Chí Minh về hậu cần quân sự và ý nghĩa trong giai đoạn hiện nay',
      abstractVn: 'Bài viết phân tích tư tưởng của Chủ tịch Hồ Chí Minh về tổ chức nghệ thuật quân sự, ý nghĩa lý luận và thực tiễn trong việc xây dựng ngành hậu cần hiện đại.',
      abstractEn: 'Analysis of President Ho Chi Minh\'s thoughts on military logistics organization, the theoretical and practical significance in building a modern logistics sector.',
      keywords: ['Hồ Chí Minh', 'tư tưởng', 'hậu cần', 'hiện đại'],
      isFeatured: true,
    },
    {
      title: 'Học tập phong cách lãnh đạo hậu cần của Chủ tịch Hồ Chí Minh',
      abstractVn: 'Tìm hiểu và học tập phong cách lãnh đạo, quản lý hậu cần của Chủ tịch Hồ Chí Minh - gắn với thực tiễn, sát bộ đội, tiết kiệm và hiệu quả cao.',
      abstractEn: 'Study and learning of President Ho Chi Minh\'s leadership and logistics management style - connected to practice, close to troops, frugal and highly effective.',
      keywords: ['phong cách lãnh đạo', 'thực tiễn', 'tiết kiệm', 'hiệu quả'],
    },
    {
      title: 'Vận dụng đạo đức Hồ Chí Minh trong xây dựng cán bộ hậu cần',
      abstractVn: 'Phân tích cách vận dụng tư tưởng đạo đức Hồ Chí Minh trong công tác xây dựng đội ngũ cán bộ hậu cần có đức, có tài, liêm khiết và tận tụy với nhiệm vụ.',
      abstractEn: 'Analysis of how to apply Ho Chi Minh\'s ethics in building a corps of logistics officers with virtue, talent, integrity and dedication to duty.',
      keywords: ['đạo đức', 'cán bộ', 'liêm khiết', 'tận tụy'],
    },
    {
      title: 'Tư tưởng Hồ Chí Minh về tiết kiệm trong quản lý hậu cần',
      abstractVn: 'Nghiên cứu và vận dụng tư tưởng tiết kiệm của Chủ tịch Hồ Chí Minh trong quản lý, sử dụng vật tư, trang bị hậu cần, chống lãng phí trong thời bình.',
      abstractEn: 'Study and application of President Ho Chi Minh\'s frugality thought in managing and using logistics materials and equipment, preventing waste in peacetime.',
      keywords: ['tiết kiệm', 'chống lãng phí', 'quản lý vật tư', 'thời bình'],
    },
    {
      title: 'Phong cách Hồ Chí Minh trong công tác kiểm tra hậu cần',
      abstractVn: 'Học tập phong cách kiểm tra, giám sát của Chủ tịch Hồ Chí Minh - sát thực tế, nghiêm túc nhưng ân cần - áp dụng trong công tác thanh tra, kiểm tra hậu cần.',
      abstractEn: 'Learning from President Ho Chi Minh\'s inspection and supervision style - close to reality, serious but caring - applied in logistics inspection and examination work.',
      keywords: ['kiểm tra', 'giám sát', 'phong cách', 'nghiêm túc'],
    },
    {
      title: 'Học tập Hồ Chí Minh về dựa vào dân trong bảo đảm hậu cần',
      abstractVn: 'Phân tích tư tưởng "dựa vào dân" của Hồ Chí Minh và bài học áp dụng trong công tác huy động nhân dân tham gia bảo đảm hậu cần cho quân đội.',
      abstractEn: 'Analysis of Ho Chi Minh\'s "relying on the people" thought and lessons for mobilizing people to participate in logistics assurance for the military.',
      keywords: ['dựa vào dân', 'huy động', 'nhân dân', 'bảo đảm'],
    },
    {
      title: 'Tư tưởng Hồ Chí Minh về đoàn kết trong lực lượng hậu cần',
      abstractVn: 'Nghiên cứu tư tưởng đoàn kết của Hồ Chí Minh và ý nghĩa trong xây dựng tập thể đoàn kết, thống nhất trong các cơ quan, đơn vị nghệ thuật quân sự.',
      abstractEn: 'Research on Ho Chi Minh\'s unity thought and its significance in building united, unified collectives in military logistics agencies and units.',
      keywords: ['đoàn kết', 'tập thể', 'thống nhất', 'xây dựng'],
    },
    {
      title: 'Làm theo tấm gương liêm khiết của Bác Hồ trong quản lý ngân sách hậu cần',
      abstractVn: 'Học tập và làm theo tấm gương liêm khiết, trong sạch của Bác Hồ trong quản lý ngân sách, tài sản hậu cần, phòng chống tham nhũng, lãng phí.',
      abstractEn: 'Learning and following Uncle Ho\'s example of integrity and cleanliness in managing logistics budgets and assets, preventing corruption and waste.',
      keywords: ['liêm khiết', 'ngân sách', 'tài sản', 'phòng chống tham nhũng'],
    },
    {
      title: 'Tư tưởng về bảo vệ sức khỏe bộ đội theo quan điểm Hồ Chí Minh',
      abstractVn: 'Phân tích quan điểm của Hồ Chí Minh về tầm quan trọng của sức khỏe bộ đội và bài học về tổ chức quân y, dinh dưỡng, vệ sinh trong nghệ thuật quân sự.',
      abstractEn: 'Analysis of Ho Chi Minh\'s views on the importance of troops\' health and lessons on organizing military medicine, nutrition, and hygiene in military logistics.',
      keywords: ['sức khỏe', 'quân y', 'dinh dưỡng', 'vệ sinh'],
    },
    {
      title: 'Phong cách cần, kiệm, liêm, chính trong lực lượng hậu cần hiện đại',
      abstractVn: 'Vận dụng tư tưởng về phong cách cần, kiệm, liêm, chính của Hồ Chí Minh vào thực tiễn xây dựng lực lượng hậu cần hiện đại, chuyên nghiệp trong thời đại mới.',
      abstractEn: 'Applying Ho Chi Minh\'s diligent, frugal, righteous and upright lifestyle to the practice of building a modern, professional logistics force in the new era.',
      keywords: ['cần kiệm', 'liêm chính', 'hiện đại', 'chuyên nghiệp'],
    },
  ],

  TINTUC: [
    {
      title: 'Hội nghị tổng kết công tác hậu cần năm 2025, triển khai nhiệm vụ 2026',
      abstractVn: 'Tường thuật Hội nghị tổng kết công tác hậu cần toàn quân năm 2025 và triển khai kế hoạch hậu cần năm 2026, với những kết quả đạt được và phương hướng thời gian tới.',
      abstractEn: 'Coverage of the All-Army Logistics Year-End Review Conference 2025 and deployment of the 2026 logistics plan, with achievements and directions for the coming period.',
      keywords: ['hội nghị tổng kết', 'năm 2025', 'nhiệm vụ 2026', 'kế hoạch'],
      isFeatured: true,
    },
    {
      title: 'Đoàn hậu cần Quân đội tham dự diễn tập hậu cần ASEAN 2025',
      abstractVn: 'Thông tin về đoàn cán bộ hậu cần Quân đội nhân dân Việt Nam tham dự cuộc diễn tập hậu cần đa quốc gia ASEAN 2025, kết quả và kinh nghiệm rút ra.',
      abstractEn: 'Information about the delegation of Vietnam People\'s Army logistics officers participating in the 2025 ASEAN multinational logistics exercise, results and lessons learned.',
      keywords: ['ASEAN', 'diễn tập đa quốc gia', 'hợp tác quốc tế', '2025'],
    },
    {
      title: 'Triển lãm trang bị hậu cần hiện đại 2025 - Những điểm nổi bật',
      abstractVn: 'Tổng hợp những điểm nổi bật từ Triển lãm Trang bị Quân sự Hiện đại 2025, giới thiệu các công nghệ và thiết bị hậu cần tiên tiến được trưng bày.',
      abstractEn: 'Summary of highlights from the 2025 Modern Military Equipment Exhibition, introducing advanced logistics technologies and equipment on display.',
      keywords: ['triển lãm', 'trang bị hiện đại', '2025', 'công nghệ'],
    },
    {
      title: 'Cục Hậu cần tổ chức Hội thi tay nghề hậu cần toàn quân',
      abstractVn: 'Tường thuật Hội thi Tay nghề Hậu cần toàn quân được tổ chức tại Hà Nội, nhằm đánh giá và nâng cao trình độ kỹ năng nghề nghiệp của chiến sĩ hậu cần.',
      abstractEn: 'Coverage of the All-Army Logistics Skills Competition held in Hanoi, aimed at evaluating and improving the professional skills of logistics soldiers.',
      keywords: ['hội thi', 'tay nghề', 'kỹ năng', 'toàn quân'],
    },
    {
      title: 'Thông tin hoạt động hậu cần kỹ thuật quý I năm 2026',
      abstractVn: 'Tổng hợp thông tin về các hoạt động hậu cần kỹ thuật nổi bật trong Quý I năm 2026 toàn quân, bao gồm huấn luyện, bảo dưỡng và hỗ trợ tác chiến.',
      abstractEn: 'Summary of information on notable logistics and technical activities in Q1 2026 across the army, including training, maintenance and operational support.',
      keywords: ['quý I 2026', 'hoạt động', 'kỹ thuật', 'tổng hợp'],
    },
    {
      title: 'Quân đội hỗ trợ hậu cần cho các địa phương khắc phục thiên tai',
      abstractVn: 'Thông tin về hoạt động hậu cần quân sự hỗ trợ các tỉnh miền Trung khắc phục hậu quả lũ lụt, bao gồm cung cấp lương thực, thuốc men và vật dụng thiết yếu.',
      abstractEn: 'Information on military logistics support activities for Central provinces to overcome flood consequences, including provision of food, medicine and essential supplies.',
      keywords: ['thiên tai', 'hỗ trợ', 'lũ lụt', 'miền Trung'],
    },
    {
      title: 'Ký kết hợp tác đào tạo hậu cần với Học viện Quân sự Liên bang Nga',
      abstractVn: 'Thông tin về lễ ký kết Biên bản ghi nhớ hợp tác đào tạo cán bộ hậu cần giữa Học viện Quốc phòng Việt Nam và Học viện Quân sự Liên bang Nga.',
      abstractEn: 'Information on the signing ceremony of the Memorandum of Understanding on logistics officer training cooperation between the Vietnam National Defense Academy and the Russian Federal Military Academy.',
      keywords: ['Liên bang Nga', 'hợp tác đào tạo', 'ký kết', 'biên bản'],
    },
    {
      title: 'Khánh thành kho hậu cần chiến lược tại khu vực Tây Nguyên',
      abstractVn: 'Tường thuật lễ khánh thành kho hậu cần chiến lược tại khu vực Tây Nguyên, nâng cao năng lực dự trữ và bảo đảm hậu cần cho toàn khu vực.',
      abstractEn: 'Coverage of the inauguration ceremony of the strategic logistics depot in the Central Highlands region, enhancing reserve capacity and logistics assurance for the entire region.',
      keywords: ['khánh thành', 'kho chiến lược', 'Tây Nguyên', 'dự trữ'],
    },
    {
      title: 'Giao lưu hữu nghị hậu cần Việt Nam - CHDCND Lào 2025',
      abstractVn: 'Tường thuật chương trình giao lưu hữu nghị và trao đổi kinh nghiệm hậu cần quân sự giữa Việt Nam và Cộng hòa Dân chủ Nhân dân Lào năm 2025.',
      abstractEn: 'Coverage of the friendship exchange and military logistics experience-sharing program between Vietnam and the Lao People\'s Democratic Republic in 2025.',
      keywords: ['Lào', 'giao lưu hữu nghị', 'trao đổi kinh nghiệm', '2025'],
    },
    {
      title: 'Hậu cần Quân đoàn 4 xuất sắc hoàn thành nhiệm vụ năm 2025',
      abstractVn: 'Thông tin về kết quả xuất sắc trong công tác hậu cần của Quân đoàn 4 năm 2025, được ghi nhận là đơn vị tiên tiến trong phong trào thi đua hậu cần toàn quân.',
      abstractEn: 'Information on the excellent results in logistics work of Army Corps 4 in 2025, recognized as an advanced unit in the all-army logistics emulation movement.',
      keywords: ['Quân đoàn 4', 'xuất sắc', 'tiên tiến', 'thi đua'],
    },
  ],
}

// ─── Nội dung HTML mẫu ────────────────────────────────────────────────────────

function buildHtmlBody(title: string, abstractVn: string, abstractEn: string, keywords: string[]): string {
  return `<div class="article-content">
  <h2>${title}</h2>
  <div class="abstract">
    <h3>Tóm tắt</h3>
    <p>${abstractVn}</p>
  </div>
  <div class="abstract-en">
    <h3>Abstract</h3>
    <p>${abstractEn}</p>
  </div>
  <div class="keywords">
    <strong>Từ khóa:</strong> ${keywords.join(', ')}
  </div>
  <div class="content">
    <h3>1. Đặt vấn đề</h3>
    <p>Trong bối cảnh tình hình thế giới và khu vực có nhiều biến động phức tạp, công tác hậu cần quân sự đóng vai trò ngày càng quan trọng trong bảo đảm sức chiến đấu và khả năng sẵn sàng chiến đấu của quân đội. Bài viết này tập trung phân tích những vấn đề cốt lõi liên quan đến chủ đề "${title}", từ đó rút ra những nhận định, đề xuất có giá trị thực tiễn.</p>
    <h3>2. Nội dung chính</h3>
    <p>Qua nghiên cứu, phân tích tài liệu và thực tiễn công tác, tác giả đưa ra những luận điểm sau:</p>
    <p>Thứ nhất, cần nhìn nhận đúng đắn tầm quan trọng của vấn đề trong bối cảnh hiện tại. Những thay đổi về môi trường chiến lược đòi hỏi phải có cách tiếp cận mới, phù hợp với điều kiện thực tế.</p>
    <p>Thứ hai, kinh nghiệm từ thực tiễn công tác cho thấy cần phải có sự phối hợp chặt chẽ giữa các cơ quan, đơn vị trong thực hiện nhiệm vụ. Sự thống nhất về nhận thức và hành động là yếu tố then chốt để đạt được mục tiêu đề ra.</p>
    <p>Thứ ba, việc ứng dụng khoa học kỹ thuật và công nghệ mới là xu hướng tất yếu, cần được đẩy mạnh một cách có kế hoạch và hệ thống.</p>
    <h3>3. Kết luận và kiến nghị</h3>
    <p>Trên cơ sở nghiên cứu lý luận và thực tiễn, bài viết đề xuất một số giải pháp nhằm nâng cao hiệu quả công tác trong lĩnh vực này. Những giải pháp này cần được triển khai đồng bộ, có lộ trình phù hợp và được đánh giá thường xuyên để kịp thời điều chỉnh.</p>
    <p>Việc thực hiện tốt những nội dung trên sẽ góp phần quan trọng vào việc nâng cao năng lực nghệ thuật quân sự, đáp ứng yêu cầu nhiệm vụ bảo vệ Tổ quốc trong tình hình mới.</p>
  </div>
</div>`
}

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Bắt đầu seed bài viết trang chủ - 10 bài/chuyên mục...')

  // Lấy dữ liệu nền
  const categories = await prisma.category.findMany()
  const issues = await prisma.issue.findMany({ orderBy: { publishDate: 'desc' } })
  const authors = await prisma.user.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
  })

  if (categories.length === 0) throw new Error('Không có category nào. Hãy chạy seed.ts trước.')
  if (issues.length === 0) throw new Error('Không có issue nào. Hãy chạy seed.ts trước.')
  if (authors.length === 0) throw new Error('Không có user APPROVED nào.')

  const issueIds = issues.map(i => i.id)
  let totalCreated = 0
  let counter = 0

  for (const category of categories) {
    const articles = ARTICLES_BY_CATEGORY[category.code]
    if (!articles) {
      console.warn(`⚠️  Không có nội dung cho category ${category.code}, bỏ qua`)
      continue
    }

    console.log(`\n📚 Seeding ${articles.length} bài cho chuyên mục [${category.code}] ${category.name}...`)

    for (let i = 0; i < articles.length; i++) {
      const art = articles[i]
      const author = authors[counter % authors.length]
      counter++

      // Phân bố đều bài vào các issue
      const issueId = issueIds[counter % issueIds.length]

      // Ngày xuất bản trải đều 12 tháng, bài mới nhất gần hiện tại
      const daysAgo = (articles.length - i) * 12 + Math.floor(Math.random() * 5)
      const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      const submissionCode = `SUB-${category.code}-${Date.now()}-${counter}`

      const submission = await prisma.submission.create({
        data: {
          code: submissionCode,
          title: art.title,
          abstractVn: art.abstractVn,
          abstractEn: art.abstractEn,
          keywords: art.keywords,
          status: 'PUBLISHED',
          securityLevel: 'PUBLIC',
          categoryId: category.id,
          createdBy: author.id,
        },
      })

      await prisma.submissionVersion.create({
        data: {
          submissionId: submission.id,
          versionNo: 1,
          filesetId: `fileset-${submission.id}-v1`,
          changelog: 'Phiên bản xuất bản',
        },
      })

      await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId,
          pages: `${10 + i * 4}-${14 + i * 4}`,
          doiLocal: `10.59386/tapchi-hcqs.${publishedAt.getFullYear()}.${category.code.toLowerCase()}.${i + 1}`,
          htmlBody: buildHtmlBody(art.title, art.abstractVn, art.abstractEn, art.keywords),
          publishedAt,
          views: Math.floor(Math.random() * 1200) + 50,
          downloads: Math.floor(Math.random() * 300) + 10,
          isFeatured: art.isFeatured ?? false,
          approvalStatus: 'APPROVED',
        },
      })

      totalCreated++
      process.stdout.write(`  ✅ ${art.title.substring(0, 60)}...\n`)
    }
  }

  console.log(`\n🎉 Hoàn thành! Đã tạo ${totalCreated} bài viết trải đều ${categories.length} chuyên mục.`)

  // Thống kê
  const stats = await prisma.$queryRaw<Array<{ code: string; name: string; count: bigint }>>`
    SELECT cat.code, cat.name, COUNT(a.id) as count
    FROM "Category" cat
    LEFT JOIN "Submission" s ON s."categoryId" = cat.id AND s.status = 'PUBLISHED'
    LEFT JOIN "Article" a ON a."submissionId" = s.id
    GROUP BY cat.code, cat.name
    ORDER BY cat.code
  `

  console.log('\n📊 Thống kê bài viết đã xuất bản theo chuyên mục:')
  for (const row of stats) {
    console.log(`  [${row.code}] ${row.name}: ${row.count} bài`)
  }
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
