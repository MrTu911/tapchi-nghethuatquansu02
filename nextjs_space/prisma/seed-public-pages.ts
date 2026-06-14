/**
 * Seed script: khởi tạo PublicPage records cho các trang tĩnh (about, guidelines, contact)
 * Chạy: npx tsx prisma/seed-public-pages.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const pages = [
  {
    slug: 'about',
    title: 'Giới thiệu Tạp chí',
    titleEn: 'About the Journal',
    template: 'about',
    order: 1,
    metaTitle: 'Giới thiệu | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Tạp chí Nghệ thuật Quân sự Việt Nam - Học viện Quốc phòng. Diễn đàn khoa học công bố các công trình nghiên cứu về nghệ thuật quân sự.',
    content: `
<h2>Giới thiệu</h2>
<p>Tạp chí Nghệ thuật Quân sự Việt Nam là ấn phẩm khoa học chuyên ngành của <strong>Học viện Quốc phòng</strong>, được xuất bản nhằm công bố kết quả nghiên cứu khoa học, trao đổi học thuật và phổ biến tri thức trong lĩnh vực nghệ thuật quân sự.</p>
<p>Tạp chí tiếp nhận các công trình nghiên cứu lý luận và thực tiễn, các tổng quan khoa học, trao đổi học thuật phù hợp với định hướng phát triển nghệ thuật quân sự và sự nghiệp xây dựng Quân đội nhân dân Việt Nam.</p>

<h2>Mục tiêu & Phạm vi</h2>
<p>Tạp chí ưu tiên tiếp nhận các bài nghiên cứu thuộc các lĩnh vực nghệ thuật quân sự:</p>
<ul>
  <li>Chiến lược quân sự</li>
  <li>Nghệ thuật tác chiến</li>
  <li>Chiến dịch học</li>
  <li>Chiến thuật học</li>
  <li>Lịch sử quân sự</li>
  <li>Khoa học quân sự</li>
  <li>Giáo dục quân sự</li>
  <li>Hợp tác quốc phòng</li>
</ul>

<h2>Thông tin xuất bản</h2>
<table>
  <tbody>
    <tr><td><strong>Tên tạp chí</strong></td><td>Tạp chí Nghệ thuật Quân sự Việt Nam</td></tr>
    <tr><td><strong>Nhà xuất bản</strong></td><td>Học viện Quốc phòng</td></tr>
    <tr><td><strong>Ngôn ngữ</strong></td><td>Tiếng Việt (tóm tắt tiếng Anh)</td></tr>
    <tr><td><strong>Tần suất xuất bản</strong></td><td>Định kỳ (quý / năm)</td></tr>
    <tr><td><strong>Hình thức phản biện</strong></td><td>Phản biện kín (Double-blind peer review)</td></tr>
    <tr><td><strong>Truy cập</strong></td><td>Mở hoàn toàn, miễn phí đọc và tải về</td></tr>
  </tbody>
</table>

<h2>Chính sách truy cập mở</h2>
<p>Tạp chí thực hiện chính sách <strong>truy cập mở hoàn toàn</strong>: mọi bài báo đã xuất bản đều được đọc và tải xuống miễn phí. Tạp chí không thu phí xử lý bài (APC) từ tác giả. Tác giả được bảo lưu đầy đủ quyền tác giả theo điều kiện cấp phép được công bố kèm từng bài.</p>

<h2>Quy trình phản biện</h2>
<p>Mọi bài gửi đều trải qua quy trình phản biện kín nghiêm ngặt:</p>
<ol>
  <li><strong>Tiếp nhận bài:</strong> Tác giả nộp bài qua hệ thống trực tuyến. Ban biên tập xác nhận qua email.</li>
  <li><strong>Sàng lọc biên tập:</strong> Tổng biên tập hoặc biên tập viên đánh giá sơ bộ về hình thức và phạm vi chủ đề.</li>
  <li><strong>Phản biện kín:</strong> Bài được gửi tới ít nhất 2 phản biện độc lập. Danh tính tác giả và phản biện được giữ kín hoàn toàn.</li>
  <li><strong>Quyết định biên tập:</strong> Ban biên tập ra quyết định dựa trên ý kiến phản biện: chấp nhận, chỉnh sửa, hoặc từ chối.</li>
  <li><strong>Chỉnh sửa & Xuất bản:</strong> Bài được chấp nhận trải qua biên tập kỹ thuật, trình bày và xuất bản theo lịch số.</li>
</ol>

<h2>Liên hệ</h2>
<p>Mọi thắc mắc về việc nộp bài, phản biện hoặc các vấn đề liên quan, vui lòng liên hệ:<br/>
<strong>Email:</strong> <a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a><br/>
<strong>Địa chỉ:</strong> 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội<br/>
<strong>Giờ làm việc:</strong> Thứ 2 – Thứ 6: 8:00 – 17:00</p>
    `.trim(),
    contentEn: `
<h2>Introduction</h2>
<p>The Journal of Vietnamese Military Art is a specialized scientific publication of the <strong>National Defense Academy (HVQPh)</strong>, published to disseminate research results, facilitate academic exchange, and advance knowledge in the field of military art.</p>
<p>The journal welcomes theoretical and applied research papers, scientific reviews, and academic discussions relevant to the development of Vietnamese military art and the building of the People's Army for the defense of the Fatherland.</p>

<h2>Aims & Scope</h2>
<p>The journal prioritizes research in the following areas:</p>
<ul>
  <li>Strategic – operational – tactical logistics</li>
  <li>Military economic and financial management</li>
  <li>Military technical logistics and equipment</li>
  <li>Management science and leadership in the military</li>
  <li>Logistics support in modern conditions</li>
  <li>Applied research and technology development</li>
</ul>

<h2>Open Access Policy</h2>
<p>The journal operates a <strong>fully open access</strong> policy: all published articles are freely available to read and download. No article processing charges (APC) are levied on authors. Authors retain full copyright under the stated license terms.</p>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'guidelines',
    title: 'Hướng dẫn tác giả',
    titleEn: 'Author Guidelines',
    template: 'default',
    order: 2,
    metaTitle: 'Hướng dẫn tác giả | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Hướng dẫn đầy đủ cho tác giả về quy cách trình bày, yêu cầu nội dung và quy trình nộp bài.',
    content: `
<h2>1. Điều kiện nộp bài</h2>
<p>Tạp chí tiếp nhận các bài viết thỏa mãn đồng thời các điều kiện sau:</p>
<ul>
  <li>Là công trình nghiên cứu <strong>chưa được công bố</strong> ở bất kỳ ấn phẩm nào khác (trong nước và quốc tế).</li>
  <li>Không đang được gửi tới tạp chí, hội thảo, hay ấn phẩm khác để xét duyệt cùng lúc.</li>
  <li>Nội dung thuộc phạm vi chủ đề của tạp chí: nghệ thuật quân sự và các lĩnh vực khoa học quân sự liên quan.</li>
  <li>Tác giả chịu trách nhiệm về tính xác thực, trung thực của số liệu và kết quả nghiên cứu.</li>
  <li>Bài viết không vi phạm bản quyền, không sao chép, đạo văn từ tài liệu khác.</li>
</ul>

<h2>2. Quy cách trình bày</h2>
<table>
  <thead><tr><th>Yêu cầu</th><th>Chi tiết</th></tr></thead>
  <tbody>
    <tr><td>Định dạng file</td><td>Microsoft Word (.docx) hoặc PDF</td></tr>
    <tr><td>Font chữ</td><td>Times New Roman, cỡ 12pt</td></tr>
    <tr><td>Giãn dòng</td><td>1.5 hoặc 2.0 (toàn bài)</td></tr>
    <tr><td>Lề trang</td><td>Trên/Dưới: 2,5cm; Trái/Phải: 3cm</td></tr>
    <tr><td>Độ dài bài</td><td>4.000 – 8.000 từ (không kể tài liệu tham khảo)</td></tr>
    <tr><td>Kích thước hình/bảng</td><td>Vừa chiều rộng cột, độ phân giải ≥ 300 DPI</td></tr>
  </tbody>
</table>
<p><em>Lưu ý: Tất cả bảng và hình phải có tiêu đề, số thứ tự rõ ràng và được đề cập trong nội dung bài.</em></p>

<h2>3. Cấu trúc bài viết bắt buộc</h2>
<ol>
  <li><strong>Tiêu đề</strong> – Tiếng Việt (tối đa 15 từ) và tiếng Anh</li>
  <li><strong>Thông tin tác giả</strong> – Họ tên, đơn vị, email liên hệ của tác giả chính</li>
  <li><strong>Tóm tắt tiếng Việt</strong> – 150–250 từ: mục tiêu, phương pháp, kết quả chính</li>
  <li><strong>Tóm tắt tiếng Anh</strong> – 150–250 từ, dịch đầy đủ và chính xác</li>
  <li><strong>Từ khóa</strong> – 4–6 từ hoặc cụm từ (Tiếng Việt và Tiếng Anh)</li>
  <li><strong>Mở đầu</strong> – Đặt vấn đề, mục tiêu nghiên cứu, tổng quan tài liệu</li>
  <li><strong>Nội dung / Phương pháp</strong> – Phương pháp nghiên cứu, phân tích, luận giải</li>
  <li><strong>Kết quả & Thảo luận</strong> – Trình bày kết quả, phân tích và so sánh</li>
  <li><strong>Kết luận</strong> – Tổng kết, ý nghĩa, hạn chế và hướng phát triển</li>
  <li><strong>Tài liệu tham khảo</strong> – Danh mục tài liệu đã trích dẫn</li>
</ol>

<h2>4. Trích dẫn tài liệu tham khảo</h2>
<p>Tạp chí sử dụng chuẩn trích dẫn <strong>APA 7th Edition</strong>. Trong bài, trích dẫn theo dạng (Tác giả, Năm).</p>
<p><strong>Ví dụ – Bài báo tạp chí:</strong><br/>
<code>Nguyễn Văn A. (2023). Tên bài báo. <em>Tên Tạp chí</em>, <em>số(tập)</em>, trang–trang. https://doi.org/...</code></p>
<p><strong>Ví dụ – Sách:</strong><br/>
<code>Trần Thị B. (2021). <em>Tên sách đầy đủ</em> (tái bản lần 2). Nhà xuất bản.</code></p>
<p><strong>Yêu cầu:</strong> Tối thiểu 10 tài liệu tham khảo, trong đó ít nhất 3 tài liệu tiếng Anh. Ưu tiên trích dẫn tài liệu từ 5 năm gần nhất.</p>

<h2>5. Đạo đức trong nghiên cứu khoa học</h2>
<ul>
  <li><strong>Tính nguyên gốc:</strong> Bài nộp phải là công trình gốc, không sao chép hoặc đạo văn.</li>
  <li><strong>Xung đột lợi ích:</strong> Phải công bố rõ bất kỳ mối quan hệ tài chính hay cá nhân có thể ảnh hưởng tới kết quả.</li>
  <li><strong>Đóng góp tác giả:</strong> Chỉ liệt kê những người thực sự có đóng góp thực chất.</li>
  <li><strong>Dữ liệu trung thực:</strong> Số liệu nghiên cứu phải trung thực, không bịa đặt hoặc chỉnh sửa có chủ đích.</li>
  <li><strong>Bài trùng lặp:</strong> Không nộp bài đang được gửi cho ấn phẩm khác. Vi phạm sẽ bị từ chối và thông báo tới đơn vị tác giả.</li>
</ul>

<h2>6. Thời gian xử lý</h2>
<table>
  <thead><tr><th>Giai đoạn</th><th>Thời gian ước tính</th></tr></thead>
  <tbody>
    <tr><td>Xác nhận nhận bài</td><td>Ngay lập tức (qua email)</td></tr>
    <tr><td>Sàng lọc biên tập</td><td>3 – 5 ngày làm việc</td></tr>
    <tr><td>Phản biện kín</td><td>2 – 4 tuần</td></tr>
    <tr><td>Thông báo kết quả</td><td>4 – 6 tuần tổng cộng</td></tr>
    <tr><td>Hoàn thiện sau chỉnh sửa</td><td>1 – 2 tuần</td></tr>
    <tr><td>Xuất bản trực tuyến</td><td>Theo lịch số tạp chí</td></tr>
  </tbody>
</table>

<h2>7. Nộp bài</h2>
<p>Tác giả đăng ký tài khoản và nộp bài trực tuyến qua hệ thống quản lý tạp chí. Mọi thắc mắc liên hệ: <a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a></p>
    `.trim(),
    contentEn: `
<h2>1. Submission Requirements</h2>
<p>The journal accepts manuscripts that meet all of the following conditions:</p>
<ul>
  <li>The work must be <strong>original and unpublished</strong> in any other venue.</li>
  <li>The manuscript must not be under simultaneous review elsewhere.</li>
  <li>The content must fall within the journal's scope.</li>
  <li>Authors are responsible for the accuracy and integrity of reported data and results.</li>
  <li>The manuscript must not infringe on copyright or constitute plagiarism.</li>
</ul>

<h2>2. Manuscript Format</h2>
<table>
  <thead><tr><th>Requirement</th><th>Specification</th></tr></thead>
  <tbody>
    <tr><td>File format</td><td>Microsoft Word (.docx) or PDF</td></tr>
    <tr><td>Font</td><td>Times New Roman, 12pt</td></tr>
    <tr><td>Line spacing</td><td>1.5 or 2.0 (throughout)</td></tr>
    <tr><td>Length</td><td>4,000 – 8,000 words (excluding references)</td></tr>
  </tbody>
</table>

<h2>3. Ethics Policy</h2>
<p>All submitted manuscripts are checked for plagiarism. Authors must disclose any conflicts of interest and confirm that the work is original. Fabrication or falsification of data will result in immediate rejection and notification to the authors' institution.</p>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'author-guidelines',
    title: 'Hướng dẫn tác giả',
    titleEn: 'Author Guidelines',
    template: 'default',
    order: 5,
    metaTitle: 'Hướng dẫn tác giả | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Hướng dẫn đầy đủ cho tác giả về quy cách trình bày, yêu cầu nội dung và quy trình nộp bài.',
    content: `
<h2>1. Điều kiện nộp bài</h2>
<p>Tạp chí tiếp nhận các bài viết thỏa mãn đồng thời các điều kiện sau:</p>
<ul>
  <li>Là công trình nghiên cứu <strong>chưa được công bố</strong> ở bất kỳ ấn phẩm nào khác (trong nước và quốc tế).</li>
  <li>Không đang được gửi tới tạp chí, hội thảo, hay ấn phẩm khác để xét duyệt cùng lúc.</li>
  <li>Nội dung thuộc phạm vi chủ đề của tạp chí: nghệ thuật quân sự và các lĩnh vực khoa học quân sự liên quan.</li>
  <li>Tác giả chịu trách nhiệm về tính xác thực, trung thực của số liệu và kết quả nghiên cứu.</li>
  <li>Bài viết không vi phạm bản quyền, không sao chép, đạo văn từ tài liệu khác.</li>
</ul>

<h2>2. Quy cách trình bày</h2>
<table>
  <thead><tr><th>Yêu cầu</th><th>Chi tiết</th></tr></thead>
  <tbody>
    <tr><td>Định dạng file</td><td>Microsoft Word (.docx) hoặc PDF</td></tr>
    <tr><td>Font chữ</td><td>Times New Roman, cỡ 12pt</td></tr>
    <tr><td>Giãn dòng</td><td>1.5 hoặc 2.0 (toàn bài)</td></tr>
    <tr><td>Lề trang</td><td>Trên/Dưới: 2,5cm; Trái/Phải: 3cm</td></tr>
    <tr><td>Độ dài bài</td><td>4.000 – 8.000 từ (không kể tài liệu tham khảo)</td></tr>
    <tr><td>Kích thước hình/bảng</td><td>Vừa chiều rộng cột, độ phân giải ≥ 300 DPI</td></tr>
  </tbody>
</table>
<p><em>Lưu ý: Tất cả bảng và hình phải có tiêu đề, số thứ tự rõ ràng và được đề cập trong nội dung bài.</em></p>

<h2>3. Cấu trúc bài viết bắt buộc</h2>
<ol>
  <li><strong>Tiêu đề</strong> – Tiếng Việt (tối đa 15 từ) và tiếng Anh</li>
  <li><strong>Thông tin tác giả</strong> – Họ tên, đơn vị, email liên hệ của tác giả chính</li>
  <li><strong>Tóm tắt tiếng Việt</strong> – 150–250 từ: mục tiêu, phương pháp, kết quả chính</li>
  <li><strong>Tóm tắt tiếng Anh</strong> – 150–250 từ, dịch đầy đủ và chính xác</li>
  <li><strong>Từ khóa</strong> – 4–6 từ hoặc cụm từ (Tiếng Việt và Tiếng Anh)</li>
  <li><strong>Mở đầu</strong> – Đặt vấn đề, mục tiêu nghiên cứu, tổng quan tài liệu</li>
  <li><strong>Nội dung / Phương pháp</strong> – Phương pháp nghiên cứu, phân tích, luận giải</li>
  <li><strong>Kết quả & Thảo luận</strong> – Trình bày kết quả, phân tích và so sánh</li>
  <li><strong>Kết luận</strong> – Tổng kết, ý nghĩa, hạn chế và hướng phát triển</li>
  <li><strong>Tài liệu tham khảo</strong> – Danh mục tài liệu đã trích dẫn</li>
</ol>

<h2>4. Trích dẫn tài liệu tham khảo</h2>
<p>Tạp chí sử dụng chuẩn trích dẫn <strong>APA 7th Edition</strong>. Trong bài, trích dẫn theo dạng (Tác giả, Năm).</p>
<p><strong>Ví dụ – Bài báo tạp chí:</strong><br/>
<code>Nguyễn Văn A. (2023). Tên bài báo. <em>Tên Tạp chí</em>, <em>số(tập)</em>, trang–trang. https://doi.org/...</code></p>
<p><strong>Ví dụ – Sách:</strong><br/>
<code>Trần Thị B. (2021). <em>Tên sách đầy đủ</em> (tái bản lần 2). Nhà xuất bản.</code></p>
<p><strong>Yêu cầu:</strong> Tối thiểu 10 tài liệu tham khảo, trong đó ít nhất 3 tài liệu tiếng Anh. Ưu tiên trích dẫn tài liệu từ 5 năm gần nhất.</p>

<h2>5. Đạo đức trong nghiên cứu khoa học</h2>
<ul>
  <li><strong>Tính nguyên gốc:</strong> Bài nộp phải là công trình gốc, không sao chép hoặc đạo văn.</li>
  <li><strong>Xung đột lợi ích:</strong> Phải công bố rõ bất kỳ mối quan hệ tài chính hay cá nhân có thể ảnh hưởng tới kết quả.</li>
  <li><strong>Đóng góp tác giả:</strong> Chỉ liệt kê những người thực sự có đóng góp thực chất.</li>
  <li><strong>Dữ liệu trung thực:</strong> Số liệu nghiên cứu phải trung thực, không bịa đặt hoặc chỉnh sửa có chủ đích.</li>
  <li><strong>Bài trùng lặp:</strong> Không nộp bài đang được gửi cho ấn phẩm khác. Vi phạm sẽ bị từ chối và thông báo tới đơn vị tác giả.</li>
</ul>

<h2>6. Thời gian xử lý</h2>
<table>
  <thead><tr><th>Giai đoạn</th><th>Thời gian ước tính</th></tr></thead>
  <tbody>
    <tr><td>Xác nhận nhận bài</td><td>Ngay lập tức (qua email)</td></tr>
    <tr><td>Sàng lọc biên tập</td><td>3 – 5 ngày làm việc</td></tr>
    <tr><td>Phản biện kín</td><td>2 – 4 tuần</td></tr>
    <tr><td>Thông báo kết quả</td><td>4 – 6 tuần tổng cộng</td></tr>
    <tr><td>Hoàn thiện sau chỉnh sửa</td><td>1 – 2 tuần</td></tr>
    <tr><td>Xuất bản trực tuyến</td><td>Theo lịch số tạp chí</td></tr>
  </tbody>
</table>

<h2>7. Nộp bài</h2>
<p>Tác giả đăng ký tài khoản và nộp bài trực tuyến qua hệ thống quản lý tạp chí. Mọi thắc mắc liên hệ: <a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a></p>
    `.trim(),
    contentEn: `
<h2>1. Submission Requirements</h2>
<p>The journal accepts manuscripts that meet all of the following conditions:</p>
<ul>
  <li>The work must be <strong>original and unpublished</strong> in any other venue.</li>
  <li>The manuscript must not be under simultaneous review elsewhere.</li>
  <li>The content must fall within the journal's scope.</li>
  <li>Authors are responsible for the accuracy and integrity of reported data and results.</li>
  <li>The manuscript must not infringe on copyright or constitute plagiarism.</li>
</ul>

<h2>2. Manuscript Format</h2>
<table>
  <thead><tr><th>Requirement</th><th>Specification</th></tr></thead>
  <tbody>
    <tr><td>File format</td><td>Microsoft Word (.docx) or PDF</td></tr>
    <tr><td>Font</td><td>Times New Roman, 12pt</td></tr>
    <tr><td>Line spacing</td><td>1.5 or 2.0 (throughout)</td></tr>
    <tr><td>Margins</td><td>Top/Bottom: 2.5cm; Left/Right: 3cm</td></tr>
    <tr><td>Length</td><td>4,000 – 8,000 words (excluding references)</td></tr>
    <tr><td>Figures/Tables</td><td>Column-width, resolution ≥ 300 DPI</td></tr>
  </tbody>
</table>

<h2>3. Required Structure</h2>
<ol>
  <li><strong>Title</strong> – Vietnamese (max 15 words) and English</li>
  <li><strong>Author Information</strong> – Full name, affiliation, contact email of corresponding author</li>
  <li><strong>Vietnamese Abstract</strong> – 150–250 words: objectives, methods, key results</li>
  <li><strong>English Abstract</strong> – 150–250 words, accurate translation</li>
  <li><strong>Keywords</strong> – 4–6 terms (Vietnamese and English)</li>
  <li><strong>Introduction</strong> – Problem statement, research objectives, literature review</li>
  <li><strong>Methods</strong> – Research methodology, analysis approach</li>
  <li><strong>Results & Discussion</strong> – Findings, analysis, comparison</li>
  <li><strong>Conclusion</strong> – Summary, significance, limitations, future directions</li>
  <li><strong>References</strong> – List of cited works</li>
</ol>

<h2>4. References</h2>
<p>The journal uses <strong>APA 7th Edition</strong> citation style. In-text citations follow the (Author, Year) format.</p>
<p>Minimum 10 references, including at least 3 in English. Recent publications (within 5 years) are preferred.</p>

<h2>5. Ethics Policy</h2>
<p>All submitted manuscripts are checked for plagiarism. Authors must disclose any conflicts of interest and confirm that the work is original. Fabrication or falsification of data will result in immediate rejection and notification to the authors' institution.</p>

<h2>6. Processing Timeline</h2>
<table>
  <thead><tr><th>Stage</th><th>Estimated Time</th></tr></thead>
  <tbody>
    <tr><td>Submission acknowledgement</td><td>Immediately (via email)</td></tr>
    <tr><td>Editorial screening</td><td>3 – 5 business days</td></tr>
    <tr><td>Peer review</td><td>2 – 4 weeks</td></tr>
    <tr><td>Decision notification</td><td>4 – 6 weeks total</td></tr>
    <tr><td>Revision turnaround</td><td>1 – 2 weeks</td></tr>
    <tr><td>Online publication</td><td>Per journal issue schedule</td></tr>
  </tbody>
</table>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'publishing-process',
    title: 'Quy trình xuất bản',
    titleEn: 'Publishing Process',
    template: 'default',
    order: 6,
    metaTitle: 'Quy trình xuất bản | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Quy trình từ nộp bài đến xuất bản của Tạp chí Nghệ thuật Quân sự Việt Nam.',
    content: `
<h2>Tổng quan quy trình</h2>
<p>Tạp chí áp dụng quy trình xuất bản chặt chẽ nhằm đảm bảo chất lượng khoa học và tính minh bạch. Mỗi bài viết trải qua đầy đủ các bước từ tiếp nhận, sàng lọc, phản biện, chỉnh sửa đến xuất bản chính thức.</p>

<h2>Các bước quy trình</h2>

<h3>Bước 1 — Nộp bài</h3>
<p>Tác giả đăng nhập hệ thống, điền thông tin bài viết và tải lên file bài hoàn chỉnh. Hệ thống gửi email xác nhận ngay khi tiếp nhận thành công.</p>
<ul>
  <li>File định dạng: .docx hoặc .pdf</li>
  <li>Phải đính kèm: thư giới thiệu tuyên bố tính nguyên gốc</li>
  <li>Thông tin tác giả phải đầy đủ: họ tên, đơn vị, email liên hệ</li>
</ul>

<h3>Bước 2 — Sàng lọc biên tập (3–5 ngày làm việc)</h3>
<p>Tổng biên tập hoặc biên tập viên phụ trách đánh giá bài về:</p>
<ul>
  <li>Phạm vi chủ đề — có thuộc lĩnh vực tạp chí không</li>
  <li>Hình thức — đúng quy cách trình bày không</li>
  <li>Chất lượng ngôn ngữ — rõ ràng, khoa học</li>
  <li>Kiểm tra sơ bộ đạo văn bằng phần mềm chuyên dụng</li>
</ul>
<p>Bài không đạt sàng lọc sẽ bị trả lại cùng lý do cụ thể. Tác giả có thể chỉnh sửa và nộp lại.</p>

<h3>Bước 3 — Phản biện kín (2–4 tuần)</h3>
<p>Bài đạt sàng lọc được gửi tới ít nhất <strong>2 phản biện độc lập</strong> theo cơ chế phản biện kín hai chiều (Double-blind): tác giả không biết danh tính phản biện và ngược lại.</p>
<p>Phản biện đánh giá theo các tiêu chí:</p>
<ul>
  <li>Tính mới và đóng góp khoa học</li>
  <li>Phương pháp nghiên cứu</li>
  <li>Chất lượng số liệu và lập luận</li>
  <li>Tính phù hợp với phạm vi tạp chí</li>
  <li>Chất lượng trình bày và tài liệu tham khảo</li>
</ul>

<h3>Bước 4 — Quyết định biên tập</h3>
<p>Dựa trên ý kiến phản biện, Ban biên tập ra một trong các quyết định:</p>
<table>
  <thead><tr><th>Quyết định</th><th>Ý nghĩa</th></tr></thead>
  <tbody>
    <tr><td><strong>Chấp nhận</strong></td><td>Bài đạt yêu cầu, chuyển sang biên tập kỹ thuật</td></tr>
    <tr><td><strong>Chỉnh sửa nhỏ</strong></td><td>Cần bổ sung/sửa một số điểm cụ thể, không cần phản biện lại</td></tr>
    <tr><td><strong>Chỉnh sửa lớn</strong></td><td>Cần chỉnh sửa đáng kể, sẽ gửi phản biện lại sau khi sửa</td></tr>
    <tr><td><strong>Từ chối</strong></td><td>Không phù hợp về nội dung hoặc chất lượng không đạt</td></tr>
  </tbody>
</table>

<h3>Bước 5 — Chỉnh sửa theo yêu cầu phản biện</h3>
<p>Tác giả nhận được ý kiến phản biện (ẩn danh) và phải gửi lại bản chỉnh sửa kèm <strong>bản giải trình</strong> ghi rõ từng điểm đã sửa và lý do không sửa (nếu có). Thời hạn chỉnh sửa: <strong>2–4 tuần</strong> tùy quyết định biên tập.</p>

<h3>Bước 6 — Biên tập kỹ thuật & Trình bày</h3>
<p>Bài được chấp nhận chuyển sang bộ phận kỹ thuật để:</p>
<ul>
  <li>Biên tập ngôn ngữ, chính tả, thuật ngữ</li>
  <li>Trình bày theo mẫu ấn phẩm</li>
  <li>Gán DOI và metadata xuất bản</li>
  <li>Gửi bản proof cho tác giả xác nhận lần cuối</li>
</ul>

<h3>Bước 7 — Xuất bản</h3>
<p>Sau khi tác giả xác nhận bản proof, bài được xuất bản trực tuyến trên hệ thống và đưa vào số tạp chí theo lịch xuất bản. Tác giả nhận thông báo và link bài đã xuất bản.</p>

<h2>Thời gian tổng thể</h2>
<table>
  <thead><tr><th>Giai đoạn</th><th>Thời gian ước tính</th></tr></thead>
  <tbody>
    <tr><td>Nộp bài → Kết quả sàng lọc</td><td>3 – 5 ngày làm việc</td></tr>
    <tr><td>Sàng lọc → Kết quả phản biện</td><td>2 – 4 tuần</td></tr>
    <tr><td>Quyết định → Xuất bản</td><td>2 – 4 tuần (sau khi bài hoàn chỉnh)</td></tr>
    <tr><td><strong>Tổng thời gian (trung bình)</strong></td><td><strong>6 – 10 tuần</strong></td></tr>
  </tbody>
</table>

<h2>Theo dõi trạng thái bài</h2>
<p>Tác giả có thể theo dõi trạng thái bài viết theo thời gian thực sau khi đăng nhập vào tài khoản trên hệ thống. Mọi thay đổi trạng thái sẽ được thông báo qua email tự động.</p>
    `.trim(),
    contentEn: `
<h2>Process Overview</h2>
<p>The journal follows a rigorous publishing process to ensure scientific quality and transparency. Each manuscript passes through receipt, screening, peer review, revision, and formal publication.</p>

<h2>Step-by-Step Process</h2>

<h3>Step 1 — Submission</h3>
<p>Authors log in to the system, complete the submission form, and upload the full manuscript. An acknowledgement email is sent automatically upon successful submission.</p>

<h3>Step 2 — Editorial Screening (3–5 business days)</h3>
<p>The editor-in-chief or handling editor assesses the manuscript for scope fit, formatting compliance, language quality, and preliminary plagiarism check. Manuscripts failing screening are returned with specific reasons.</p>

<h3>Step 3 — Double-Blind Peer Review (2–4 weeks)</h3>
<p>Manuscripts passing screening are sent to at least <strong>2 independent reviewers</strong> under double-blind review. Neither the authors nor reviewers know each other's identities.</p>

<h3>Step 4 — Editorial Decision</h3>
<table>
  <thead><tr><th>Decision</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><strong>Accept</strong></td><td>Manuscript meets requirements; proceeds to technical editing</td></tr>
    <tr><td><strong>Minor Revision</strong></td><td>Small changes needed; no re-review required</td></tr>
    <tr><td><strong>Major Revision</strong></td><td>Significant revision required; will be re-reviewed</td></tr>
    <tr><td><strong>Reject</strong></td><td>Does not meet scope or quality standards</td></tr>
  </tbody>
</table>

<h3>Step 5 — Revision</h3>
<p>Authors receive anonymized reviewer comments and must submit a revised manuscript with a <strong>response letter</strong> detailing each change made. Revision deadline: 2–4 weeks.</p>

<h3>Step 6 — Technical Editing & Layout</h3>
<p>Accepted manuscripts undergo language editing, journal typesetting, DOI assignment, and author proof confirmation.</p>

<h3>Step 7 — Publication</h3>
<p>After author approval of the proof, the article is published online and included in the scheduled journal issue.</p>

<h2>Overall Timeline</h2>
<table>
  <thead><tr><th>Stage</th><th>Estimated Time</th></tr></thead>
  <tbody>
    <tr><td>Submission → Screening result</td><td>3 – 5 business days</td></tr>
    <tr><td>Screening → Review result</td><td>2 – 4 weeks</td></tr>
    <tr><td>Decision → Publication</td><td>2 – 4 weeks</td></tr>
    <tr><td><strong>Total (average)</strong></td><td><strong>6 – 10 weeks</strong></td></tr>
  </tbody>
</table>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'review-policy',
    title: 'Chính sách phản biện',
    titleEn: 'Review Policy',
    template: 'default',
    order: 7,
    metaTitle: 'Chính sách phản biện | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Chính sách phản biện kín và tiêu chuẩn đánh giá bài viết của Tạp chí Nghệ thuật Quân sự Việt Nam.',
    content: `
<h2>Hình thức phản biện</h2>
<p>Tạp chí áp dụng hình thức <strong>phản biện kín hai chiều (Double-blind peer review)</strong>: danh tính của tác giả được ẩn với phản biện, và danh tính của phản biện được ẩn với tác giả. Hình thức này nhằm đảm bảo tính khách quan, độc lập và công bằng trong quá trình đánh giá khoa học.</p>

<h2>Lựa chọn phản biện</h2>
<p>Ban biên tập lựa chọn phản biện dựa trên các tiêu chí:</p>
<ul>
  <li>Có chuyên môn sâu trong lĩnh vực liên quan đến bài viết</li>
  <li>Không có xung đột lợi ích với tác giả hoặc nội dung bài</li>
  <li>Có kinh nghiệm nghiên cứu và công bố khoa học</li>
  <li>Cam kết hoàn thành phản biện đúng thời hạn</li>
</ul>
<p>Mỗi bài viết được gửi tới <strong>ít nhất 2 phản biện độc lập</strong>. Trong trường hợp hai ý kiến trái chiều hoàn toàn, Ban biên tập có thể chỉ định thêm phản biện thứ 3.</p>

<h2>Tiêu chí đánh giá</h2>
<p>Phản biện đánh giá bài viết theo các tiêu chí sau:</p>
<table>
  <thead><tr><th>Tiêu chí</th><th>Mô tả</th></tr></thead>
  <tbody>
    <tr><td><strong>Tính mới</strong></td><td>Đóng góp tri thức mới so với các công trình đã có</td></tr>
    <tr><td><strong>Tính khoa học</strong></td><td>Phương pháp chặt chẽ, lập luận logic, số liệu trung thực</td></tr>
    <tr><td><strong>Tính phù hợp</strong></td><td>Đúng phạm vi và mục tiêu của tạp chí</td></tr>
    <tr><td><strong>Chất lượng trình bày</strong></td><td>Văn phong khoa học, cấu trúc rõ ràng, tài liệu tham khảo đầy đủ</td></tr>
    <tr><td><strong>Giá trị thực tiễn</strong></td><td>Có thể ứng dụng hoặc có giá trị tham khảo thực tế</td></tr>
    <tr><td><strong>Đạo đức nghiên cứu</strong></td><td>Không vi phạm đạo văn, số liệu trung thực, xung đột lợi ích được khai báo</td></tr>
  </tbody>
</table>

<h2>Thời hạn phản biện</h2>
<p>Phản biện được yêu cầu hoàn thành trong vòng <strong>2–3 tuần</strong> kể từ ngày nhận bài. Nếu không thể hoàn thành đúng hạn, phản biện cần thông báo trước để Ban biên tập có phương án xử lý kịp thời.</p>

<h2>Trách nhiệm và quyền lợi phản biện</h2>
<h3>Trách nhiệm</h3>
<ul>
  <li>Đánh giá khách quan, trung thực dựa trên bằng chứng khoa học</li>
  <li>Bảo mật nội dung bài viết — không chia sẻ hay sử dụng cho mục đích khác</li>
  <li>Thông báo ngay nếu phát hiện xung đột lợi ích</li>
  <li>Hoàn thành phản biện đúng thời hạn hoặc thông báo kịp thời nếu không thể</li>
  <li>Không liên hệ trực tiếp với tác giả về bài viết trong quá trình phản biện</li>
</ul>
<h3>Quyền lợi</h3>
<ul>
  <li>Được Ban biên tập ghi nhận đóng góp trong báo cáo thường niên</li>
  <li>Được ưu tiên xem xét khi nộp bài theo các điều kiện tương đương</li>
</ul>

<h2>Xung đột lợi ích</h2>
<p>Phản biện phải từ chối đánh giá và thông báo ngay cho Ban biên tập nếu có bất kỳ mối quan hệ nào có thể ảnh hưởng đến tính khách quan:</p>
<ul>
  <li>Là đồng tác giả, cộng sự gần đây hoặc người cùng đơn vị với tác giả</li>
  <li>Có quan hệ cạnh tranh hoặc hợp tác trực tiếp với tác giả</li>
  <li>Có lợi ích tài chính liên quan đến kết quả nghiên cứu</li>
</ul>

<h2>Chính sách đạo văn</h2>
<p>Tất cả bài nộp đều được kiểm tra bằng phần mềm phát hiện đạo văn trước khi gửi phản biện. Bài có tỷ lệ trùng lặp vượt ngưỡng cho phép sẽ bị trả lại tác giả để xử lý trước khi xem xét tiếp.</p>

<h2>Khiếu nại và phúc thẩm</h2>
<p>Tác giả có quyền phúc thẩm quyết định từ chối nếu cho rằng quá trình phản biện không công bằng hoặc có sai sót nghiêm trọng. Yêu cầu phúc thẩm phải gửi bằng văn bản tới Tổng biên tập trong vòng <strong>30 ngày</strong> kể từ ngày nhận quyết định, kèm giải trình cụ thể. Ban biên tập sẽ xem xét và trả lời trong vòng 15 ngày làm việc.</p>
    `.trim(),
    contentEn: `
<h2>Review Model</h2>
<p>The journal uses <strong>double-blind peer review</strong>: author identities are hidden from reviewers, and reviewer identities are hidden from authors. This ensures objectivity, independence, and fairness in the scientific evaluation process.</p>

<h2>Reviewer Selection</h2>
<p>The editorial board selects reviewers based on expertise in the manuscript's subject area, absence of conflicts of interest, research experience, and commitment to timely review. Each manuscript is reviewed by <strong>at least 2 independent reviewers</strong>.</p>

<h2>Evaluation Criteria</h2>
<table>
  <thead><tr><th>Criterion</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>Originality</strong></td><td>New contribution to knowledge compared to existing work</td></tr>
    <tr><td><strong>Scientific rigor</strong></td><td>Sound methodology, logical argumentation, honest data</td></tr>
    <tr><td><strong>Relevance</strong></td><td>Fits the journal's scope and aims</td></tr>
    <tr><td><strong>Presentation quality</strong></td><td>Academic writing, clear structure, complete references</td></tr>
    <tr><td><strong>Practical value</strong></td><td>Applicable or of practical reference value</td></tr>
    <tr><td><strong>Research ethics</strong></td><td>No plagiarism, honest data, declared conflicts of interest</td></tr>
  </tbody>
</table>

<h2>Review Timeline</h2>
<p>Reviewers are expected to complete their assessment within <strong>2–3 weeks</strong> of receiving the manuscript. Early notification is required if the deadline cannot be met.</p>

<h2>Reviewer Responsibilities</h2>
<ul>
  <li>Provide objective, evidence-based assessments</li>
  <li>Keep manuscript content strictly confidential</li>
  <li>Declare any conflicts of interest immediately</li>
  <li>Complete reviews on time or notify the editorial office promptly</li>
  <li>Avoid direct contact with authors during the review process</li>
</ul>

<h2>Conflict of Interest</h2>
<p>Reviewers must decline and notify the editorial board immediately if they have any relationship that could affect objectivity, including recent co-authorship, direct collaboration, institutional affiliation, or financial interest in the research outcomes.</p>

<h2>Plagiarism Policy</h2>
<p>All submissions are screened for plagiarism before peer review. Manuscripts exceeding the acceptable similarity threshold are returned to authors for resolution before further consideration.</p>

<h2>Appeals</h2>
<p>Authors may appeal a rejection decision if they believe the review process was unfair or contained serious errors. Appeals must be submitted in writing to the Editor-in-Chief within <strong>30 days</strong> of the decision, with specific justification. The editorial board will respond within 15 business days.</p>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'scope',
    title: 'Phạm vi & Mục tiêu',
    titleEn: 'Aims & Scope',
    template: 'default',
    order: 3,
    metaTitle: 'Phạm vi & Mục tiêu | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Phạm vi chủ đề và mục tiêu khoa học của Tạp chí Nghệ thuật Quân sự Việt Nam.',
    content: `
<h2>Mục tiêu</h2>
<p>Tạp chí Nghệ thuật Quân sự Việt Nam được xuất bản nhằm:</p>
<ul>
  <li>Công bố kết quả nghiên cứu khoa học có giá trị trong lĩnh vực nghệ thuật quân sự và các ngành liên quan.</li>
  <li>Tạo diễn đàn trao đổi học thuật giữa các nhà khoa học, giảng viên, sĩ quan nghiên cứu trong và ngoài Quân đội.</li>
  <li>Phổ biến tri thức khoa học phục vụ công tác đào tạo, nghiên cứu và thực tiễn nghệ thuật quân sự.</li>
  <li>Góp phần phát triển lý luận và thực tiễn nghệ thuật quân sự trong điều kiện hiện đại hóa Quân đội.</li>
</ul>

<h2>Phạm vi chủ đề</h2>
<p>Tạp chí tiếp nhận các bài nghiên cứu thuộc 9 chuyên mục chính:</p>

<h3>1. Chiến lược quân sự</h3>
<ul>
  <li>Nghiên cứu tầm chiến lược, quốc phòng - an ninh quốc gia</li>
  <li>Tư duy, đường lối quân sự và bảo vệ Tổ quốc trong tình hình mới</li>
</ul>

<h3>2. Nghệ thuật tác chiến</h3>
<ul>
  <li>Lý luận và thực tiễn nghệ thuật tác chiến của Quân đội nhân dân Việt Nam</li>
  <li>Vận dụng nghệ thuật tác chiến trong điều kiện chiến tranh hiện đại</li>
</ul>

<h3>3. Chiến dịch học</h3>
<ul>
  <li>Lý luận và thực tiễn về chiến dịch, các loại hình chiến dịch</li>
  <li>Tổ chức, chuẩn bị và thực hành chiến dịch</li>
</ul>

<h3>4. Chiến thuật học</h3>
<ul>
  <li>Chiến thuật cấp phân đội, binh chủng và quân chủng</li>
  <li>Vận dụng chiến thuật trong môi trường tác chiến mới</li>
</ul>

<h3>5. Lịch sử quân sự</h3>
<ul>
  <li>Lịch sử chiến tranh, nghệ thuật quân sự và truyền thống đấu tranh vũ trang</li>
  <li>Tổng kết kinh nghiệm các cuộc kháng chiến, chiến dịch tiêu biểu</li>
</ul>

<h3>6. Khoa học quân sự</h3>
<ul>
  <li>Nghiên cứu lý luận quân sự tổng hợp</li>
  <li>Khoa học, kỹ thuật và công nghệ phục vụ quốc phòng</li>
</ul>

<h3>7. Giáo dục quân sự</h3>
<ul>
  <li>Đào tạo, bồi dưỡng cán bộ và học thuật quốc phòng</li>
  <li>Đổi mới chương trình, phương pháp giảng dạy tại các học viện, nhà trường quân đội</li>
</ul>

<h3>8. Hợp tác quốc phòng</h3>
<ul>
  <li>Quan hệ quốc phòng, an ninh khu vực và quốc tế</li>
  <li>Kinh nghiệm quốc tế về xây dựng và phát triển nghệ thuật quân sự</li>
</ul>

<h3>9. Tin tức Học viện</h3>
<ul>
  <li>Hoạt động nghiên cứu, đào tạo của Học viện Quốc phòng</li>
  <li>Thông tin khoa học, sự kiện học thuật tiêu biểu</li>
</ul>

<h2>Loại bài viết được tiếp nhận</h2>
<table>
  <thead><tr><th>Loại bài</th><th>Mô tả</th></tr></thead>
  <tbody>
    <tr><td><strong>Bài nghiên cứu gốc</strong></td><td>Công trình nghiên cứu chưa công bố, có đóng góp mới về lý luận hoặc thực tiễn</td></tr>
    <tr><td><strong>Bài tổng quan</strong></td><td>Tổng hợp, phân tích có hệ thống về một chủ đề nghiên cứu</td></tr>
    <tr><td><strong>Trao đổi học thuật</strong></td><td>Ý kiến, bình luận, phản hồi về các vấn đề khoa học đang được tranh luận</td></tr>
    <tr><td><strong>Báo cáo thực tiễn</strong></td><td>Bài viết từ thực tiễn huấn luyện, tác chiến và công tác quân sự có giá trị tham khảo</td></tr>
  </tbody>
</table>

<h2>Tiêu chí đánh giá bài</h2>
<p>Bài viết được đánh giá dựa trên các tiêu chí:</p>
<ul>
  <li><strong>Tính mới:</strong> Đóng góp tri thức mới, cách tiếp cận mới hoặc ứng dụng mới</li>
  <li><strong>Tính khoa học:</strong> Phương pháp nghiên cứu chặt chẽ, lập luận logic, số liệu trung thực</li>
  <li><strong>Tính phù hợp:</strong> Nội dung đúng phạm vi chủ đề của tạp chí</li>
  <li><strong>Chất lượng trình bày:</strong> Văn phong khoa học, cấu trúc rõ ràng, đúng quy cách</li>
  <li><strong>Giá trị thực tiễn:</strong> Ứng dụng được vào thực tiễn nghệ thuật quân sự</li>
</ul>
    `.trim(),
    contentEn: `
<h2>Aims</h2>
<p>The Journal of Vietnamese Military Art Research is published to:</p>
<ul>
  <li>Disseminate high-quality research in military arts and related disciplines.</li>
  <li>Foster academic exchange among scientists, faculty, and research officers within and beyond the military.</li>
  <li>Advance theoretical and applied knowledge serving training, research, and practical military arts and operations.</li>
  <li>Contribute to the development of military arts theory and practice under modern military modernization conditions.</li>
</ul>

<h2>Scope</h2>
<p>The journal welcomes original research in the following areas:</p>
<ul>
  <li>Military art theory and practice at strategic, operational, and tactical levels</li>
  <li>Defense economic and financial management</li>
  <li>Military art, tactics, campaigns and operational theory</li>
  <li>Management science and leadership in the military</li>
  <li>Military history and traditions</li>
  <li>Interdisciplinary studies with direct relevance to military arts</li>
  <li>Defense cooperation and international security studies</li>
</ul>

<h2>Article Types</h2>
<table>
  <thead><tr><th>Type</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>Original Research</strong></td><td>Unpublished work with new theoretical or practical contributions</td></tr>
    <tr><td><strong>Review Articles</strong></td><td>Systematic synthesis and analysis of a research topic</td></tr>
    <tr><td><strong>Academic Discussions</strong></td><td>Opinions and commentary on debated scientific issues</td></tr>
    <tr><td><strong>Practical Reports</strong></td><td>Practice-based articles with reference value for military arts</td></tr>
  </tbody>
</table>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'editorial-board',
    title: 'Hội đồng biên tập',
    titleEn: 'Editorial Board',
    template: 'default',
    order: 4,
    metaTitle: 'Hội đồng biên tập | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Danh sách thành viên Hội đồng biên tập Tạp chí Nghệ thuật Quân sự Việt Nam.',
    content: `
<h2>Hội đồng biên tập</h2>
<p>Hội đồng biên tập Tạp chí Nghệ thuật Quân sự Việt Nam gồm các chuyên gia, nhà khoa học có uy tín trong lĩnh vực nghệ thuật quân sự, khoa học quân sự và các lĩnh vực liên quan.</p>

<h2>Ban biên tập</h2>
<table>
  <thead>
    <tr><th>Chức vụ</th><th>Họ và tên</th><th>Đơn vị</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Tổng biên tập</strong></td><td>Học viện Quốc phòng</td><td>Học viện Quốc phòng</td></tr>
    <tr><td><strong>Phó Tổng biên tập</strong></td><td>Học viện Quốc phòng</td><td>Học viện Quốc phòng</td></tr>
  </tbody>
</table>

<h2>Hội đồng cố vấn khoa học</h2>
<p>Hội đồng cố vấn khoa học gồm các nhà khoa học, chuyên gia trong nước có kinh nghiệm nghiên cứu chuyên sâu về nghệ thuật quân sự và các lĩnh vực liên quan.</p>

<h2>Phản biện độc lập</h2>
<p>Tạp chí áp dụng quy trình phản biện kín (Double-blind peer review). Danh sách phản biện độc lập được cập nhật hàng năm và không được công bố công khai nhằm đảm bảo tính khách quan và độc lập trong đánh giá bài báo.</p>

<h2>Liên hệ Ban biên tập</h2>
<p>Mọi thắc mắc liên quan đến Ban biên tập hoặc quy trình phản biện, vui lòng liên hệ:<br/>
<strong>Email:</strong> <a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a><br/>
<strong>Địa chỉ:</strong> 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội</p>
    `.trim(),
    contentEn: `
<h2>Editorial Board</h2>
<p>The Editorial Board of the Journal of Vietnamese Military Art Research consists of distinguished experts and scientists in the fields of military arts, strategy, campaigns and military history and technology.</p>

<h2>Editorial Team</h2>
<table>
  <thead>
    <tr><th>Position</th><th>Name</th><th>Institution</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Editor-in-Chief</strong></td><td>National Defense Academy</td><td>National Defense Academy</td></tr>
    <tr><td><strong>Deputy Editor-in-Chief</strong></td><td>National Defense Academy</td><td>National Defense Academy</td></tr>
  </tbody>
</table>

<h2>Peer Review Process</h2>
<p>All submitted manuscripts undergo a rigorous double-blind peer review process. The list of independent reviewers is updated annually and is not publicly disclosed to ensure objectivity and independence in the evaluation process.</p>

<h2>Contact the Editorial Board</h2>
<p>For any inquiries regarding the editorial board or peer review process, please contact:<br/>
<strong>Email:</strong> <a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a></p>
    `.trim(),
    isPublished: true,
  },
  {
    slug: 'contact',
    title: 'Liên hệ',
    titleEn: 'Contact Us',
    template: 'contact',
    order: 3,
    metaTitle: 'Liên hệ | Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Liên hệ với Ban biên tập Tạp chí Nghệ thuật Quân sự Việt Nam.',
    content: `
<h2>Thông tin liên hệ</h2>
<table>
  <tbody>
    <tr><td><strong>Email tòa soạn</strong></td><td><a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a></td></tr>
    <tr><td><strong>Địa chỉ</strong></td><td>93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội</td></tr>
    <tr><td><strong>Giờ làm việc</strong></td><td>Thứ 2 – Thứ 6: 8:00 – 17:00</td></tr>
  </tbody>
</table>

<h2>Câu hỏi thường gặp</h2>

<h3>Thời gian xử lý bài nộp là bao lâu?</h3>
<p>Thông thường 4–6 tuần từ lúc nhận bài đến khi có kết quả phản biện ban đầu.</p>

<h3>Tôi có thể gửi bài tiếng Anh không?</h3>
<p>Tạp chí chủ yếu nhận bài tiếng Việt. Tóm tắt và từ khóa yêu cầu có bản tiếng Anh.</p>

<h3>Phí nộp bài là bao nhiêu?</h3>
<p>Tạp chí <strong>không thu phí xử lý bài (APC)</strong>. Hoàn toàn miễn phí cho tác giả.</p>

<h3>Sau khi gửi bài, tôi theo dõi ở đâu?</h3>
<p>Đăng nhập vào tài khoản tác giả trên hệ thống để xem trạng thái bài gửi theo thời gian thực.</p>

<h3>Bài bị từ chối có thể nộp lại không?</h3>
<p>Có thể nộp lại sau khi chỉnh sửa nếu được biên tập viên đề nghị xem xét lại. Bài từ chối hoàn toàn thì không được nộp lại cùng nội dung.</p>

<h3>Tôi cần cung cấp những gì khi nộp bài lần đầu?</h3>
<p>File bài viết (.docx), thông tin tác giả đầy đủ, tuyên bố về tính nguyên gốc, và xác nhận bài chưa được nộp cho ấn phẩm khác.</p>

<h2>Gửi liên hệ trực tiếp</h2>
<p>Nếu bạn có câu hỏi không nằm trong danh sách trên, hãy gửi email tới tòa soạn hoặc điền vào mẫu liên hệ có sẵn trên trang này. Chúng tôi sẽ phản hồi trong vòng 2 ngày làm việc.</p>
    `.trim(),
    contentEn: `
<h2>Contact Information</h2>
<table>
  <tbody>
    <tr><td><strong>Editorial Email</strong></td><td><a href="mailto:tapchintqsvn@gmail.com">tapchintqsvn@gmail.com</a></td></tr>
    <tr><td><strong>Address</strong></td><td>National Defense Academy, 93 Hoang Quoc Viet, Nghia Do, Hanoi</td></tr>
    <tr><td><strong>Office Hours</strong></td><td>Monday – Friday: 8:00 – 17:00</td></tr>
  </tbody>
</table>

<h2>Frequently Asked Questions</h2>

<h3>How long does peer review take?</h3>
<p>Typically 4–6 weeks from submission to initial editorial decision.</p>

<h3>Are there any submission fees?</h3>
<p>No. The journal charges <strong>no article processing fees (APC)</strong>.</p>

<h3>Can I track my submission status?</h3>
<p>Yes. Log in to your author account on the journal system to view real-time status updates.</p>
    `.trim(),
    isPublished: true,
  },
]

async function seed() {
  console.log('🌱 Seeding PublicPage records...')

  for (const page of pages) {
    const existing = await prisma.publicPage.findUnique({ where: { slug: page.slug } })

    if (existing) {
      console.log(`  ⚠️  Skipping "${page.slug}" — already exists (id: ${existing.id})`)
      continue
    }

    const created = await prisma.publicPage.create({
      data: {
        ...page,
        publishedAt: page.isPublished ? new Date() : null,
      },
    })
    console.log(`  ✅  Created "${page.slug}" → id: ${created.id}`)
  }

  console.log('✅ Done.')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
