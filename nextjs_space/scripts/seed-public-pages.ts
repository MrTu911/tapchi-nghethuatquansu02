import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PUBLIC_PAGES = [
  {
    slug: 'about',
    title: 'Giới thiệu về Tạp chí',
    titleEn: 'About the Journal',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Giới thiệu về Tạp chí Nghệ thuật Quân sự Việt Nam</h2>
        
        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg mb-8 border-l-4 border-emerald-600">
          <p class="text-xl font-semibold text-emerald-800 mb-2">"Nghiên cứu khoa học vững chắc - Phục vụ sự nghiệp quốc phòng"</p>
          <p class="text-gray-700">Tạp chí điện tử chuyên ngành nghệ thuật quân sự hàng đầu Việt Nam</p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Lịch sử hình thành</h3>
        <p class="text-gray-700 leading-relaxed mb-4">
          Tạp chí <strong>Nghệ thuật Quân sự Việt Nam</strong> là cơ quan ngôn luận của <strong>Học viện Quốc phòng - Bộ Quốc phòng</strong>, 
          được thành lập nhằm tạo diễn đàn học thuật uy tín cho các nhà khoa học, cán bộ, giảng viên, học viên và những người quan tâm 
          đến lĩnh vực nghệ thuật quân sự.
        </p>
        <p class="text-gray-700 leading-relaxed mb-4">
          Từ khi ra đời, Tạp chí đã không ngừng phát triển cả về chất lượng và số lượng bài viết, trở thành nguồn tài liệu tham khảo 
          quý giá phục vụ công tác nghiên cứu, giảng dạy và học tập trong toàn quân.
        </p>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Sứ mệnh và Tầm nhìn</h3>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-xl font-bold text-emerald-700 mb-3">🎯 Sứ mệnh</h4>
            <ul class="space-y-2 text-gray-700">
              <li>✓ Công bố các công trình nghiên cứu khoa học chất lượng cao</li>
              <li>✓ Phổ biến kiến thức chuyên môn về nghệ thuật quân sự</li>
              <li>✓ Tạo diễn đàn trao đổi học thuật cho cộng đồng chuyên gia</li>
              <li>✓ Góp phần nâng cao trình độ chuyên môn nghiệp vụ</li>
            </ul>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-xl font-bold text-blue-700 mb-3">🔭 Tầm nhìn</h4>
            <ul class="space-y-2 text-gray-700">
              <li>✓ Trở thành tạp chí khoa học uy tín hàng đầu Việt Nam</li>
              <li>✓ Đạt chuẩn quốc tế về chất lượng xuất bản</li>
              <li>✓ Mở rộng hợp tác với các tổ chức nghiên cứu trong nước và quốc tế</li>
              <li>✓ Ứng dụng công nghệ hiện đại vào quy trình xuất bản</li>
            </ul>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Lĩnh vực xuất bản</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <ul class="grid md:grid-cols-2 gap-3 text-gray-700">
            <li>• Lý luận nghệ thuật quân sự</li>
            <li>• Khoa học quân sự</li>
            <li>• Quản lý vật tư, trang bị</li>
            <li>• Công nghệ thông tin quân sự</li>
            <li>• Chiến lược quân sự, quốc phòng</li>
            <li>• Kinh nghiệm thực tiễn</li>
            <li>• Lịch sử quân sự</li>
            <li>• Hợp tác quốc tế</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Thông tin xuất bản</h3>
        <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
          <ul class="space-y-2 text-gray-700">
            <li><strong>Chủ quản:</strong> Học viện Quốc phòng - Bộ Quốc phòng</li>
            <li><strong>Tổng Biên tập:</strong> [Tên Tổng Biên tập]</li>
            <li><strong>Tần suất xuất bản:</strong> Quý (4 số/năm)</li>
            <li><strong>Ngôn ngữ:</strong> Tiếng Việt (có tóm tắt tiếng Anh)</li>
            <li><strong>ISSN:</strong> [Mã ISSN]</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Liên hệ</h3>
        <p class="text-gray-700 leading-relaxed">
          Mọi thắc mắc, đóng góp ý kiến hoặc yêu cầu hợp tác, vui lòng liên hệ với Tòa soạn qua email: 
          <a href="mailto:tapchintqsvn@gmail.com" class="text-emerald-600 hover:text-emerald-700 font-semibold">tapchintqsvn@gmail.com</a>
        </p>
      </div>
    `,
    metaTitle: 'Giới thiệu - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Tạp chí điện tử chuyên ngành nghệ thuật quân sự hàng đầu Việt Nam, cơ quan ngôn luận của Học viện Quốc phòng - Bộ Quốc phòng',
    template: 'about',
    isPublished: true,
    publishedAt: new Date(),
    order: 1
  },
  {
    slug: 'contact',
    title: 'Liên hệ',
    titleEn: 'Contact Us',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Thông tin liên hệ</h2>
        
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 class="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Tòa soạn Tạp chí
            </h3>
            <div class="space-y-3 text-gray-700">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <p class="font-semibold">Địa chỉ:</p>
                  <p>Số 45, Phường Ngọc Thụy, Long Biên, Hà Nội</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <div>
                  <p class="font-semibold">Điện thoại:</p>
                  <p>(024) 1234 5678</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <div>
                  <p class="font-semibold">Email:</p>
                  <a href="mailto:tapchintqsvn@gmail.com" class="text-emerald-600 hover:text-emerald-700">tapchintqsvn@gmail.com</a>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <div>
                  <p class="font-semibold">Website:</p>
                  <a href="https://localhost:3001" class="text-emerald-600 hover:text-emerald-700">localhost:3001</a>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 class="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Thời gian làm việc
            </h3>
            <div class="space-y-3 text-gray-700">
              <div>
                <p class="font-semibold">Thứ Hai - Thứ Sáu:</p>
                <p>Sáng: 7:30 - 11:30</p>
                <p>Chiều: 13:30 - 17:00</p>
              </div>
              <div>
                <p class="font-semibold">Thứ Bảy, Chủ Nhật:</p>
                <p class="text-red-600">Nghỉ</p>
              </div>
            </div>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Liên hệ theo phòng ban</h3>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
            <h4 class="font-bold text-blue-800 mb-2">Phòng Biên tập</h4>
            <p class="text-sm text-gray-700 mb-2">Tiếp nhận và xử lý bài viết</p>
            <p class="text-sm"><strong>Email:</strong> bientap@hvc.edu.vn</p>
            <p class="text-sm"><strong>ĐT:</strong> (024) 1234 5671</p>
          </div>
          
          <div class="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
            <h4 class="font-bold text-green-800 mb-2">Phòng Phát hành</h4>
            <p class="text-sm text-gray-700 mb-2">Đăng ký xuất bản và phát hành</p>
            <p class="text-sm"><strong>Email:</strong> phathanh@hvc.edu.vn</p>
            <p class="text-sm"><strong>ĐT:</strong> (024) 1234 5672</p>
          </div>
          
          <div class="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-600">
            <h4 class="font-bold text-purple-800 mb-2">Phòng Kỹ thuật</h4>
            <p class="text-sm text-gray-700 mb-2">Hỗ trợ kỹ thuật website</p>
            <p class="text-sm"><strong>Email:</strong> kythuat@hvc.edu.vn</p>
            <p class="text-sm"><strong>ĐT:</strong> (024) 1234 5673</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg mt-8 border-l-4 border-emerald-600">
          <h3 class="text-xl font-bold text-emerald-800 mb-3">📧 Gửi tin nhắn trực tuyến</h3>
          <p class="text-gray-700 mb-4">Nếu bạn có bất kỳ thắc mắc nào, vui lòng điền form liên hệ hoặc gửi email trực tiếp đến địa chỉ của chúng tôi. Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc.</p>
          <a href="mailto:tapchintqsvn@gmail.com" class="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
            Gửi email ngay
          </a>
        </div>
      </div>
    `,
    metaTitle: 'Liên hệ - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Thông tin liên hệ Tòa soạn Tạp chí Nghệ thuật Quân sự Việt Nam - Học viện Quốc phòng',
    template: 'contact',
    isPublished: true,
    publishedAt: new Date(),
    order: 2
  },
  {
    slug: 'publishing-process',
    title: 'Quy trình xuất bản',
    titleEn: 'Publishing Process',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Quy trình xuất bản bài viết khoa học</h2>
        
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg mb-8 border-l-4 border-blue-600">
          <p class="text-lg text-gray-700">
            Tạp chí áp dụng <strong>quy trình phản biện ngang hàng (peer review)</strong> kép ẩn danh (double-blind) 
            để đảm bảo tính khách quan và chất lượng khoa học của các bài viết được xuất bản.
          </p>
        </div>

        <div class="space-y-8">
          <div class="relative pl-8 border-l-4 border-emerald-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Nộp bài</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Tác giả đăng ký tài khoản và nộp bài qua hệ thống trực tuyến</li>
                <li>✓ Bài viết phải tuân thủ <a href="/pages/author-guidelines" class="text-emerald-600 hover:text-emerald-700">Hướng dẫn tác giả</a></li>
                <li>✓ Hệ thống tự động gửi email xác nhận tiếp nhận</li>
                <li>✓ <strong>Thời gian:</strong> 1 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-blue-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Kiểm tra sơ bộ</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Biên tập viên kiểm tra định dạng, tính hoàn chỉnh và phù hợp với chuyên mục</li>
                <li>✓ Kiểm tra đạo đức nghiên cứu và xung đột lợi ích</li>
                <li>✓ Nếu không đạt yêu cầu, bài viết được trả lại để chỉnh sửa</li>
                <li>✓ <strong>Thời gian:</strong> 3-5 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-purple-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Phân công phản biện</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Biên tập viên phân công 2-3 phản biện viên độc lập</li>
                <li>✓ Áp dụng phản biện <strong>kép ẩn danh (double-blind)</strong></li>
                <li>✓ Phản biện viên không biết tác giả và ngược lại</li>
                <li>✓ <strong>Thời gian:</strong> 2-3 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-orange-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Phản biện chuyên môn</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Phản biện viên đánh giá: tính mới, tính khoa học, phương pháp, kết quả</li>
                <li>✓ Đề xuất: Chấp nhận / Chỉnh sửa nhỏ / Chỉnh sửa lớn / Từ chối</li>
                <li>✓ Cung cấp nhận xét chi tiết và gợi ý cải thiện</li>
                <li>✓ <strong>Thời gian:</strong> 14-21 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-red-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Quyết định biên tập</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Biên tập viên tổng hợp ý kiến phản biện</li>
                <li>✓ Ra quyết định cuối cùng: Chấp nhận / Yêu cầu chỉnh sửa / Từ chối</li>
                <li>✓ Gửi kết quả và nhận xét chi tiết cho tác giả</li>
                <li>✓ <strong>Thời gian:</strong> 3-5 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-yellow-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">6</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Chỉnh sửa bản thảo</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Tác giả chỉnh sửa theo góp ý của phản biện</li>
                <li>✓ Nộp lại bản thảo đã chỉnh sửa kèm giải trình</li>
                <li>✓ Biên tập viên kiểm tra và phê duyệt</li>
                <li>✓ <strong>Thời gian:</strong> 7-14 ngày</li>
              </ul>
            </div>
          </div>

          <div class="relative pl-8 border-l-4 border-green-500">
            <div class="absolute -left-4 top-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">7</div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Biên tập kỹ thuật & Xuất bản</h3>
            <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <ul class="space-y-2 text-gray-700">
                <li>✓ Biên tập định dạng, layout, kiểm tra lỗi chính tả</li>
                <li>✓ Tác giả xác nhận bản proof cuối cùng</li>
                <li>✓ Cấp DOI và xuất bản trực tuyến</li>
                <li>✓ <strong>Thời gian:</strong> 5-7 ngày</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg mt-8 border-l-4 border-emerald-600">
          <h3 class="text-xl font-bold text-emerald-800 mb-3">📊 Tổng thời gian quy trình</h3>
          <ul class="space-y-2 text-gray-700">
            <li>✓ <strong>Từ nộp đến có kết quả phản biện:</strong> 25-35 ngày</li>
            <li>✓ <strong>Từ chấp nhận đến xuất bản:</strong> 12-21 ngày</li>
            <li>✓ <strong>Tổng thời gian trung bình:</strong> 40-60 ngày</li>
          </ul>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg mt-6 border-l-4 border-yellow-500">
          <h3 class="text-xl font-bold text-yellow-800 mb-3">⚠️ Lưu ý quan trọng</h3>
          <ul class="space-y-2 text-gray-700">
            <li>• Thời gian có thể thay đổi tùy thuộc vào độ phức tạp của bài viết</li>
            <li>• Tác giả có trách nhiệm phản hồi kịp thời các yêu cầu chỉnh sửa</li>
            <li>• Bài viết được chỉnh sửa nhiều lần có thể kéo dài thời gian xuất bản</li>
            <li>• Tạp chí có quyền từ chối bài viết không đạt yêu cầu mà không cần giải thích</li>
          </ul>
        </div>
      </div>
    `,
    metaTitle: 'Quy trình xuất bản - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Quy trình xuất bản bài viết khoa học với phản biện ngang hàng kép ẩn danh (double-blind peer review)',
    template: 'default',
    isPublished: true,
    publishedAt: new Date(),
    order: 3
  },
  {
    slug: 'author-guidelines',
    title: 'Hướng dẫn tác giả',
    titleEn: 'Author Guidelines',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Hướng dẫn dành cho tác giả</h2>
        
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg mb-8 border-l-4 border-blue-600">
          <p class="text-lg text-gray-700">
            Tạp chí khuyến khích các tác giả đọc kỹ hướng dẫn này trước khi chuẩn bị và nộp bài viết. 
            Việc tuân thủ đúng quy định sẽ giúp rút ngắn thời gian xử lý và tăng cơ hội được chấp nhận xuất bản.
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Yêu cầu chung</h3>
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Tính nguyên gốc:</strong> Bài viết phải là công trình nghiên cứu chưa được công bố ở bất kỳ đâu
              </div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Ngôn ngữ:</strong> Tiếng Việt (bắt buộc có tóm tắt tiếng Anh)
              </div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Độ dài:</strong> 6,000 - 10,000 từ (khoảng 10-15 trang A4)
              </div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Định dạng:</strong> MS Word (.docx) hoặc PDF
              </div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Font chữ:</strong> Times New Roman, cỡ 12
              </div>
            </li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Cấu trúc bài viết</h3>
        <div class="space-y-4">
          <div class="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
            <h4 class="font-bold text-blue-800 mb-2">📌 Trang đầu tiên</h4>
            <ul class="space-y-1 text-gray-700 text-sm">
              <li>• Tiêu đề (Tiếng Việt và Tiếng Anh)</li>
              <li>• Tên tác giả, cơ quan công tác, email liên hệ</li>
              <li>• Tóm tắt (200-300 từ, cả Tiếng Việt và Tiếng Anh)</li>
              <li>• Từ khóa (5-7 từ khóa, cả Tiếng Việt và Tiếng Anh)</li>
            </ul>
          </div>

          <div class="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
            <h4 class="font-bold text-green-800 mb-2">📝 Nội dung chính</h4>
            <ul class="space-y-1 text-gray-700 text-sm">
              <li>• <strong>1. Mở đầu:</strong> Giới thiệu vấn đề nghiên cứu, tầm quan trọng, mục tiêu</li>
              <li>• <strong>2. Tổng quan nghiên cứu:</strong> Lược khảo các nghiên cứu liên quan</li>
              <li>• <strong>3. Phương pháp nghiên cứu:</strong> Mô tả chi tiết phương pháp, dữ liệu</li>
              <li>• <strong>4. Kết quả:</strong> Trình bày kết quả nghiên cứu</li>
              <li>• <strong>5. Thảo luận:</strong> Phân tích, so sánh với các nghiên cứu khác</li>
              <li>• <strong>6. Kết luận:</strong> Tóm tắt, đóng góp, hạn chế, hướng nghiên cứu tiếp theo</li>
            </ul>
          </div>

          <div class="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-600">
            <h4 class="font-bold text-purple-800 mb-2">📚 Tài liệu tham khảo</h4>
            <ul class="space-y-1 text-gray-700 text-sm">
              <li>• Sử dụng định dạng <strong>APA 7th edition</strong></li>
              <li>• Trích dẫn đầy đủ, chính xác trong văn bản</li>
              <li>• Ưu tiên tài liệu mới (5-10 năm gần đây)</li>
              <li>• Tối thiểu 15-20 tài liệu tham khảo</li>
            </ul>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Trích dẫn và Tài liệu tham khảo</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 class="font-bold text-gray-800 mb-3">Ví dụ định dạng APA:</h4>
          <div class="space-y-3 text-sm">
            <div class="bg-white p-3 rounded border border-gray-200">
              <p class="text-gray-600 font-semibold mb-1">Sách:</p>
              <p class="text-gray-700 font-mono">Nguyễn, V. A., & Trần, T. B. (2023). <em>Nghệ thuật chiến dịch hiện đại</em>. NXB Quân đội Nhân dân.</p>
            </div>
            <div class="bg-white p-3 rounded border border-gray-200">
              <p class="text-gray-600 font-semibold mb-1">Bài báo tạp chí:</p>
              <p class="text-gray-700 font-mono">Lê, M. C., Phạm, D. E., & Hoàng, F. G. (2024). Ứng dụng AI trong dự báo nhu cầu. <em>Tạp chí KHHL Quân sự</em>, <em>15</em>(2), 45-60.</p>
            </div>
            <div class="bg-white p-3 rounded border border-gray-200">
              <p class="text-gray-600 font-semibold mb-1">Website:</p>
              <p class="text-gray-700 font-mono">Bộ Quốc phòng. (2023, 15 tháng 8). <em>Chiến lược phát triển nghệ thuật quân sự 2030</em>. https://mod.gov.vn/strategy2030</p>
            </div>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Hình ảnh và Bảng biểu</h3>
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li>✓ Hình ảnh có độ phân giải cao (tối thiểu 300 dpi)</li>
            <li>✓ Bảng biểu rõ ràng, dễ đọc, có tiêu đề và số thứ tự</li>
            <li>✓ Ghi rõ nguồn gốc nếu sử dụng hình ảnh/bảng biểu từ nguồn khác</li>
            <li>✓ Chú thích đầy đủ, dễ hiểu</li>
            <li>✓ Định dạng: JPG, PNG cho hình ảnh; Word/Excel cho bảng</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Quy định đạo đức nghiên cứu</h3>
        <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-600 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li><strong class="text-red-700">🚫 Cấm sao chép (Plagiarism):</strong> Mọi hình thức sao chép mà không trích dẫn đều bị từ chối</li>
            <li><strong class="text-red-700">🚫 Cấm tự đạo văn (Self-plagiarism):</strong> Không được xuất bản lại công trình đã công bố</li>
            <li><strong class="text-red-700">🚫 Xung đột lợi ích:</strong> Tác giả phải khai báo đầy đủ nguồn tài trợ và xung đột lợi ích</li>
            <li><strong class="text-red-700">🚫 Đồng tác giả ảo:</strong> Chỉ liệt kê những người có đóng góp thực sự</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Cách nộp bài</h3>
        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border-l-4 border-emerald-600">
          <ol class="space-y-3 text-gray-700">
            <li><strong>Bước 1:</strong> <a href="/auth/register" class="text-emerald-600 hover:text-emerald-700 underline">Đăng ký tài khoản</a> trên hệ thống</li>
            <li><strong>Bước 2:</strong> Đăng nhập và chọn "Nộp bài mới" trong Dashboard</li>
            <li><strong>Bước 3:</strong> Điền đầy đủ thông tin và tải lên file bài viết</li>
            <li><strong>Bước 4:</strong> Kiểm tra kỹ và xác nhận nộp bài</li>
            <li><strong>Bước 5:</strong> Theo dõi tiến trình qua Dashboard và email</li>
          </ol>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg mt-6 border-l-4 border-yellow-500">
          <h3 class="text-xl font-bold text-yellow-800 mb-3">💡 Mẹo tăng cơ hội được chấp nhận</h3>
          <ul class="space-y-2 text-gray-700">
            <li>• Đọc kỹ các số gần đây của Tạp chí để hiểu phong cách</li>
            <li>• Đảm bảo bài viết có giá trị mới, đóng góp rõ ràng</li>
            <li>• Viết rõ ràng, mạch lạc, dễ hiểu</li>
            <li>• Kiểm tra kỹ lỗi chính tả, ngữ pháp trước khi nộp</li>
            <li>• Phản hồi kịp thời các yêu cầu chỉnh sửa từ phản biện</li>
          </ul>
        </div>
      </div>
    `,
    metaTitle: 'Hướng dẫn tác giả - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Hướng dẫn chi tiết cho tác giả về cách chuẩn bị, định dạng và nộp bài viết khoa học',
    template: 'default',
    isPublished: true,
    publishedAt: new Date(),
    order: 4
  },
  {
    slug: 'review-policy',
    title: 'Chính sách phản biện',
    titleEn: 'Review Policy',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Chính sách phản biện ngang hàng</h2>
        
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg mb-8 border-l-4 border-purple-600">
          <p class="text-lg text-gray-700">
            Tạp chí áp dụng <strong>phương thức phản biện ngang hàng kép ẩn danh (double-blind peer review)</strong> 
            nhằm đảm bảo tính khách quan, công bằng và chất lượng khoa học của các bài viết được xuất bản.
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Phương thức phản biện</h3>
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
            <h4 class="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              Không ẩn danh (Open)
            </h4>
            <p class="text-sm text-gray-600">Tác giả và phản biện đều biết nhau</p>
            <p class="text-xs text-gray-500 mt-2"><em>Không áp dụng</em></p>
          </div>

          <div class="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-600">
            <h4 class="font-bold text-yellow-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              Đơn ẩn danh (Single-blind)
            </h4>
            <p class="text-sm text-gray-600">Phản biện biết tác giả, tác giả không biết phản biện</p>
            <p class="text-xs text-gray-500 mt-2"><em>Không áp dụng</em></p>
          </div>

          <div class="bg-green-50 p-6 rounded-lg border-l-4 border-green-600">
            <h4 class="font-bold text-green-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Kép ẩn danh (Double-blind)
            </h4>
            <p class="text-sm text-gray-600">Cả tác giả và phản biện đều không biết nhau</p>
            <p class="text-xs text-green-700 mt-2 font-semibold">✓ Đang áp dụng</p>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Quy trình phản biện</h3>
        <div class="space-y-4">
          <div class="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <h4 class="font-bold text-emerald-700 mb-2 flex items-center gap-2">
              <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">Bước 1</span>
              Lựa chọn phản biện viên
            </h4>
            <ul class="text-sm text-gray-700 space-y-1 ml-6">
              <li>• Biên tập viên chọn 2-3 phản biện viên có chuyên môn phù hợp</li>
              <li>• Phản biện viên là chuyên gia trong lĩnh vực, có kinh nghiệm</li>
              <li>• Kiểm tra xung đột lợi ích trước khi mời</li>
              <li>• Phản biện viên có quyền từ chối nếu không đủ thời gian/chuyên môn</li>
            </ul>
          </div>

          <div class="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <h4 class="font-bold text-emerald-700 mb-2 flex items-center gap-2">
              <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">Bước 2</span>
              Thực hiện phản biện
            </h4>
            <ul class="text-sm text-gray-700 space-y-1 ml-6">
              <li>• Phản biện viên nhận bản thảo <strong>đã ẩn thông tin tác giả</strong></li>
              <li>• Đánh giá theo <strong>tiêu chí chuẩn</strong>: tính mới, tính khoa học, phương pháp, kết quả</li>
              <li>• Thời gian: <strong>14-21 ngày</strong></li>
              <li>• Cung cấp nhận xét chi tiết, xây dựng</li>
            </ul>
          </div>

          <div class="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <h4 class="font-bold text-emerald-700 mb-2 flex items-center gap-2">
              <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">Bước 3</span>
              Tổng hợp và quyết định
            </h4>
            <ul class="text-sm text-gray-700 space-y-1 ml-6">
              <li>• Biên tập viên tổng hợp ý kiến từ tất cả phản biện</li>
              <li>• Ra quyết định dựa trên đánh giá khách quan</li>
              <li>• Gửi kết quả kèm nhận xét <strong>đã ẩn danh phản biện</strong> cho tác giả</li>
              <li>• Tác giả không biết ai là người phản biện</li>
            </ul>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Tiêu chí đánh giá</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-bold text-gray-800 mb-3">📊 Nội dung khoa học (60%)</h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li>✓ Tính mới, độc đáo của nghiên cứu</li>
                <li>✓ Tính chính xác, logic của lập luận</li>
                <li>✓ Phương pháp nghiên cứu phù hợp</li>
                <li>✓ Kết quả nghiên cứu có ý nghĩa</li>
                <li>✓ Tính ứng dụng thực tiễn</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-gray-800 mb-3">📝 Hình thức trình bày (40%)</h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li>✓ Cấu trúc bài viết rõ ràng</li>
                <li>✓ Ngôn ngữ chính xác, dễ hiểu</li>
                <li>✓ Trích dẫn đầy đủ, chính xác</li>
                <li>✓ Hình ảnh, bảng biểu chất lượng</li>
                <li>✓ Tuân thủ quy định của Tạp chí</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Quyết định biên tập</h3>
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div class="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
            <h4 class="font-bold text-green-800 mb-2">✅ Chấp nhận (Accept)</h4>
            <p class="text-sm text-gray-700">Bài viết đạt yêu cầu, có thể xuất bản sau chỉnh sửa nhỏ về kỹ thuật</p>
          </div>

          <div class="bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-600">
            <h4 class="font-bold text-yellow-800 mb-2">🔧 Chỉnh sửa nhỏ (Minor Revision)</h4>
            <p class="text-sm text-gray-700">Bài viết tốt nhưng cần chỉnh sửa một số điểm về nội dung, trình bày</p>
          </div>

          <div class="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-600">
            <h4 class="font-bold text-orange-800 mb-2">🔨 Chỉnh sửa lớn (Major Revision)</h4>
            <p class="text-sm text-gray-700">Bài viết có tiềm năng nhưng cần sửa đổi đáng kể về nội dung, phương pháp</p>
          </div>

          <div class="bg-red-50 p-5 rounded-lg border-l-4 border-red-600">
            <h4 class="font-bold text-red-800 mb-2">❌ Từ chối (Reject)</h4>
            <p class="text-sm text-gray-700">Bài viết không đạt yêu cầu về chất lượng hoặc không phù hợp với Tạp chí</p>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Đạo đức phản biện</h3>
        <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 mb-6">
          <h4 class="font-bold text-blue-800 mb-3">Trách nhiệm của phản biện viên:</h4>
          <ul class="space-y-2 text-gray-700">
            <li>✓ Đánh giá khách quan, công bằng dựa trên tiêu chí khoa học</li>
            <li>✓ Bảo mật thông tin bài viết và danh tính tác giả</li>
            <li>✓ Tránh xung đột lợi ích, báo cáo nếu có</li>
            <li>✓ Hoàn thành phản biện đúng thời hạn</li>
            <li>✓ Cung cấp nhận xét xây dựng, chi tiết</li>
            <li>✓ Không sử dụng thông tin từ bài viết cho mục đích cá nhân</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Khiếu nại và Giải quyết</h3>
        <div class="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-600">
          <p class="text-gray-700 mb-3">
            Nếu tác giả không đồng ý với quyết định biên tập, có thể gửi khiếu nại kèm giải trình chi tiết đến:
          </p>
          <p class="text-gray-700">
            📧 Email: <a href="mailto:tongbientap@tapchintqsvn.edu.vn" class="text-emerald-600 hover:text-emerald-700 font-semibold">tongbientap@tapchintqsvn.edu.vn</a>
          </p>
          <p class="text-sm text-gray-600 mt-3">
            <em>Tổng Biên tập sẽ xem xét khiếu nại và ra quyết định cuối cùng trong vòng 10 ngày làm việc.</em>
          </p>
        </div>
      </div>
    `,
    metaTitle: 'Chính sách phản biện - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Chính sách phản biện ngang hàng kép ẩn danh (double-blind peer review) của Tạp chí',
    template: 'default',
    isPublished: true,
    publishedAt: new Date(),
    order: 5
  },
  {
    slug: 'ethics',
    title: 'Đạo đức xuất bản',
    titleEn: 'Publication Ethics',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Đạo đức xuất bản khoa học</h2>
        
        <div class="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg mb-8 border-l-4 border-red-600">
          <p class="text-lg text-gray-700">
            Tạp chí cam kết duy trì <strong>tiêu chuẩn đạo đức xuất bản cao nhất</strong> và tuân thủ các nguyên tắc 
            đạo đức quốc tế theo hướng dẫn của <strong>COPE (Committee on Publication Ethics)</strong>.
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Trách nhiệm của Tác giả</h3>
        <div class="space-y-4 mb-8">
          <div class="bg-white p-5 rounded-lg shadow-md border-l-4 border-emerald-600">
            <h4 class="font-bold text-emerald-700 mb-2">✅ Tính nguyên gốc và sao chép</h4>
            <ul class="text-sm text-gray-700 space-y-1">
              <li>• Bài viết phải là công trình nghiên cứu nguyên gốc, chưa được công bố</li>
              <li>• Không được sao chép (plagiarism) từ bất kỳ nguồn nào</li>
              <li>• Không được tự đạo văn (self-plagiarism) từ các công trình trước</li>
              <li>• Trích dẫn đầy đủ, chính xác các nguồn tham khảo</li>
            </ul>
          </div>

          <div class="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-600">
            <h4 class="font-bold text-blue-700 mb-2">👥 Quyền tác giả</h4>
            <ul class="text-sm text-gray-700 space-y-1">
              <li>• Chỉ liệt kê những người có đóng góp thực chất vào nghiên cứu</li>
              <li>• Không được thêm tác giả ảo (ghost author) hoặc bỏ sót tác giả</li>
              <li>• Tác giả chính chịu trách nhiệm về toàn bộ nội dung</li>
              <li>• Tất cả đồng tác giả phải đồng ý với bản thảo cuối cùng</li>
            </ul>
          </div>

          <div class="bg-white p-5 rounded-lg shadow-md border-l-4 border-purple-600">
            <h4 class="font-bold text-purple-700 mb-2">💰 Xung đột lợi ích</h4>
            <ul class="text-sm text-gray-700 space-y-1">
              <li>• Khai báo đầy đủ nguồn tài trợ cho nghiên cứu</li>
              <li>• Tiết lộ mọi xung đột lợi ích tiềm ẩn</li>
              <li>• Báo cáo mối quan hệ tài chính với tổ chức liên quan</li>
              <li>• Tuyên bố độc lập của nghiên cứu nếu có</li>
            </ul>
          </div>

          <div class="bg-white p-5 rounded-lg shadow-md border-l-4 border-yellow-600">
            <h4 class="font-bold text-yellow-700 mb-2">🔬 Dữ liệu nghiên cứu</h4>
            <ul class="text-sm text-gray-700 space-y-1">
              <li>• Dữ liệu phải chính xác, trung thực, không bịa đặt</li>
              <li>• Lưu trữ dữ liệu nghiên cứu ít nhất 5 năm sau xuất bản</li>
              <li>• Sẵn sàng cung cấp dữ liệu gốc khi được yêu cầu</li>
              <li>• Báo cáo đầy đủ phương pháp thu thập và xử lý dữ liệu</li>
            </ul>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Trách nhiệm của Phản biện viên</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Khách quan:</strong> Đánh giá dựa trên giá trị khoa học, không thiên vị cá nhân</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Bảo mật:</strong> Không tiết lộ nội dung bài viết cho bên thứ ba</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Từ chối:</strong> Từ chối phản biện nếu có xung đột lợi ích hoặc thiếu chuyên môn</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Kịp thời:</strong> Hoàn thành phản biện đúng thời hạn hoặc báo cáo nếu không thể</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Xây dựng:</strong> Cung cấp nhận xét chi tiết, mang tính xây dựng</div>
            </li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Trách nhiệm của Ban Biên tập</h3>
        <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li>✓ Quyết định xuất bản dựa trên chất lượng khoa học, không phân biệt xuất thân</li>
            <li>✓ Đảm bảo quy trình phản biện công bằng, minh bạch</li>
            <li>✓ Bảo vệ quyền tác giả và bảo mật thông tin</li>
            <li>✓ Xử lý kịp thời các khiếu nại về đạo đức xuất bản</li>
            <li>✓ Rà soát bài viết bằng phần mềm phát hiện sao chép</li>
            <li>✓ Công bố sửa đổi hoặc thu hồi bài viết khi cần thiết</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Hành vi vi phạm đạo đức</h3>
        <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-600 mb-6">
          <h4 class="font-bold text-red-800 mb-3">🚫 Các hành vi bị cấm:</h4>
          <div class="grid md:grid-cols-2 gap-4">
            <ul class="space-y-2 text-sm text-gray-700">
              <li>❌ Sao chép (Plagiarism)</li>
              <li>❌ Tự đạo văn (Self-plagiarism)</li>
              <li>❌ Bịa đặt dữ liệu</li>
              <li>❌ Làm sai lệch kết quả</li>
              <li>❌ Nộp song song nhiều tạp chí</li>
            </ul>
            <ul class="space-y-2 text-sm text-gray-700">
              <li>❌ Tác giả ảo</li>
              <li>❌ Chia nhỏ bài viết (salami slicing)</li>
              <li>❌ Che giấu xung đột lợi ích</li>
              <li>❌ Vi phạm đạo đức nghiên cứu</li>
              <li>❌ Đánh giá phản biện không trung thực</li>
            </ul>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Xử lý vi phạm</h3>
        <div class="space-y-4 mb-8">
          <div class="bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-600">
            <h4 class="font-bold text-yellow-800 mb-2">⚠️ Vi phạm nhẹ</h4>
            <p class="text-sm text-gray-700">Cảnh cáo, yêu cầu chỉnh sửa, tạm hoãn xuất bản</p>
          </div>

          <div class="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-600">
            <h4 class="font-bold text-orange-800 mb-2">⚠️⚠️ Vi phạm nghiêm trọng</h4>
            <p class="text-sm text-gray-700">Từ chối xuất bản, đưa vào danh sách đen, thông báo cơ quan quản lý</p>
          </div>

          <div class="bg-red-50 p-5 rounded-lg border-l-4 border-red-600">
            <h4 class="font-bold text-red-800 mb-2">⚠️⚠️⚠️ Vi phạm đặc biệt nghiêm trọng</h4>
            <p class="text-sm text-gray-700">Thu hồi bài viết đã xuất bản, công bố rộng rãi, chuyển cơ quan pháp luật</p>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Thu hồi bài viết (Retraction)</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <p class="text-gray-700 mb-3">Bài viết sẽ bị thu hồi trong các trường hợp:</p>
          <ul class="space-y-2 text-gray-700">
            <li>✓ Phát hiện vi phạm đạo đức nghiên cứu nghiêm trọng</li>
            <li>✓ Dữ liệu không đáng tin cậy hoặc bịa đặt</li>
            <li>✓ Sao chép hoặc tự đạo văn</li>
            <li>✓ Phát hiện lỗi nghiêm trọng ảnh hưởng đến kết quả</li>
            <li>✓ Tác giả yêu cầu thu hồi với lý do chính đáng</li>
          </ul>
          <p class="text-sm text-gray-600 mt-4">
            <em>Thông báo thu hồi sẽ được công bố công khai, giữ nguyên bài viết gốc với dấu "RETRACTED" rõ ràng.</em>
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Báo cáo vi phạm</h3>
        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border-l-4 border-emerald-600">
          <p class="text-gray-700 mb-3">
            Nếu phát hiện hành vi vi phạm đạo đức xuất bản, vui lòng báo cáo ngay đến:
          </p>
          <p class="text-gray-700">
            📧 Email: <a href="mailto:ethics@tapchintqsvn.edu.vn" class="text-emerald-600 hover:text-emerald-700 font-semibold">ethics@tapchintqsvn.edu.vn</a>
          </p>
          <p class="text-sm text-gray-600 mt-3">
            <em>Mọi báo cáo sẽ được xem xét nghiêm túc và bảo mật danh tính người báo cáo.</em>
          </p>
        </div>
      </div>
    `,
    metaTitle: 'Đạo đức xuất bản - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Chính sách đạo đức xuất bản khoa học và xử lý vi phạm theo chuẩn COPE',
    template: 'default',
    isPublished: true,
    publishedAt: new Date(),
    order: 6
  },
  {
    slug: 'license',
    title: 'Bản quyền',
    titleEn: 'Copyright & License',
    content: `
      <div class="prose prose-lg max-w-none">
        <h2 class="text-3xl font-bold text-emerald-700 mb-6">Chính sách bản quyền và cấp phép</h2>
        
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-8 border-l-4 border-indigo-600">
          <p class="text-lg text-gray-700">
            Tạp chí áp dụng mô hình <strong>Open Access</strong> với giấy phép <strong>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong> 
            nhằm thúc đẩy việc chia sẻ và phổ biến tri thức khoa học một cách rộng rãi.
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Giấy phép Creative Commons CC BY 4.0</h3>
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <div class="flex items-center gap-4 mb-4">
            <img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by.png" alt="CC BY 4.0" class="w-24" />
            <div>
              <h4 class="font-bold text-gray-800">Creative Commons Attribution 4.0</h4>
              <p class="text-sm text-gray-600">Giấy phép tự do nhất, cho phép chia sẻ và chỉnh sửa</p>
            </div>
          </div>

          <h4 class="font-bold text-gray-800 mb-3 mt-6">✅ Quyền được phép:</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Chia sẻ:</strong> Sao chép và phân phối tài liệu dưới bất kỳ phương tiện hoặc định dạng nào</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Chỉnh sửa:</strong> Remix, biến đổi và xây dựng dựa trên tài liệu</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div><strong>Thương mại:</strong> Có thể sử dụng cho mục đích thương mại</div>
            </li>
          </ul>

          <h4 class="font-bold text-gray-800 mb-3 mt-6">⚠️ Điều kiện bắt buộc:</h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <div><strong>Ghi công:</strong> Phải ghi rõ tên tác giả, tiêu đề bài viết, tên tạp chí, số xuất bản, DOI và giấy phép</div>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <div><strong>Liên kết giấy phép:</strong> Cung cấp liên kết đến giấy phép và ghi rõ nếu có thay đổi</div>
            </li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Quyền của Tác giả</h3>
        <div class="bg-green-50 p-6 rounded-lg border-l-4 border-green-600 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li>✓ <strong>Giữ bản quyền:</strong> Tác giả giữ bản quyền đối với tác phẩm của mình</li>
            <li>✓ <strong>Sử dụng lại:</strong> Có quyền sử dụng lại bài viết trong các công trình khác</li>
            <li>✓ <strong>Chia sẻ:</strong> Được phép chia sẻ bài viết trên trang cá nhân, mạng xã hội</li>
            <li>✓ <strong>Phiên bản máy chủ:</strong> Có thể lưu trữ bản pre-print và post-print</li>
            <li>✓ <strong>Trích dẫn:</strong> Yêu cầu trích dẫn đúng khi bài viết được sử dụng</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Quyền của Tạp chí</h3>
        <div class="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li>✓ Quyền xuất bản và phân phối bài viết đã chấp nhận</li>
            <li>✓ Quyền chỉnh sửa kỹ thuật (định dạng, layout) mà không làm thay đổi nội dung</li>
            <li>✓ Quyền từ chối xuất bản nếu bài viết không đạt yêu cầu</li>
            <li>✓ Quyền thu hồi bài viết nếu phát hiện vi phạm đạo đức</li>
            <li>✓ Quyền lưu trữ bài viết trong cơ sở dữ liệu điện tử</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cách trích dẫn</h3>
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 class="font-bold text-gray-800 mb-3">Định dạng trích dẫn chuẩn APA:</h4>
          <div class="bg-white p-4 rounded border border-gray-300 font-mono text-sm text-gray-700 mb-4">
            Nguyễn, V. A., Trần, T. B., & Lê, C. D. (2024). Ứng dụng AI trong quản lý nghệ thuật quân sự. 
            <em>Tạp chí Nghệ thuật Quân sự Việt Nam</em>, <em>15</em>(2), 45-60. 
            https://doi.org/10.xxxxx/tapchi.2024.xxx
          </div>

          <h4 class="font-bold text-gray-800 mb-3 mt-6">Trích dẫn trong văn bản:</h4>
          <div class="bg-white p-4 rounded border border-gray-300 font-mono text-sm text-gray-700">
            (Nguyễn, Trần, & Lê, 2024)
          </div>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Phí xuất bản (APC)</h3>
        <div class="bg-green-50 p-6 rounded-lg border-l-4 border-green-600 mb-6">
          <div class="flex items-center gap-3 mb-3">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h4 class="font-bold text-green-800 text-xl">MIỄN PHÍ 100% cho tác giả</h4>
          </div>
          <p class="text-gray-700">
            Tạp chí không thu bất kỳ khoản phí nào từ tác giả cho việc nộp bài, xử lý biên tập, phản biện hay xuất bản. 
            Toàn bộ chi phí do <strong>Học viện Quốc phòng - Bộ Quốc phòng</strong> tài trợ.
          </p>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Lưu trữ dài hạn</h3>
        <div class="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-600 mb-6">
          <ul class="space-y-3 text-gray-700">
            <li>✓ Bài viết được lưu trữ vĩnh viễn trên hệ thống Tạp chí</li>
            <li>✓ Đồng thời lưu trữ trên các kho dữ liệu quốc gia và quốc tế</li>
            <li>✓ Đảm bảo khả năng truy cập lâu dài ngay cả khi Tạp chí ngừng hoạt động</li>
            <li>✓ Duy trì liên kết DOI vĩnh viễn</li>
          </ul>
        </div>

        <h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Vi phạm bản quyền</h3>
        <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-600 mb-6">
          <p class="text-gray-700 mb-3">
            Nếu phát hiện hành vi vi phạm bản quyền (sử dụng không ghi công, đạo văn, sử dụng sai mục đích), 
            vui lòng báo cáo ngay đến:
          </p>
          <p class="text-gray-700">
            📧 Email: <a href="mailto:copyright@tapchintqsvn.edu.vn" class="text-emerald-600 hover:text-emerald-700 font-semibold">copyright@tapchintqsvn.edu.vn</a>
          </p>
          <p class="text-sm text-gray-600 mt-3">
            <em>Tạp chí sẽ điều tra và xử lý nghiêm túc mọi khiếu nại về vi phạm bản quyền.</em>
          </p>
        </div>

        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg mt-8 border-l-4 border-emerald-600">
          <h3 class="text-xl font-bold text-emerald-800 mb-3">📖 Tìm hiểu thêm</h3>
          <ul class="space-y-2 text-gray-700">
            <li>• <a href="https://creativecommons.org/licenses/by/4.0/deed.vi" class="text-emerald-600 hover:text-emerald-700 underline" target="_blank">Creative Commons BY 4.0 (Tiếng Việt)</a></li>
            <li>• <a href="https://creativecommons.org/licenses/by/4.0/" class="text-emerald-600 hover:text-emerald-700 underline" target="_blank">Creative Commons BY 4.0 (English)</a></li>
            <li>• <a href="/pages/ethics" class="text-emerald-600 hover:text-emerald-700 underline">Đạo đức xuất bản của Tạp chí</a></li>
          </ul>
        </div>
      </div>
    `,
    metaTitle: 'Bản quyền - Tạp chí Nghệ thuật Quân sự Việt Nam',
    metaDesc: 'Chính sách bản quyền và cấp phép Creative Commons CC BY 4.0 - Open Access',
    template: 'default',
    isPublished: true,
    publishedAt: new Date(),
    order: 7
  }
]

async function seedPublicPages() {
  console.log('\n🌱 Bắt đầu seed public pages...\n')

  // Xóa dữ liệu cũ (tùy chọn - cẩn thận với môi trường production!)
  console.log('🗑️  Xóa dữ liệu cũ...')
  await prisma.publicPage.deleteMany({})

  // Seed các trang mới
  for (const page of PUBLIC_PAGES) {
    const created = await prisma.publicPage.create({
      data: page
    })
    console.log(`✅ Đã tạo: ${created.slug} - ${created.title}`)
  }

  console.log(`\n✅ Đã seed thành công ${PUBLIC_PAGES.length} trang tĩnh!\n`)

  // Hiển thị danh sách
  console.log('📄 Danh sách trang đã tạo:\n')
  const pages = await prisma.publicPage.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, isPublished: true, order: true }
  })

  pages.forEach(page => {
    console.log(`  ${page.isPublished ? '✅' : '⏸️'}  [${page.order}] /pages/${page.slug} - ${page.title}`)
  })

  console.log('\n🎉 Hoàn thành!\n')
}

seedPublicPages()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
