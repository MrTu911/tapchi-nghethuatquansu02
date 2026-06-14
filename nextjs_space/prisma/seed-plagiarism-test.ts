/**
 * seed-plagiarism-test.ts
 *
 * Tạo 10 bài báo mẫu để test chức năng kiểm tra đạo văn và trùng lặp.
 * Bao gồm các cặp bài có nội dung tương đồng để cosine/jaccard similarity
 * cho kết quả có ý nghĩa khi kiểm tra.
 *
 * Idempotent: kiểm tra code trùng trước khi tạo.
 *
 * Run: npx tsx --require dotenv/config prisma/seed-plagiarism-test.ts
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// 10 bài báo mẫu — 2 cặp có nội dung tương đồng cao để tạo hit khi check
const SAMPLE_SUBMISSIONS = [
  // === CẶP 1: An ninh mạng (nội dung rất tương đồng) ===
  {
    code: 'HCQS-TEST-PL-001',
    title: 'Ứng dụng trí tuệ nhân tạo trong phát hiện và ngăn chặn tấn công mạng tại các cơ sở quân sự',
    abstractVn: 'Bài báo trình bày nghiên cứu về ứng dụng trí tuệ nhân tạo và học máy trong việc phát hiện và ngăn chặn các cuộc tấn công mạng tại các cơ sở quốc phòng và quân sự. Nghiên cứu đề xuất mô hình phát hiện xâm nhập dựa trên mạng nơ-ron tích chập kết hợp với phân tích hành vi bất thường. Kết quả thực nghiệm trên tập dữ liệu thực tế cho thấy mô hình đạt độ chính xác 97,3% trong phát hiện tấn công DDoS, SQL injection và các hình thức tấn công APT phổ biến. Hệ thống có khả năng phân tích lưu lượng mạng theo thời gian thực và đưa ra cảnh báo tự động khi phát hiện hành vi bất thường.',
    abstractEn: 'This paper presents research on the application of artificial intelligence and machine learning in detecting and preventing cyber attacks at defense and military facilities. The study proposes an intrusion detection model based on convolutional neural networks combined with anomaly behavior analysis. Experimental results on real datasets show that the model achieves 97.3% accuracy in detecting DDoS attacks, SQL injection, and common APT attack forms.',
    keywords: ['trí tuệ nhân tạo', 'an ninh mạng', 'phát hiện xâm nhập', 'học máy', 'quân sự', 'tấn công mạng'],
    htmlBody: `<p>An ninh mạng trong môi trường quân sự đang đối mặt với những thách thức ngày càng phức tạp. Các cuộc tấn công mạng nhằm vào hạ tầng quốc phòng không chỉ gia tăng về số lượng mà còn tinh vi hơn về kỹ thuật, đòi hỏi các giải pháp phòng thủ thế hệ mới dựa trên trí tuệ nhân tạo.</p>
<p>Nghiên cứu này đề xuất kiến trúc hệ thống phát hiện xâm nhập (IDS) tích hợp mạng nơ-ron tích chập (CNN) với thuật toán học tăng cường để phân tích lưu lượng mạng theo thời gian thực. Mô hình được huấn luyện trên tập dữ liệu CICIDS-2019 gồm hơn 3 triệu mẫu lưu lượng mạng thực tế, trong đó có 15 loại tấn công khác nhau bao gồm DDoS, Port Scan, SQL Injection, Cross-Site Scripting, và tấn công APT.</p>
<p>Phương pháp tiếp cận bao gồm ba giai đoạn chính: thu thập và tiền xử lý dữ liệu lưu lượng mạng, huấn luyện mô hình phân loại đa lớp, và triển khai hệ thống cảnh báo tự động. Trong giai đoạn tiền xử lý, chúng tôi áp dụng kỹ thuật chuẩn hóa đặc trưng và cân bằng lớp bằng phương pháp SMOTE để xử lý vấn đề mất cân bằng dữ liệu.</p>
<p>Kết quả thực nghiệm cho thấy mô hình đề xuất đạt độ chính xác 97,3% trên tập kiểm tra, với độ nhạy 96,8% và độ đặc hiệu 97,9%. So sánh với các phương pháp truyền thống như SVM và Random Forest, mô hình CNN tích hợp học tăng cường cho kết quả vượt trội hơn 12% về độ chính xác tổng thể.</p>
<p>Hệ thống đã được triển khai thử nghiệm tại một đơn vị quân sự cấp trung đoàn trong thời gian 6 tháng. Kết quả vận hành thực tế cho thấy hệ thống có khả năng phát hiện 94% các cuộc tấn công thực sự với tỉ lệ cảnh báo nhầm chỉ 2,1%, đáp ứng yêu cầu hoạt động trong môi trường quân sự đòi hỏi độ tin cậy cao.</p>
<p>Nghiên cứu cũng đề xuất kiến trúc triển khai phân tán cho các mạng quân sự quy mô lớn, trong đó mỗi node mạng chạy một phiên bản nhẹ của mô hình và gửi kết quả về trung tâm phân tích tập trung. Phương pháp này giúp giảm độ trễ xử lý xuống dưới 50 millisecond trong khi vẫn duy trì độ chính xác phát hiện cao.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-002',
    title: 'Phát hiện tấn công mạng trong hệ thống thông tin quân sự sử dụng học máy và trí tuệ nhân tạo',
    abstractVn: 'Bài báo nghiên cứu việc sử dụng các kỹ thuật học máy và trí tuệ nhân tạo để phát hiện và ứng phó với các cuộc tấn công mạng nhằm vào hệ thống thông tin trong các đơn vị quân sự. Nghiên cứu phát triển hệ thống phát hiện xâm nhập dựa trên mạng nơ-ron kết hợp phân tích hành vi bất thường trên lưu lượng mạng. Thực nghiệm trên dữ liệu thực tế cho thấy độ chính xác phát hiện đạt 96,8% với các dạng tấn công DDoS, SQL injection và APT. Hệ thống có thể phân tích và cảnh báo theo thời gian thực khi phát hiện hành vi đáng ngờ trong mạng nội bộ.',
    abstractEn: 'This paper studies the use of machine learning and artificial intelligence techniques to detect and respond to cyber attacks targeting information systems in military units. The research develops an intrusion detection system based on neural networks combined with anomaly behavior analysis on network traffic. Experiments on real data show detection accuracy of 96.8% for DDoS, SQL injection, and APT attacks.',
    keywords: ['học máy', 'an ninh mạng', 'phát hiện xâm nhập', 'trí tuệ nhân tạo', 'hệ thống thông tin', 'tấn công mạng'],
    htmlBody: `<p>An ninh mạng trong các đơn vị quân sự đang đối mặt với những thách thức phức tạp ngày càng gia tăng. Các cuộc tấn công mạng nhằm vào hệ thống thông tin quân sự không chỉ gia tăng về số lượng mà còn tinh vi hơn, đòi hỏi các giải pháp phòng thủ thế hệ mới dựa trên học máy và trí tuệ nhân tạo.</p>
<p>Bài báo này đề xuất mô hình hệ thống phát hiện xâm nhập tích hợp mạng nơ-ron sâu với phân tích hành vi bất thường để giám sát lưu lượng mạng liên tục. Mô hình được huấn luyện trên bộ dữ liệu CICIDS-2019 với hơn 3 triệu bản ghi lưu lượng mạng thực tế, bao gồm 15 loại tấn công phổ biến như DDoS, Port Scan, SQL Injection, XSS và các tấn công APT phức tạp.</p>
<p>Quy trình nghiên cứu gồm ba bước chính: thu thập và xử lý dữ liệu lưu lượng mạng, xây dựng mô hình phân loại đa nhãn, và triển khai module cảnh báo tự động. Trong bước xử lý dữ liệu, nhóm nghiên cứu áp dụng chuẩn hóa đặc trưng và kỹ thuật SMOTE để giải quyết vấn đề mất cân bằng giữa các lớp tấn công.</p>
<p>Kết quả đánh giá cho thấy mô hình đạt độ chính xác 96,8% trên tập dữ liệu kiểm tra, với recall 96,2% và precision 97,4%. So với các giải pháp truyền thống sử dụng SVM và Random Forest, phương pháp học sâu kết hợp phân tích hành vi đạt hiệu suất cao hơn 11-13% trong các kịch bản tấn công đa dạng.</p>
<p>Hệ thống được thử nghiệm triển khai tại một đơn vị quân đội trong 6 tháng liên tục. Trong điều kiện vận hành thực tế, hệ thống phát hiện được 93% các sự cố tấn công thực sự với tỉ lệ dương tính giả chỉ 2,3%, đáp ứng tiêu chuẩn an ninh cho môi trường quân sự đòi hỏi tính tin cậy cao.</p>
<p>Bài báo cũng đề xuất mô hình triển khai theo kiến trúc phân tán cho mạng quân sự quy mô lớn, với mỗi nút mạng thực hiện phân tích cục bộ và chuyển kết quả về trung tâm tập trung. Kiến trúc này đảm bảo độ trễ xử lý dưới 50 millisecond trong khi duy trì hiệu quả phát hiện tấn công ở mức cao.</p>`,
    status: 'ACCEPTED' as const,
  },

  // === CẶP 2: Quản lý hậu cần (nội dung tương đồng trung bình) ===
  {
    code: 'HCQS-TEST-PL-003',
    title: 'Tối ưu hóa chuỗi cung ứng hậu cần quân sự sử dụng thuật toán di truyền và học tăng cường',
    abstractVn: 'Nghiên cứu đề xuất phương pháp tối ưu hóa chuỗi cung ứng hậu cần quân sự dựa trên kết hợp thuật toán di truyền và học tăng cường. Mô hình được xây dựng để giải quyết bài toán phân bổ nguồn lực, lập lịch vận chuyển và quản lý tồn kho trong điều kiện thực chiến. Kết quả thử nghiệm trên dữ liệu mô phỏng của một đơn vị cấp sư đoàn cho thấy giảm 28% chi phí logistics tổng thể và cải thiện 35% thời gian đáp ứng so với phương pháp truyền thống.',
    abstractEn: 'This study proposes a method for optimizing military logistics supply chains based on a combination of genetic algorithms and reinforcement learning. The model is designed to address resource allocation, transport scheduling, and inventory management under operational conditions. Testing results on simulation data from a division-level unit show a 28% reduction in total logistics costs and 35% improvement in response time compared to traditional methods.',
    keywords: ['chuỗi cung ứng', 'hậu cần quân sự', 'thuật toán di truyền', 'học tăng cường', 'tối ưu hóa', 'logistics'],
    htmlBody: `<p>Hậu cần quân sự đóng vai trò then chốt trong đảm bảo khả năng chiến đấu của lực lượng vũ trang. Việc tối ưu hóa chuỗi cung ứng hậu cần không chỉ giúp tiết kiệm nguồn lực quốc phòng mà còn nâng cao tính linh hoạt và khả năng đáp ứng trong các tình huống tác chiến phức tạp.</p>
<p>Bài báo này đề xuất mô hình tối ưu hóa chuỗi cung ứng kết hợp thuật toán di truyền (GA) với học tăng cường (RL) để giải quyết đồng thời ba bài toán: phân bổ nguồn lực vật tư, lập lịch tuyến đường vận chuyển và kiểm soát mức tồn kho tối ưu. Mô hình tích hợp ràng buộc thực chiến như điều kiện địa hình, nguy cơ an ninh tuyến đường và ưu tiên chia sẻ phương tiện.</p>
<p>Quá trình nghiên cứu sử dụng dữ liệu lịch sử hoạt động hậu cần của một đơn vị sư đoàn trong ba năm để huấn luyện và kiểm chứng mô hình. Thuật toán di truyền được sử dụng để tối ưu hóa tham số toàn cục của chuỗi cung ứng, trong khi học tăng cường đảm nhận điều chỉnh quyết định thời gian thực theo diễn biến tình huống.</p>
<p>Kết quả thử nghiệm trên dữ liệu mô phỏng cho thấy mô hình đề xuất giảm được 28% tổng chi phí logistics, bao gồm chi phí vận chuyển, tồn kho và xử lý. Thời gian đáp ứng trung bình cải thiện 35% so với phương pháp lập kế hoạch thủ công truyền thống, đặc biệt trong các kịch bản thay đổi nhu cầu đột ngột.</p>
<p>Mô hình cũng được đánh giá về khả năng thích ứng trong các tình huống bất thường như gián đoạn tuyến đường, thiếu hụt vật tư đột ngột và thay đổi ưu tiên nhiệm vụ. Kết quả cho thấy thuật toán có khả năng tái hoạch định trong thời gian dưới 30 giây, đáp ứng yêu cầu ra quyết định trong môi trường tác chiến động.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-004',
    title: 'Ứng dụng học tăng cường và thuật toán di truyền trong quản lý logistics hậu cần quân đội',
    abstractVn: 'Bài báo trình bày nghiên cứu ứng dụng kết hợp học tăng cường và thuật toán di truyền để tối ưu hóa các bài toán trong quản lý logistics và chuỗi cung ứng cho lực lượng quân đội. Hệ thống đề xuất giải quyết đồng thời các vấn đề phân bổ nguồn lực, lịch trình vận chuyển và tồn kho tối ưu trong điều kiện tác chiến. Thử nghiệm trên dữ liệu mô phỏng đơn vị cấp sư đoàn cho kết quả giảm 26% chi phí vận hành và cải thiện 32% hiệu quả phân bổ nguồn lực.',
    abstractEn: 'This paper presents research on applying a combination of reinforcement learning and genetic algorithms to optimize logistics management and supply chain problems for military forces. The proposed system simultaneously addresses resource allocation, transportation scheduling, and optimal inventory under operational conditions.',
    keywords: ['học tăng cường', 'logistics quân sự', 'thuật toán di truyền', 'chuỗi cung ứng', 'hậu cần', 'tối ưu hóa'],
    htmlBody: `<p>Trong bối cảnh hiện đại hóa quân đội, việc ứng dụng công nghệ thông tin và trí tuệ nhân tạo vào quản lý hậu cần ngày càng trở nên cấp thiết. Các bài toán logistics quân sự có tính phức tạp cao do phải cân bằng nhiều mục tiêu và ràng buộc đồng thời trong môi trường động và không chắc chắn.</p>
<p>Nghiên cứu này phát triển hệ thống hỗ trợ quyết định logistics sử dụng học tăng cường kết hợp thuật toán di truyền để tối ưu hóa đồng thời phân bổ nguồn lực vật tư, lập lịch vận chuyển và kiểm soát tồn kho. Hệ thống tích hợp các ràng buộc tác chiến thực tế bao gồm điều kiện địa hình, đánh giá rủi ro tuyến đường và độ ưu tiên phương tiện.</p>
<p>Dữ liệu huấn luyện được thu thập từ lịch sử hoạt động hậu cần ba năm của một đơn vị quân sự cấp sư đoàn. Thuật toán di truyền tối ưu hóa cấu hình toàn cục của chuỗi cung ứng, trong khi học tăng cường điều chỉnh các quyết định cục bộ theo thời gian thực dựa trên phản hồi từ môi trường.</p>
<p>Đánh giá hiệu quả trên tập dữ liệu mô phỏng cho thấy hệ thống giảm 26% chi phí vận hành tổng thể so với phương pháp hoạch định truyền thống. Hiệu quả phân bổ nguồn lực cải thiện 32%, và thời gian lập kế hoạch vận chuyển giảm từ nhiều giờ xuống còn vài phút nhờ tự động hóa.</p>
<p>Hệ thống cũng thể hiện khả năng thích ứng cao trong các tình huống bất thường như đứt gãy tuyến đường vận chuyển, thiếu hụt đột ngột vật tư và thay đổi mệnh lệnh tác chiến. Thời gian tái hoạch định trong các tình huống này trung bình dưới 35 giây, đáp ứng yêu cầu vận hành trong thực tế.</p>`,
    status: 'PUBLISHED' as const,
  },

  // === Bài độc lập 5-7: Quản lý nhà nước ===
  {
    code: 'HCQS-TEST-PL-005',
    title: 'Cải cách hành chính công trong bối cảnh chuyển đổi số tại Việt Nam: Thực trạng và giải pháp',
    abstractVn: 'Bài báo phân tích thực trạng cải cách hành chính công tại Việt Nam trong bối cảnh chuyển đổi số quốc gia. Nghiên cứu chỉ ra những rào cản chính trong việc số hóa dịch vụ công, bao gồm hạn chế về cơ sở hạ tầng công nghệ, khoảng cách kỹ năng số của cán bộ công chức, và thiếu khung pháp lý đồng bộ. Bài báo đề xuất lộ trình cải cách giai đoạn 2025-2030 với trọng tâm xây dựng nền hành chính điện tử toàn diện.',
    abstractEn: 'This paper analyzes the current state of public administration reform in Vietnam in the context of national digital transformation. The research identifies major barriers to digitizing public services and proposes a reform roadmap for 2025-2030 focused on building a comprehensive e-government.',
    keywords: ['cải cách hành chính', 'chuyển đổi số', 'dịch vụ công', 'chính phủ điện tử', 'Việt Nam'],
    htmlBody: `<p>Cải cách hành chính công là một trong những ưu tiên hàng đầu của Việt Nam trong giai đoạn phát triển hiện nay, đặc biệt trong bối cảnh Chương trình chuyển đổi số quốc gia đến năm 2030 đang được triển khai tích cực. Tuy nhiên, quá trình này đối mặt với nhiều thách thức đặc thù từ cả yếu tố kỹ thuật lẫn thể chế.</p>
<p>Nghiên cứu tiến hành khảo sát 248 cán bộ công chức tại 15 bộ, ngành và 20 tỉnh, thành phố trong cả nước. Kết quả cho thấy ba nhóm rào cản chính: (1) Hạ tầng công nghệ chưa đồng bộ, đặc biệt tại các địa phương vùng sâu vùng xa; (2) Khoảng cách kỹ năng số lớn trong đội ngũ công chức, với 67% được khảo sát chỉ có kỹ năng số ở mức cơ bản; (3) Thiếu khung pháp lý đồng bộ cho giao dịch điện tử và xác thực số.</p>
<p>Phân tích so sánh kinh nghiệm của Estonia, Singapore và Hàn Quốc cho thấy yếu tố quyết định thành công là tích hợp hệ thống dữ liệu quốc gia theo hướng một nguồn sự thật duy nhất, thay vì các cơ sở dữ liệu phân tán. Đây là điểm mấu chốt mà Việt Nam cần ưu tiên trong giai đoạn tiếp theo.</p>
<p>Bài báo đề xuất lộ trình cải cách ba giai đoạn cho 2025-2030: Giai đoạn 1 (2025-2026) tập trung hoàn thiện hạ tầng số và chuẩn hóa dữ liệu; Giai đoạn 2 (2027-2028) số hóa toàn bộ dịch vụ công cấp độ 4; Giai đoạn 3 (2029-2030) tích hợp trí tuệ nhân tạo để cá nhân hóa và tự động hóa dịch vụ công.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-006',
    title: 'Xây dựng năng lực lãnh đạo chiến lược trong tổ chức công: Tiếp cận từ lý thuyết phức hợp',
    abstractVn: 'Bài báo tiếp cận vấn đề xây dựng năng lực lãnh đạo chiến lược trong các tổ chức công từ góc độ lý thuyết phức hợp và lãnh đạo thích ứng. Nghiên cứu phân tích năm năng lực cốt lõi cần thiết cho lãnh đạo tổ chức công trong môi trường VUCA, bao gồm tư duy hệ thống, ra quyết định trong điều kiện bất định, quản lý đa bên liên quan, lãnh đạo thay đổi và năng lực học tập tổ chức.',
    abstractEn: 'This paper approaches the issue of building strategic leadership capacity in public organizations from the perspective of complexity theory and adaptive leadership. The research analyzes five core competencies required for public organization leadership in a VUCA environment.',
    keywords: ['lãnh đạo chiến lược', 'tổ chức công', 'lý thuyết phức hợp', 'năng lực lãnh đạo', 'quản lý nhà nước'],
    htmlBody: `<p>Trong môi trường quản trị hiện đại được đặc trưng bởi tính bất định, phức tạp và thay đổi nhanh (VUCA), năng lực lãnh đạo chiến lược trong các tổ chức công ngày càng đóng vai trò quyết định. Tuy nhiên, phần lớn các mô hình phát triển lãnh đạo hiện nay vẫn được thiết kế cho môi trường ổn định, tuyến tính.</p>
<p>Nghiên cứu áp dụng lý thuyết phức hợp (Complexity Theory) và khung lãnh đạo thích ứng của Heifetz & Linsky để phân tích các thách thức mà lãnh đạo tổ chức công đang đối mặt. Dữ liệu được thu thập qua phỏng vấn chuyên sâu với 45 lãnh đạo cấp cao tại các bộ, ngành và địa phương, kết hợp nghiên cứu tình huống tại 8 tổ chức công tiêu biểu.</p>
<p>Kết quả nghiên cứu xác định năm năng lực lãnh đạo chiến lược cốt lõi cho bối cảnh hiện nay: Tư duy hệ thống và toàn cục; Quyết đoán trong điều kiện thông tin không đầy đủ; Quản lý xung đột lợi ích đa bên; Dẫn dắt quá trình thay đổi tổ chức; và Xây dựng năng lực học tập liên tục trong tổ chức.</p>
<p>Trên cơ sở phân tích, bài báo đề xuất khung phát triển năng lực lãnh đạo tích hợp ba phương thức: học tập qua kinh nghiệm, học tập xã hội trong cộng đồng thực hành, và phản tư phê phán. Mô hình này khác biệt so với các chương trình đào tạo truyền thống ở tính cá nhân hóa và gắn kết với bối cảnh thực tế của từng lãnh đạo.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-007',
    title: 'Kiểm soát tham nhũng trong khu vực công: Bài học từ các quốc gia có chỉ số nhận thức tham nhũng thấp',
    abstractVn: 'Bài báo nghiên cứu các mô hình kiểm soát tham nhũng hiệu quả từ kinh nghiệm của các quốc gia có chỉ số nhận thức tham nhũng (CPI) thấp như Đan Mạch, Phần Lan, New Zealand. Nghiên cứu xác định bảy nhân tố cấu trúc quyết định thành công bao gồm độc lập tư pháp, minh bạch ngân sách, bảo vệ người tố cáo, lương thưởng cạnh tranh cho công chức, xã hội dân sự mạnh, truyền thông độc lập và văn hóa liêm chính.',
    abstractEn: 'This paper studies effective corruption control models from the experience of countries with low Corruption Perceptions Index (CPI) such as Denmark, Finland, and New Zealand. The research identifies seven structural factors determining success in anti-corruption.',
    keywords: ['chống tham nhũng', 'quản trị công', 'minh bạch', 'liêm chính', 'CPI', 'kiểm soát tham nhũng'],
    htmlBody: `<p>Tham nhũng tiếp tục là một trong những thách thức cấu trúc lớn nhất đối với phát triển kinh tế và quản trị nhà nước tốt ở nhiều quốc gia đang phát triển. Trong khi các giải pháp kỹ thuật như số hóa và tự động hóa thủ tục hành chính có vai trò quan trọng, kinh nghiệm quốc tế cho thấy kiểm soát tham nhũng bền vững đòi hỏi thay đổi cấu trúc thể chế sâu rộng hơn.</p>
<p>Nghiên cứu phân tích trường hợp của bảy quốc gia có CPI từ 85/100 trở lên là Đan Mạch, Phần Lan, New Zealand, Singapore, Thụy Điển, Na Uy và Thụy Sĩ. Phương pháp so sánh hệ thống và phân tích đường dẫn nhân quả (QCA) được sử dụng để xác định các nhân tố cấu trúc quyết định thành công.</p>
<p>Kết quả xác định bảy nhân tố cấu trúc quan trọng: (1) Tư pháp độc lập và có thẩm quyền thực tế; (2) Ngân sách nhà nước minh bạch và kiểm toán độc lập; (3) Cơ chế bảo vệ người tố cáo hiệu quả; (4) Lương thưởng cạnh tranh trong khu vực công; (5) Xã hội dân sự tích cực và độc lập; (6) Truyền thông tự do và điều tra; (7) Văn hóa liêm chính được nhúng sâu vào chuẩn mực xã hội.</p>
<p>Phân tích so sánh cho thấy không có nhân tố đơn lẻ nào đủ mạnh để tạo ra thay đổi bền vững, mà cần có sự tương tác và tăng cường lẫn nhau giữa các nhân tố trong một hệ sinh thái liêm chính tổng thể. Đây là bài học quan trọng cho các quốc gia đang xây dựng chiến lược phòng chống tham nhũng.</p>`,
    status: 'PUBLISHED' as const,
  },

  // === Bài độc lập 8-10: Khoa học quân sự ===
  {
    code: 'HCQS-TEST-PL-008',
    title: 'Chiến tranh lai và những thách thức đối với an ninh quốc gia Việt Nam trong thập kỷ tới',
    abstractVn: 'Bài báo phân tích đặc điểm, xu hướng phát triển của chiến tranh lai (hybrid warfare) và tác động đến an ninh quốc gia Việt Nam. Nghiên cứu xác định năm chiều kích chính của chiến tranh lai hiện đại bao gồm không gian mạng, thông tin, kinh tế, chính trị và quân sự truyền thống, và đánh giá mức độ dễ bị tổn thương của Việt Nam trên từng chiều kích. Từ đó đề xuất khung chiến lược phòng thủ tổng hợp cho giai đoạn 2025-2035.',
    abstractEn: 'This paper analyzes the characteristics and development trends of hybrid warfare and its impact on Vietnam\'s national security. The research identifies five main dimensions of modern hybrid warfare and assesses Vietnam\'s vulnerability on each dimension, proposing a comprehensive defense strategy framework for 2025-2035.',
    keywords: ['chiến tranh lai', 'an ninh quốc gia', 'không gian mạng', 'chiến lược quốc phòng', 'Việt Nam', 'hybrid warfare'],
    htmlBody: `<p>Chiến tranh lai đang nổi lên như một mô thức xung đột chủ đạo của thế kỷ XXI, đặt ra thách thức mới cho các khái niệm an ninh truyền thống. Không như các cuộc chiến tranh quy ước với ranh giới rõ ràng giữa bình và chiến, chiến tranh lai khai thác đồng thời nhiều chiều không gian và công cụ để đạt mục tiêu chiến lược mà không cần đối đầu quân sự trực tiếp.</p>
<p>Bài báo sử dụng khung phân tích DIME (Diplomatic, Information, Military, Economic) mở rộng với thêm chiều không gian mạng để đánh giá toàn diện bức tranh chiến tranh lai đương đại. Dữ liệu được thu thập từ các báo cáo tình báo công khai, phân tích học thuật và tư vấn chuyên gia của 15 chuyên gia quốc phòng và an ninh có kinh nghiệm.</p>
<p>Phân tích cho thấy Việt Nam đối mặt với mức độ rủi ro khác nhau trên năm chiều kích: Rủi ro cao trong không gian mạng do hạ tầng số đang phát triển nhanh nhưng bảo mật chưa đồng bộ; Rủi ro trung bình-cao trong không gian thông tin và truyền thông xã hội; Rủi ro trung bình trong lĩnh vực kinh tế do phụ thuộc vào một số chuỗi cung ứng quan trọng; Rủi ro thấp-trung bình trong không gian chính trị nội địa; Rủi ro tổng thể từ chiều quân sự truyền thống.</p>
<p>Bài báo đề xuất khung chiến lược phòng thủ lai tổng hợp với bốn trụ cột: Nâng cao năng lực phòng thủ mạng và an ninh thông tin; Xây dựng khả năng chống chịu kinh tế và đa dạng hóa chuỗi cung ứng; Tăng cường công tác thông tin và truyền thông chiến lược; Hiện đại hóa lực lượng quân sự theo hướng tác chiến đa miền.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-009',
    title: 'Đảm bảo kỹ thuật vũ khí trang bị trong điều kiện tác chiến hiện đại: Thách thức và giải pháp',
    abstractVn: 'Bài báo nghiên cứu các thách thức trong đảm bảo kỹ thuật vũ khí trang bị cho lực lượng vũ trang nhân dân Việt Nam trong bối cảnh tác chiến hiện đại hóa. Nghiên cứu phân tích mô hình hậu phương kỹ thuật hiện tại, xác định các điểm yếu về công nghệ bảo dưỡng, chuỗi cung ứng phụ tùng và đào tạo nhân lực kỹ thuật. Đề xuất mô hình đảm bảo kỹ thuật thông minh tích hợp IoT, AI dự báo và tự động hóa quy trình.',
    abstractEn: 'This paper studies challenges in technical support for weapons and equipment for Vietnam\'s People\'s Armed Forces in the context of modern warfare. The research proposes a smart technical support model integrating IoT, predictive AI, and process automation.',
    keywords: ['đảm bảo kỹ thuật', 'vũ khí trang bị', 'bảo dưỡng', 'IoT quân sự', 'AI dự báo', 'hậu phương kỹ thuật'],
    htmlBody: `<p>Trong điều kiện tác chiến hiện đại với nhịp độ cao và phạm vi rộng, đảm bảo kỹ thuật vũ khí trang bị trở thành yếu tố sống còn quyết định khả năng duy trì sức mạnh chiến đấu. Sự phức tạp ngày càng tăng của các hệ thống vũ khí hiện đại, cùng yêu cầu sẵn sàng chiến đấu cao, đặt ra những thách thức chưa từng có cho công tác hậu phương kỹ thuật.</p>
<p>Nghiên cứu tiến hành điều tra khảo sát tại 12 đơn vị thuộc các quân chủng và binh chủng khác nhau, phỏng vấn 78 sĩ quan kỹ thuật và phân tích số liệu về tình trạng kỹ thuật và lịch sử bảo dưỡng của hơn 500 phương tiện và hệ thống vũ khí trong ba năm gần đây.</p>
<p>Kết quả xác định bốn thách thức chính: (1) Phụ thuộc vào nhà cung cấp nước ngoài cho 60-70% phụ tùng quan trọng của các vũ khí thế hệ mới; (2) Thiếu hệ thống giám sát tình trạng kỹ thuật thời gian thực, dẫn đến bảo dưỡng phòng ngừa không hiệu quả; (3) Khoảng cách kỹ năng giữa công nghệ vũ khí và năng lực đào tạo kỹ thuật viên; (4) Chuỗi cung ứng phụ tùng dài và dễ bị gián đoạn trong điều kiện tác chiến.</p>
<p>Bài báo đề xuất mô hình hậu phương kỹ thuật thông minh gồm ba thành phần: Hệ thống giám sát IoT tích hợp cảm biến trạng thái kỹ thuật trên các phương tiện; Mô-đun AI dự báo bảo dưỡng dựa trên phân tích dữ liệu vận hành; và Hệ thống quản lý phụ tùng và tự động hóa quy trình sửa chữa. Ước tính mô hình có thể giảm 40% thời gian ngừng hoạt động ngoài kế hoạch và tiết kiệm 25% chi phí bảo dưỡng hàng năm.</p>`,
    status: 'ACCEPTED' as const,
  },
  {
    code: 'HCQS-TEST-PL-010',
    title: 'Giáo dục - đào tạo sĩ quan trong giai đoạn đổi mới: Tích hợp công nghệ số và mô phỏng vào chương trình học',
    abstractVn: 'Bài báo trình bày kết quả nghiên cứu về tích hợp công nghệ số, thực tế ảo và mô phỏng chiến thuật vào chương trình đào tạo sĩ quan quân sự. Nghiên cứu đánh giá hiệu quả của các môi trường học tập hỗn hợp (blended learning) kết hợp giảng dạy truyền thống với thực hành ảo tại ba trường sĩ quan trong hai năm học. Kết quả cho thấy nhóm học theo mô hình tích hợp cải thiện 43% về hiệu quả học tập chiến thuật và rút ngắn 30% thời gian đào tạo so với phương pháp truyền thống.',
    abstractEn: 'This paper presents research results on integrating digital technology, virtual reality, and tactical simulation into military officer training programs. The study evaluates the effectiveness of blended learning environments at three officer schools over two academic years.',
    keywords: ['đào tạo sĩ quan', 'thực tế ảo', 'mô phỏng chiến thuật', 'giáo dục quân sự', 'blended learning', 'công nghệ số'],
    htmlBody: `<p>Đào tạo sĩ quan trong thời đại công nghệ số đang đứng trước yêu cầu đổi mới căn bản, toàn diện để đáp ứng chuẩn đầu ra của người sĩ quan có khả năng tác chiến trong môi trường đa miền, kết hợp sử dụng thành thục vũ khí truyền thống và công nghệ số. Các phương pháp đào tạo truyền thống, dù có giá trị nền tảng, chưa đủ để trang bị cho sĩ quan khả năng thích ứng với tốc độ thay đổi công nghệ chiến trường hiện nay.</p>
<p>Nghiên cứu triển khai thiết kế thực nghiệm có kiểm soát tại ba trường sĩ quan, với nhóm thực nghiệm (n=312) học theo chương trình tích hợp công nghệ và nhóm đối chứng (n=298) học theo chương trình truyền thống trong hai năm học liên tiếp. Các môn học thí điểm bao gồm Chiến thuật học, Chỉ huy tham mưu và Hậu cần chiến dịch.</p>
<p>Nhóm thực nghiệm được tiếp cận với: Môi trường mô phỏng chiến thuật 3D có khả năng tạo ra 200+ kịch bản khác nhau; Thiết bị VR/AR cho đào tạo kỹ năng vận hành trang thiết bị; Hệ thống phân tích dữ liệu học tập để cá nhân hóa lộ trình; và Bài tập nhóm trong môi trường số có giám sát AI.</p>
<p>Kết quả đánh giá sau hai năm cho thấy nhóm thực nghiệm vượt trội trên tất cả chỉ số đánh giá: Hiểu biết chiến thuật tăng 43%; Kỹ năng ra quyết định dưới áp lực cải thiện 38%; Khả năng hiệp đồng tác chiến tăng 51%; và thời gian đạt chuẩn năng lực rút ngắn 30% so với nhóm đối chứng. Đặc biệt, kết quả vượt trội nhất ở các năng lực đòi hỏi tư duy hệ thống và phán đoán trong điều kiện thông tin không đầy đủ.</p>`,
    status: 'PUBLISHED' as const,
  },
]

async function main() {
  console.log('🌱 Seeding plagiarism test data...')

  // Tìm user có role AUTHOR hoặc bất kỳ user nào để gán làm tác giả
  const authorUser = await db.user.findFirst({
    where: { role: { in: ['AUTHOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] } },
    select: { id: true, fullName: true, role: true },
  })

  if (!authorUser) {
    console.error('❌ Không tìm thấy user trong DB. Chạy seed chính trước.')
    process.exit(1)
  }

  console.log(`   Dùng user: ${authorUser.fullName} (${authorUser.role})`)

  let created = 0
  let skipped = 0

  for (const sub of SAMPLE_SUBMISSIONS) {
    const existing = await db.submission.findUnique({ where: { code: sub.code } })
    if (existing) {
      console.log(`   ⏭  Bỏ qua (đã tồn tại): ${sub.code}`)
      skipped++
      continue
    }

    await db.submission.create({
      data: {
        code: sub.code,
        title: sub.title,
        abstractVn: sub.abstractVn,
        abstractEn: sub.abstractEn,
        keywords: sub.keywords,
        status: sub.status,
        securityLevel: 'PUBLIC',
        createdBy: authorUser.id,
      },
    })

    console.log(`   ✅ Tạo: ${sub.code} — ${sub.title.substring(0, 60)}...`)
    created++
  }

  console.log(`\n📊 Kết quả: ${created} tạo mới, ${skipped} bỏ qua`)
  console.log('✨ Seed plagiarism test data hoàn tất!')
}

main()
  .catch(e => {
    console.error('❌ Lỗi seed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
