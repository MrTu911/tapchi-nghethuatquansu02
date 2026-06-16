/**
 * Nội dung Hướng dẫn sử dụng dashboard theo từng vai trò — Tạp chí NTQS.
 *
 * Đây là NGUỒN DỮ LIỆU (content) cho trang /dashboard/help. Trang chỉ render;
 * mọi nội dung từng-bước nằm ở đây để dễ mở rộng và giữ UI mỏng (xem
 * .claude/rules/architecture.md & code-style.md).
 *
 * Quy tắc cô lập: trang help dùng getGuideForRole(session.role) để render CHỈ
 * guide của vai trò đang đăng nhập — mỗi tài khoản chỉ thấy hướng dẫn của mình.
 *
 * iconKey là chuỗi (vd 'Crown') được map sang component lucide ở trang render,
 * nhờ vậy file này là .ts thuần, không phụ thuộc JSX.
 */

import type { RoleKey } from '@/lib/role-labels'

export interface GuideStepFunction {
  /** Tên chức năng, vd "Nộp bài mới" */
  title: string
  /** Liên kết tới trang thao tác thật (nếu có) */
  href?: string
  /** Chức năng này để làm gì */
  purpose: string
  /** Thao tác từng bước */
  steps: string[]
  /** Điều kiện quyền cần nhấn mạnh (nếu có) */
  permission?: string
  /** Giới hạn / cảnh báo (nếu có) */
  limit?: string
}

export interface GuideSection {
  /** Anchor id để mục lục nhảy tới, vd "submit" */
  id: string
  /** Tên nhóm chức năng */
  title: string
  /** Mô tả ngắn nhóm (tùy chọn) */
  description?: string
  functions: GuideStepFunction[]
}

export interface RoleGuide {
  key: string
  role: RoleKey
  /** Khóa icon lucide, map ở trang render */
  iconKey: string
  /** Trang làm việc chính của vai trò */
  dashboard: string
  /** Ảnh minh họa trong /public (tùy chọn) */
  screenshot?: string
  /** Tóm tắt vai trò 1–2 câu */
  summary: string
  /** Trách nhiệm chính của vai trò */
  responsibilities: string[]
  /** Các nhóm chức năng (đầy đủ) */
  sections: GuideSection[]
  /** Giới hạn quyền hạn quan trọng */
  notes?: string[]
  /** Tên file tài liệu .docx đầy đủ trong docs/huong-dan/ (nếu có) */
  docx?: string
}

/**
 * Nhóm chức năng dùng chung cho MỌI vai trò có dashboard.
 * Được nối vào cuối mỗi guide để người dùng nào cũng biết các thao tác nền.
 */
const COMMON_SECTION: GuideSection = {
  id: 'common',
  title: 'Chức năng chung (mọi vai trò)',
  description: 'Các thao tác nền mọi tài khoản đăng nhập đều dùng được.',
  functions: [
    {
      title: 'Hồ sơ cá nhân & đổi mật khẩu',
      href: '/dashboard/profile',
      purpose: 'Cập nhật thông tin cá nhân, đơn vị, liên hệ và đổi mật khẩu đăng nhập.',
      steps: [
        'Mở "Hồ sơ" từ menu hoặc góc trên bên phải.',
        'Sửa các trường họ tên, email, đơn vị, số điện thoại, giới thiệu.',
        'Bấm "Lưu" để cập nhật thông tin.',
        'Để đổi mật khẩu: mở mục Bảo mật/Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới, rồi xác nhận.',
      ],
    },
    {
      title: 'Bật xác thực 2 lớp (2FA)',
      href: '/dashboard/profile',
      purpose: 'Tăng bảo mật tài khoản bằng mã OTP qua email hoặc ứng dụng TOTP.',
      steps: [
        'Vào "Hồ sơ" → mục Bảo mật / Xác thực 2 lớp.',
        'Chọn phương thức: Email OTP hoặc ứng dụng TOTP (Google Authenticator…).',
        'Với TOTP: quét mã QR bằng ứng dụng, nhập mã 6 số để kích hoạt.',
        'Lần đăng nhập sau hệ thống sẽ yêu cầu nhập mã OTP để hoàn tất.',
      ],
      permission: 'Khuyến nghị bắt buộc với các vai trò biên tập, lãnh đạo và quản trị.',
    },
    {
      title: 'Thông báo',
      href: '/dashboard/notifications',
      purpose: 'Nhận các sự kiện liên quan: phân công, quyết định, yêu cầu chỉnh sửa, nhắc deadline.',
      steps: [
        'Bấm biểu tượng chuông hoặc mở "Thông báo".',
        'Bấm vào một thông báo để đi thẳng tới bài/việc liên quan.',
        'Đánh dấu đã đọc để dọn danh sách.',
      ],
    },
    {
      title: 'Tin nhắn nội bộ',
      href: '/dashboard/messages',
      purpose: 'Trao đổi với các vai trò được phép theo quy tắc bảo mật của tòa soạn.',
      steps: [
        'Mở "Tin nhắn".',
        'Chọn cuộc trao đổi hoặc tạo mới với người được phép liên hệ.',
        'Soạn và gửi nội dung; tệp đính kèm tuân theo giới hạn hệ thống.',
      ],
      limit: 'Phản biện viên không nhắn trực tiếp tác giả (nguyên tắc phản biện kín).',
    },
    {
      title: 'Mở trang công khai của Tạp chí',
      href: '/',
      purpose: 'Xem giao diện độc giả: trang chủ, số mới, kho bài, tìm kiếm.',
      steps: ['Bấm liên kết trang công khai để mở website ở chế độ độc giả.'],
    },
  ],
}

export const ROLE_GUIDES: RoleGuide[] = [
  // ───────────────────────────── AUTHOR ─────────────────────────────
  {
    key: 'author',
    role: 'AUTHOR',
    iconKey: 'PenLine',
    dashboard: '/dashboard/author',
    screenshot: '/help/screenshots/author-dashboard.png',
    summary:
      'Gửi bài nghiên cứu, theo dõi quá trình phản biện, phản hồi yêu cầu chỉnh sửa và xem quyết định biên tập của tòa soạn.',
    responsibilities: [
      'Chuẩn bị và nộp bản thảo đúng quy cách của Tạp chí.',
      'Theo dõi trạng thái bài và phản hồi yêu cầu chỉnh sửa đúng hạn.',
      'Bảo đảm tính trung thực, không trùng lặp/đạo văn của bản thảo.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển cá nhân',
        functions: [
          {
            title: 'Xem tổng quan hoạt động',
            href: '/dashboard/author',
            purpose: 'Nắm nhanh số bài đang nộp, đang phản biện, cần chỉnh sửa và đã đăng.',
            steps: [
              'Mở "Bảng điều khiển" của Tác giả.',
              'Xem các thẻ thống kê theo trạng thái và biểu đồ nộp bài theo tháng.',
              'Bấm vào một thẻ/biểu đồ để đi tới danh sách bài tương ứng.',
            ],
          },
        ],
      },
      {
        id: 'submit',
        title: '2. Nộp bài mới',
        functions: [
          {
            title: 'Nộp một bản thảo',
            href: '/dashboard/author/submit',
            purpose: 'Gửi bài nghiên cứu vào quy trình phản biện của Tạp chí.',
            steps: [
              'Mở "Nộp bài mới".',
              'Nhập tiêu đề, tóm tắt tiếng Việt và tiếng Anh, từ khóa.',
              'Chọn chuyên mục phù hợp (Chiến lược quân sự, Nghệ thuật tác chiến, Lịch sử quân sự…).',
              'Tải lên tệp bản thảo (đúng định dạng và dung lượng cho phép).',
              'Khai thông tin đồng tác giả nếu có.',
              'Kiểm tra lại rồi bấm "Gửi" — bài chuyển trạng thái Mới (NEW).',
            ],
            limit: 'Không gắn danh tính tác giả trong file để giữ phản biện kín nếu tòa soạn yêu cầu.',
          },
        ],
      },
      {
        id: 'track',
        title: '3. Theo dõi & sửa bài đã nộp',
        functions: [
          {
            title: 'Danh sách bài đã nộp',
            href: '/dashboard/author/submissions',
            purpose: 'Theo dõi tất cả bản thảo và trạng thái hiện tại của từng bài.',
            steps: [
              'Mở "Bài đã nộp của tôi".',
              'Đọc trạng thái: Mới → Đang phản biện → Yêu cầu chỉnh sửa → Chấp nhận → Sản xuất → Đã đăng.',
              'Bấm một bài để xem chi tiết, nhận xét phản biện và lịch sử phiên bản.',
            ],
          },
          {
            title: 'Sửa bài khi còn chờ xử lý',
            href: '/dashboard/author/submissions',
            purpose: 'Chỉnh sửa thông tin/tệp khi bài chưa được đưa vào phản biện.',
            steps: [
              'Mở chi tiết bài còn ở trạng thái Mới.',
              'Bấm "Sửa" để cập nhật tiêu đề, tóm tắt, từ khóa hoặc thay tệp.',
              'Lưu thay đổi.',
            ],
            limit: 'Khi bài đã vào phản biện, chỉ chỉnh sửa qua luồng "Chỉnh sửa theo yêu cầu".',
          },
        ],
      },
      {
        id: 'revise',
        title: '4. Chỉnh sửa theo yêu cầu phản biện',
        functions: [
          {
            title: 'Phản hồi & nộp bản chỉnh sửa',
            href: '/dashboard/author/submissions',
            purpose: 'Đáp ứng yêu cầu chỉnh sửa (minor/major) và nộp bản mới theo từng vòng.',
            steps: [
              'Nhận thông báo "Yêu cầu chỉnh sửa" và mở bài tương ứng.',
              'Đọc kỹ nhận xét và khuyến nghị của phản biện và biên tập.',
              'Bấm "Chỉnh sửa theo yêu cầu", soạn thư phản hồi nêu rõ đã sửa gì.',
              'Tải lên bản thảo mới (tạo phiên bản mới, không ghi đè bản cũ).',
              'Gửi lại — bài quay lại vòng phản biện/biên tập.',
            ],
          },
        ],
      },
      {
        id: 'published',
        title: '5. Bài đã đăng & báo cáo',
        functions: [
          {
            title: 'Xem bài đã công bố',
            href: '/dashboard/author/articles',
            purpose: 'Tra cứu các bài của bạn đã được xuất bản trên Tạp chí.',
            steps: ['Mở "Bài của tôi" để xem danh sách bài đã đăng và số tạp chí tương ứng.'],
          },
          {
            title: 'Báo cáo công bố của tôi',
            href: '/dashboard/reports/publications?mode=author',
            purpose: 'Xuất danh mục bài báo của bản thân (DOCX/XLSX/PDF) phục vụ kê khai.',
            steps: [
              'Mở "Báo cáo công bố của tôi".',
              'Lọc theo thời gian/chuyên mục nếu cần.',
              'Chọn định dạng và bấm xuất báo cáo.',
            ],
          },
        ],
      },
    ],
    notes: [
      'Vai trò Tác giả chỉ thấy và thao tác trên bài của chính mình.',
      'Không liên hệ trực tiếp phản biện viên; mọi trao đổi đi qua tòa soạn.',
    ],
  },

  // ───────────────────────────── REVIEWER ─────────────────────────────
  {
    key: 'reviewer',
    role: 'REVIEWER',
    iconKey: 'UserCheck',
    dashboard: '/dashboard/reviewer',
    screenshot: '/help/screenshots/reviewer-dashboard.png',
    summary:
      'Đánh giá độc lập chất lượng khoa học của bài nộp theo nguyên tắc phản biện kín. Nhận/từ chối lời mời, nộp và chỉnh sửa phản biện qua từng vòng.',
    responsibilities: [
      'Đánh giá khách quan, đúng chuyên môn và đúng hạn.',
      'Giữ bí mật nội dung bản thảo và danh tính các bên.',
      'Đưa khuyến nghị rõ ràng kèm nhận xét xây dựng.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển phản biện',
        functions: [
          {
            title: 'Xem tổng quan & cảnh báo deadline',
            href: '/dashboard/reviewer',
            purpose: 'Nắm số bài đang chờ, sắp đến hạn và hiệu suất phản biện của bạn.',
            steps: [
              'Mở "Bảng điều khiển" Phản biện.',
              'Xem các chỉ số: tỷ lệ hoàn thành, thời gian trung bình, lời mời sắp đến hạn.',
              'Bấm cảnh báo deadline để đi tới bài cần xử lý gấp.',
            ],
          },
        ],
      },
      {
        id: 'invite',
        title: '2. Nhận / từ chối lời mời',
        functions: [
          {
            title: 'Phản hồi lời mời phản biện',
            href: '/dashboard/reviewer/assignments',
            purpose: 'Xác nhận có nhận phản biện một bài hay không.',
            steps: [
              'Mở "Bài cần phản biện", tab Đang chờ.',
              'Xem tóm tắt/lĩnh vực bài (ẩn danh tác giả).',
              'Bấm "Nhận" để đồng ý hoặc "Từ chối" kèm lý do nếu xung đột lợi ích/không đúng chuyên môn.',
            ],
          },
        ],
      },
      {
        id: 'review',
        title: '3. Thực hiện & nộp phản biện',
        functions: [
          {
            title: 'Điền và nộp phiếu phản biện',
            href: '/dashboard/reviewer/assignments',
            purpose: 'Đánh giá bài và đưa khuyến nghị cho tòa soạn.',
            steps: [
              'Mở bài đã nhận để vào phiếu phản biện.',
              'Chọn khuyến nghị: Chấp nhận / Sửa nhỏ / Sửa lớn / Từ chối.',
              'Chấm điểm và viết nhận xét chi tiết cho từng tiêu chí.',
              'Bấm "Lưu nháp" để lưu tạm và quay lại sau, hoặc "Gửi" để nộp chính thức.',
            ],
          },
          {
            title: 'Phản biện vòng 2 & gửi lại',
            href: '/dashboard/reviewer/assignments',
            purpose: 'Đánh giá bản chỉnh sửa của tác giả ở các vòng tiếp theo.',
            steps: [
              'Khi được mời vòng 2, mở bài để xem bản chỉnh sửa và thư phản hồi của tác giả.',
              'Cập nhật nhận xét/khuyến nghị dựa trên thay đổi.',
              'Có thể chỉnh sửa phản biện cho tới khi tòa soạn ra quyết định cuối.',
            ],
          },
          {
            title: 'Kiểm tra trùng lặp',
            href: '/dashboard/repository/duplicate-check',
            purpose: 'Đối chiếu nhanh bài đang phản biện với kho bài để phát hiện trùng lặp.',
            steps: [
              'Mở công cụ "Kiểm tra trùng lặp".',
              'Dán/chọn nội dung cần đối chiếu và chạy kiểm tra.',
              'Tham khảo tỷ lệ tương đồng để hỗ trợ nhận định (không thay quyết định biên tập).',
            ],
          },
        ],
      },
      {
        id: 'history',
        title: '4. Lịch sử phản biện',
        functions: [
          {
            title: 'Tra cứu phản biện đã hoàn thành',
            href: '/dashboard/reviewer/history',
            purpose: 'Xem lại các phản biện đã nộp và kết quả.',
            steps: ['Mở "Lịch sử phản biện" để xem toàn bộ bài đã đánh giá theo thời gian.'],
          },
        ],
      },
    ],
    notes: [
      'Phản biện kín: không liên hệ trực tiếp tác giả.',
      'Không xem được danh tính tác giả nếu tòa soạn áp dụng ẩn danh.',
    ],
  },

  // ───────────────────────────── SECTION_EDITOR ─────────────────────────────
  {
    key: 'section-editor',
    role: 'SECTION_EDITOR',
    iconKey: 'FileText',
    dashboard: '/dashboard/editor',
    screenshot: '/help/screenshots/section-editor-dashboard.png',
    summary:
      'Xử lý các bài ĐƯỢC PHÂN CÔNG: gán phản biện, theo dõi tiến độ và ra quyết định biên tập. Chỉ thấy bài được giao cho mình.',
    responsibilities: [
      'Điều phối phản biện cho các bài được phân công.',
      'Ra quyết định biên tập đúng quy trình và đúng hạn.',
      'Bảo đảm chất lượng chuyên môn của chuyên mục phụ trách.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển biên tập',
        functions: [
          {
            title: 'Bảng Kanban & thống kê bài',
            href: '/dashboard/editor',
            purpose: 'Nhìn tổng thể bài theo trạng thái và phát hiện điểm nghẽn.',
            steps: [
              'Mở "Bảng điều khiển" biên tập.',
              'Xem bài xếp theo cột trạng thái (Mới → Đang phản biện → Chỉnh sửa → Chấp nhận → Sản xuất).',
              'Bấm thẻ bài để mở chi tiết.',
            ],
          },
        ],
      },
      {
        id: 'handle',
        title: '2. Xử lý bài được giao',
        functions: [
          {
            title: 'Danh sách bài cần xử lý',
            href: '/dashboard/editor/submissions',
            purpose: 'Thấy các bài được phân công và việc cần làm tiếp theo.',
            steps: [
              'Mở "Bài cần xử lý".',
              'Lọc theo trạng thái/deadline.',
              'Mở từng bài để xem bản thảo, phản biện và lịch sử.',
            ],
            limit: 'Chỉ hiển thị bài được phân công cho bạn.',
          },
          {
            title: 'Ra quyết định biên tập',
            href: '/dashboard/editor/submissions',
            purpose: 'Quyết định hướng xử lý bài dựa trên kết quả phản biện.',
            steps: [
              'Mở chi tiết bài, đọc tổng hợp các phản biện và khuyến nghị.',
              'Chọn quyết định: Từ chối sớm (Desk reject) / Chấp nhận / Từ chối / Yêu cầu chỉnh sửa.',
              'Soạn ý kiến gửi tác giả (với yêu cầu chỉnh sửa cần nêu rõ điểm cần sửa).',
              'Xác nhận — hệ thống cập nhật trạng thái và thông báo cho tác giả.',
            ],
          },
        ],
      },
      {
        id: 'assign',
        title: '3. Gán phản biện',
        functions: [
          {
            title: 'Tìm & gán phản biện viên',
            href: '/dashboard/editor/assign-reviewers',
            purpose: 'Mời phản biện phù hợp chuyên môn cho bài.',
            steps: [
              'Mở "Gán phản biện".',
              'Tìm theo lĩnh vực/từ khóa hoặc dùng gợi ý hệ thống.',
              'Chọn một hoặc nhiều phản biện (có thể gán hàng loạt).',
              'Đặt hạn phản biện và gửi lời mời.',
            ],
          },
          {
            title: 'Theo dõi danh sách phản biện viên',
            href: '/dashboard/editor/reviewers',
            purpose: 'Xem năng lực, tải công việc và chỉ số của phản biện viên.',
            steps: ['Mở "Phản biện viên" để xem hồ sơ và mức độ bận của từng người trước khi mời.'],
          },
        ],
      },
      {
        id: 'workflow',
        title: '4. Quy trình & Deadline',
        functions: [
          {
            title: 'Quản lý mốc thời gian',
            href: '/dashboard/editor/workflow',
            purpose: 'Theo dõi và điều chỉnh hạn phản biện/chỉnh sửa.',
            steps: [
              'Mở "Quy trình & Deadline".',
              'Xem các mốc còn hạn/quá hạn.',
              'Nhắc hoặc gia hạn khi cần.',
            ],
          },
        ],
      },
    ],
    notes: [
      'Không ký xuất bản, không đưa bài vào sản xuất.',
      'Không phân công biên tập viên (việc của Thư ký tòa soạn).',
    ],
  },

  // ───────────────────────────── MANAGING_EDITOR ─────────────────────────────
  {
    key: 'managing',
    role: 'MANAGING_EDITOR',
    iconKey: 'ClipboardList',
    dashboard: '/dashboard/managing',
    screenshot: '/help/screenshots/managing-dashboard.png',
    summary:
      'Đầu mối điều phối hằng ngày: phân công bài cho biên tập viên, điều phối phản biện, theo dõi deadline và chuẩn bị số tạp chí.',
    responsibilities: [
      'Phân công bài cho biên tập viên chuyên mục.',
      'Điều phối tiến độ phản biện và biên tập toàn tòa soạn.',
      'Chuẩn bị và sắp xếp nội dung cho từng số tạp chí.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển tòa soạn',
        functions: [
          {
            title: 'Tổng quan & số tạp chí',
            href: '/dashboard/managing',
            purpose: 'Nắm tiến độ chung và tình trạng các số đang chuẩn bị.',
            steps: ['Mở "Bảng điều khiển" Thư ký tòa soạn để xem chỉ số tổng hợp và việc cần điều phối.'],
          },
        ],
      },
      {
        id: 'assign-editors',
        title: '2. Phân công biên tập',
        functions: [
          {
            title: 'Giao bài cho biên tập viên',
            href: '/dashboard/managing/assignments',
            purpose: 'Định tuyến bài tới đúng biên tập viên chuyên mục.',
            steps: [
              'Mở "Phân công biên tập".',
              'Chọn bài chưa có người phụ trách.',
              'Gán cho biên tập viên phù hợp chuyên mục và xác nhận.',
            ],
          },
          {
            title: 'Điều phối phản biện & deadline',
            href: '/dashboard/editor/assign-reviewers',
            purpose: 'Hỗ trợ gán phản biện và theo dõi mốc thời gian khi cần.',
            steps: [
              'Dùng "Gán phản biện" và "Quy trình & Deadline" như biên tập viên.',
              'Theo dõi bài trễ hạn để nhắc/điều chỉnh.',
            ],
          },
        ],
      },
      {
        id: 'issues',
        title: '3. Quản lý Số & Tập tạp chí',
        functions: [
          {
            title: 'Tạo / chỉnh sửa số tạp chí',
            href: '/dashboard/managing/issues',
            purpose: 'Tổ chức nội dung từng số: thông tin số, bìa, mục lục.',
            steps: [
              'Mở "Số Tạp chí" → "Tạo số mới" hoặc mở số có sẵn để sửa.',
              'Nhập số/tập, ngày phát hành, ảnh bìa.',
              'Vào "Bài trong số" để thêm/sắp xếp bài cho mục lục.',
            ],
            permission: 'Cần quyền quản lý số (issues.manage).',
          },
          {
            title: 'Quản lý Tập (Volumes)',
            href: '/dashboard/admin/volumes',
            purpose: 'Quản lý các tập/niên giám của Tạp chí.',
            steps: ['Mở "Tập (Volumes)" để tạo và sắp xếp tập chứa các số.'],
            permission: 'Cần quyền quản lý tập (volumes.manage).',
          },
          {
            title: 'Xem tất cả bài & kho lưu trữ',
            href: '/dashboard/managing/articles',
            purpose: 'Tra cứu toàn bộ bài và kho lưu trữ báo chí.',
            steps: [
              'Mở "Tất cả bài" để tìm theo bộ lọc.',
              'Mở "Kho lưu trữ báo chí" để xem tư liệu cũ.',
            ],
          },
        ],
      },
    ],
    notes: [
      'Một số chức năng phụ thuộc quyền được cấp động (permission codes).',
      'Không ký xuất bản — bước ký cuối thuộc Tổng biên tập.',
    ],
    docx: 'thu-ky-toa-soan.docx',
  },

  // ───────────────────────────── DEPUTY_EIC ─────────────────────────────
  {
    key: 'deputy',
    role: 'DEPUTY_EIC',
    iconKey: 'ShieldHalf',
    dashboard: '/dashboard/deputy',
    screenshot: '/help/screenshots/deputy-dashboard.png',
    summary:
      'Điều hành thường trực toàn bộ quy trình ngang Tổng biên tập, TRỪ quyền ký xuất bản cuối. Giám sát và trình bài hoàn tất lên Tổng biên tập.',
    responsibilities: [
      'Giám sát toàn bộ tiến độ phản biện, biên tập và chuẩn bị số.',
      'Ra quyết định biên tập và điều phối khi được ủy quyền.',
      'Trình các bài đã hoàn tất lên Tổng biên tập ký xuất bản.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển giám sát',
        functions: [
          {
            title: 'Theo dõi toàn cảnh tòa soạn',
            href: '/dashboard/deputy',
            purpose: 'Giám sát các luồng bài, điểm nghẽn và bài sắp hoàn tất.',
            steps: ['Mở "Bảng điều khiển" Phó Tổng biên tập để xem bức tranh tổng thể.'],
          },
        ],
      },
      {
        id: 'editorial',
        title: '2. Quyết định & điều phối biên tập',
        functions: [
          {
            title: 'Ra quyết định trên bài',
            href: '/dashboard/editor/submissions',
            purpose: 'Quyết định hướng xử lý như biên tập viên/EIC (trừ ký xuất bản).',
            steps: [
              'Mở "Bài cần xử lý", lọc bài cần quyết định.',
              'Đọc phản biện và chọn quyết định phù hợp.',
              'Gửi ý kiến cho tác giả/biên tập viên.',
            ],
          },
          {
            title: 'Phân công biên tập viên',
            href: '/dashboard/managing/assignments',
            purpose: 'Điều phối phân công như Thư ký tòa soạn khi cần.',
            steps: ['Mở "Phân công biên tập" để giao bài và theo dõi.'],
          },
        ],
      },
      {
        id: 'oversight',
        title: '3. Giám sát người dùng & báo cáo',
        functions: [
          {
            title: 'Xem người dùng & phản biện viên',
            href: '/dashboard/admin/users',
            purpose: 'Tra cứu hồ sơ người dùng và đội ngũ phản biện.',
            steps: [
              'Mở "Tất cả người dùng" để tra cứu.',
              'Mở "Phản biện viên" để xem năng lực và chỉ số.',
            ],
          },
          {
            title: 'Báo cáo, phiên đăng nhập & audit',
            href: '/dashboard/admin/reports',
            purpose: 'Theo dõi báo cáo hoạt động và nhật ký giám sát cấp lãnh đạo.',
            steps: [
              'Mở "Báo cáo" để xem/kết xuất số liệu.',
              'Xem "Phiên đăng nhập" và "Nhật ký audit" để giám sát an toàn vận hành.',
            ],
          },
          {
            title: 'Theo dõi dàn trang / sản xuất',
            href: '/dashboard/layout/production',
            purpose: 'Giám sát các bài đang dàn trang trước khi trình ký.',
            steps: ['Mở "Hàng đợi Sản xuất" để theo dõi tiến độ (không bấm ký xuất bản).'],
          },
        ],
      },
    ],
    notes: ['KHÔNG có nút Xuất bản — bước ký cuối thuộc Tổng biên tập.'],
    docx: 'pho-tong-bien-tap.docx',
  },

  // ───────────────────────────── EIC ─────────────────────────────
  {
    key: 'eic',
    role: 'EIC',
    iconKey: 'Crown',
    dashboard: '/dashboard/eic',
    screenshot: '/help/screenshots/eic-dashboard.png',
    summary:
      'Quyền cao nhất về nội dung và là người duy nhất KÝ XUẤT BẢN. Giám sát toàn bộ quy trình, duyệt số, quản trị người dùng & phân quyền.',
    responsibilities: [
      'Chịu trách nhiệm cuối về nội dung xuất bản của Tạp chí.',
      'Ký xuất bản từng bài/số sau khi hoàn tất quy trình.',
      'Định hướng chất lượng và giám sát toàn hệ thống biên tập.',
    ],
    sections: [
      {
        id: 'overview',
        title: '1. Bảng điều khiển & phân tích',
        functions: [
          {
            title: 'Tổng quan điều hành',
            href: '/dashboard/eic',
            purpose: 'Nắm toàn cảnh hàng chờ, tiến độ và chỉ số then chốt.',
            steps: ['Mở "Bảng điều khiển" Tổng biên tập để xem hàng chờ và việc cần quyết định.'],
          },
          {
            title: 'Phân tích chuyên sâu',
            href: '/dashboard/eic/analytics',
            purpose: 'Đánh giá hiệu suất phản biện, thời gian xuất bản, cơ cấu chuyên mục.',
            steps: ['Mở "Phân tích" để xem xu hướng, điểm nghẽn và hiệu suất tòa soạn.'],
          },
        ],
      },
      {
        id: 'decide',
        title: '2. Ra quyết định biên tập',
        functions: [
          {
            title: 'Quyết định trên bài',
            href: '/dashboard/editor/submissions',
            purpose: 'Đưa quyết định cuối về chấp nhận/từ chối/chỉnh sửa.',
            steps: [
              'Mở "Bài cần xử lý & ra quyết định".',
              'Đọc tổng hợp phản biện và lịch sử.',
              'Chọn quyết định và gửi ý kiến.',
            ],
          },
        ],
      },
      {
        id: 'publish',
        title: '3. Ký xuất bản',
        functions: [
          {
            title: 'Ký xuất bản bài/số',
            href: '/dashboard/layout/production',
            purpose: 'Phê duyệt cuối để đưa bài/số ra công khai.',
            steps: [
              'Mở "Hàng đợi Sản xuất".',
              'Kiểm tra bản dàn trang, metadata và tình trạng hoàn tất.',
              'Bấm "Ký xuất bản" để phát hành (với bài mật cần đủ chữ ký theo quy tắc hai người).',
            ],
            permission: 'Chỉ Tổng biên tập (và Quản trị hệ thống) mới ký xuất bản.',
          },
        ],
      },
      {
        id: 'admin',
        title: '4. Quản trị nội dung & người dùng',
        functions: [
          {
            title: 'Quản lý người dùng & phản biện',
            href: '/dashboard/admin/users',
            purpose: 'Theo dõi và điều chỉnh tài khoản, đội ngũ phản biện.',
            steps: ['Mở "Tất cả người dùng" và "Phản biện viên" để quản trị nhân sự biên tập.'],
          },
          {
            title: 'Phân quyền RBAC',
            href: '/dashboard/admin/permissions',
            purpose: 'Cấp/thu quyền chức năng cho các vai trò.',
            steps: ['Mở "Phân quyền RBAC" để cấu hình quyền theo vai trò/người dùng.'],
          },
        ],
      },
    ],
    notes: ['Là vai trò duy nhất có quyền ký xuất bản cuối.'],
    docx: 'tong-bien-tap.docx',
  },

  // ───────────────────────────── LAYOUT_EDITOR ─────────────────────────────
  {
    key: 'layout',
    role: 'LAYOUT_EDITOR',
    iconKey: 'Layers',
    dashboard: '/dashboard/layout/production',
    screenshot: '/help/screenshots/layout-production.png',
    summary:
      'Phụ trách sản xuất: hiệu đính, dàn trang, hoàn thiện tệp xuất bản và metadata. Trình bài đã dàn trang lên Tổng biên tập ký.',
    responsibilities: [
      'Hiệu đính và dàn trang các bài đã được chấp nhận.',
      'Hoàn thiện tệp xuất bản và chuẩn hóa metadata.',
      'Trình bản hoàn tất để Tổng biên tập ký xuất bản.',
    ],
    sections: [
      {
        id: 'production',
        title: '1. Hàng đợi sản xuất',
        functions: [
          {
            title: 'Dàn trang & hoàn thiện bài',
            href: '/dashboard/layout/production',
            purpose: 'Đưa bài đã chấp nhận vào quy trình sản xuất tới khi sẵn sàng ký.',
            steps: [
              'Mở "Hàng đợi Sản xuất".',
              'Chọn bài ở trạng thái Đang sản xuất.',
              'Hiệu đính, dàn trang, tải lên tệp hoàn thiện và cập nhật metadata.',
              'Đánh dấu hoàn tất để trình Tổng biên tập ký.',
            ],
          },
        ],
      },
      {
        id: 'plagiarism',
        title: '2. Kiểm tra đạo văn',
        functions: [
          {
            title: 'Quét đạo văn trước khi xuất bản',
            href: '/dashboard/plagiarism',
            purpose: 'Rà soát mức độ tương đồng/đạo văn của bài trước khi phát hành.',
            steps: [
              'Mở "Kiểm tra trùng lặp & Đạo văn".',
              'Chạy quét cho bài cần kiểm tra.',
              'Xem báo cáo tương đồng và xử lý nếu vượt ngưỡng.',
            ],
          },
        ],
      },
    ],
    notes: ['Không có nút Xuất bản — bước ký cuối thuộc Tổng biên tập.'],
  },

  // ───────────────────────────── SYSADMIN ─────────────────────────────
  {
    key: 'sysadmin',
    role: 'SYSADMIN',
    iconKey: 'Settings',
    dashboard: '/dashboard/admin',
    screenshot: '/help/screenshots/admin-dashboard.png',
    summary:
      'Toàn quyền kỹ thuật & vận hành: người dùng, phân quyền RBAC, nội dung, CMS, tích hợp, cấu hình và bảo mật. Vai trò duy nhất gán được vai trò cấp cao.',
    responsibilities: [
      'Quản trị tài khoản, vai trò và phân quyền toàn hệ thống.',
      'Quản lý nội dung, CMS website và cấu hình vận hành.',
      'Giám sát bảo mật, audit và tình trạng hệ thống.',
    ],
    sections: [
      {
        id: 'users',
        title: '1. Quản lý người dùng & phân quyền',
        functions: [
          {
            title: 'Quản lý tài khoản',
            href: '/dashboard/admin/users',
            purpose: 'Tạo, sửa, kích hoạt/khóa và gán vai trò cho người dùng.',
            steps: [
              'Mở "Tất cả người dùng".',
              'Tạo mới hoặc mở một tài khoản để chỉnh vai trò/trạng thái.',
              'Lưu thay đổi — thao tác nhạy cảm được ghi audit.',
            ],
          },
          {
            title: 'Phản biện viên & chỉ số',
            href: '/dashboard/admin/reviewers',
            purpose: 'Quản lý đội ngũ phản biện và theo dõi hiệu suất.',
            steps: ['Mở "Phản biện viên" và "Chỉ số phản biện" để quản lý năng lực, tải việc.'],
          },
          {
            title: 'Phân quyền RBAC & leo thang vai trò',
            href: '/dashboard/admin/permissions',
            purpose: 'Cấu hình quyền theo vai trò và xét duyệt yêu cầu nâng quyền.',
            steps: [
              'Mở "Phân quyền RBAC" để cấp/thu quyền.',
              'Mở "Leo thang vai trò" để duyệt/giám sát thay đổi vai trò.',
            ],
          },
          {
            title: 'Phiên đăng nhập',
            href: '/dashboard/admin/sessions',
            purpose: 'Giám sát và thu hồi phiên đăng nhập đáng ngờ.',
            steps: ['Mở "Phiên đăng nhập" để xem phiên đang hoạt động và thu hồi khi cần.'],
          },
        ],
      },
      {
        id: 'content',
        title: '2. Quản lý nội dung tạp chí',
        functions: [
          {
            title: 'Số, tập, chuyên mục, từ khóa, metadata',
            href: '/dashboard/admin/issues',
            purpose: 'Quản trị cấu trúc nội dung học thuật của Tạp chí.',
            steps: [
              'Mở "Số" / "Tập" để tổ chức kỳ phát hành.',
              'Mở "Chuyên mục" / "Từ khóa" để chuẩn hóa phân loại.',
              'Mở "Metadata & Xuất bản" để cấu hình DOI/ISSN và thông tin xuất bản.',
            ],
          },
          {
            title: 'Bài, bài nổi bật, tin tức, thông báo',
            href: '/dashboard/admin/articles',
            purpose: 'Quản lý kho bài và nội dung biên tập công khai.',
            steps: [
              'Mở "Bài" để lọc, xem phiên bản và audit phản biện.',
              'Dùng "Bài nổi bật", "Tin tức", "Thông báo" để biên tập nội dung trang.',
            ],
          },
        ],
      },
      {
        id: 'cms',
        title: '3. CMS & Website',
        functions: [
          {
            title: 'Trang chủ, trang tĩnh, media',
            href: '/dashboard/admin/cms/homepage',
            purpose: 'Biên tập giao diện và nội dung website công khai.',
            steps: [
              'Mở "Trang chủ" để sắp xếp khối hiển thị.',
              'Dùng "Trang tĩnh", "Thư viện media", "Banner/Slider" để cập nhật nội dung.',
            ],
          },
          {
            title: 'Video, Podcast, Menu điều hướng, Cài đặt site',
            href: '/dashboard/admin/cms/settings',
            purpose: 'Quản lý kênh đa phương tiện và cấu hình chung của website.',
            steps: [
              'Mở "Video" / "Podcast" để quản lý nội dung media.',
              'Mở "Menu điều hướng" và "Cài đặt Website" để cấu hình hiển thị/identity.',
            ],
          },
          {
            title: 'Web Crawler',
            href: '/dashboard/admin/web-sources',
            purpose: 'Cấu hình nguồn thu thập và duyệt nội dung đã crawl.',
            steps: [
              'Mở "Nguồn web" để khai báo nguồn.',
              'Mở "Nội dung đã thu thập" để duyệt/nhập về.',
            ],
          },
        ],
      },
      {
        id: 'system',
        title: '4. Hệ thống, phân tích & bảo mật',
        functions: [
          {
            title: 'Thống kê, phân tích, báo cáo',
            href: '/dashboard/admin/statistics',
            purpose: 'Theo dõi số liệu vận hành và kết xuất báo cáo.',
            steps: ['Mở "Thống kê" / "Phân tích" / "Báo cáo" để xem và xuất dữ liệu.'],
          },
          {
            title: 'Cấu hình quy trình, tích hợp, giao diện',
            href: '/dashboard/admin/workflow',
            purpose: 'Cấu hình engine phản biện, tích hợp ngoài và tùy biến UI.',
            steps: [
              'Mở "Cấu hình quy trình" và "Cài đặt phản biện".',
              'Mở "Tích hợp" và "Cấu hình UI" để chỉnh tham số hệ thống.',
            ],
          },
          {
            title: 'Cảnh báo, nhật ký, audit, giám sát',
            href: '/dashboard/admin/security-logs',
            purpose: 'Giám sát an toàn và truy vết thay đổi dữ liệu.',
            steps: [
              'Mở "Cảnh báo bảo mật", "Nhật ký bảo mật", "Nhật ký audit".',
              'Mở "Giám sát" để theo dõi sức khỏe hệ thống.',
            ],
          },
        ],
      },
    ],
    notes: ['Thao tác nhạy cảm (đổi vai trò, phân quyền, thu hồi phiên) đều được ghi audit.'],
  },

  // ───────────────────────────── COMMANDER ─────────────────────────────
  {
    key: 'commander',
    role: 'COMMANDER',
    iconKey: 'Monitor',
    dashboard: '/dashboard/commander',
    screenshot: '/help/screenshots/commander-dashboard.png',
    summary:
      'Xem báo cáo tổng hợp, giám sát toàn cảnh hoạt động Tạp chí. Vai trò chỉ đọc, không can thiệp nghiệp vụ biên tập.',
    responsibilities: [
      'Theo dõi bức tranh tổng thể hoạt động của Tạp chí.',
      'Khai thác báo cáo điều hành phục vụ chỉ đạo.',
    ],
    sections: [
      {
        id: 'center',
        title: '1. Trung tâm Chỉ huy',
        functions: [
          {
            title: 'Bảng tổng hợp đa chiều',
            href: '/dashboard/commander',
            purpose: 'Xem toàn cảnh qua các tab phân tích chuyên đề.',
            steps: [
              'Mở "Trung tâm Chỉ huy".',
              'Chuyển giữa các tab: Tổng quan, Xu hướng & Dự báo, Lĩnh vực Nghiên cứu, Hệ sinh thái Tác giả, Chất lượng & Bảo mật, Kho học liệu.',
              'Đọc KPI và biểu đồ trong từng tab.',
            ],
          },
        ],
      },
      {
        id: 'reports',
        title: '2. Báo cáo',
        functions: [
          {
            title: 'Báo cáo điều hành',
            href: '/dashboard/commander/report',
            purpose: 'Xem/tải báo cáo chiến lược tổng hợp.',
            steps: ['Mở "Báo cáo Điều hành" để xem và kết xuất báo cáo.'],
          },
          {
            title: 'Báo cáo công bố (tổng hợp)',
            href: '/dashboard/reports/publications',
            purpose: 'Khai thác danh mục công bố toàn Tạp chí.',
            steps: ['Mở "Báo cáo công bố" và lọc theo nhu cầu để xuất số liệu.'],
          },
        ],
      },
    ],
    notes: ['Vai trò chỉ đọc — không can thiệp quy trình biên tập.'],
  },

  // ───────────────────────────── SECURITY_AUDITOR ─────────────────────────────
  {
    key: 'security',
    role: 'SECURITY_AUDITOR',
    iconKey: 'ShieldAlert',
    dashboard: '/dashboard/security',
    screenshot: '/help/screenshots/security-dashboard.png',
    summary:
      'Giám sát an toàn hệ thống (cảnh báo, phiên đăng nhập, nhật ký kiểm toán) và ĐỒNG KÝ bài mật cùng Tổng biên tập theo quy tắc hai người.',
    responsibilities: [
      'Giám sát cảnh báo bảo mật và nhật ký kiểm toán.',
      'Theo dõi phiên đăng nhập bất thường.',
      'Đồng ký phát hành bài mật theo quy tắc hai người.',
    ],
    sections: [
      {
        id: 'monitor',
        title: '1. Giám sát bảo mật',
        functions: [
          {
            title: 'Bảng kiểm soát bảo mật',
            href: '/dashboard/security',
            purpose: 'Theo dõi cảnh báo, phiên đăng nhập và nhật ký kiểm toán.',
            steps: [
              'Mở "Bảng kiểm soát bảo mật".',
              'Xem cảnh báo và sự kiện đáng ngờ.',
              'Tra nhật ký kiểm toán để truy vết hành vi.',
            ],
            limit: 'Quyền chủ yếu là chỉ đọc — không chỉnh cấu hình bảo mật.',
          },
        ],
      },
      {
        id: 'cosign',
        title: '2. Đồng ký bài mật',
        functions: [
          {
            title: 'Đồng ký phát hành bài mật',
            href: '/dashboard/security',
            purpose: 'Cùng Tổng biên tập phê duyệt phát hành bài SECRET/TOP_SECRET.',
            steps: [
              'Nhận yêu cầu đồng ký với bài mật.',
              'Kiểm tra điều kiện và xác nhận chữ ký.',
              'Bài chỉ phát hành khi đủ chữ ký Tổng biên tập + Kiểm định bảo mật.',
            ],
            permission: 'Quy tắc hai người — cần đủ cả hai chữ ký.',
          },
        ],
      },
    ],
    notes: ['Chủ yếu là vai trò giám sát/đọc; tác động phát hành chỉ qua cơ chế đồng ký.'],
  },
]

// Nối nhóm "Chức năng chung" vào cuối mọi guide để mọi vai trò đều thấy.
for (const guide of ROLE_GUIDES) {
  guide.sections.push(COMMON_SECTION)
}

/**
 * Trả guide đúng vai trò đang đăng nhập. Dùng để cô lập: chỉ render guide khớp.
 */
export function getGuideForRole(role?: string | null): RoleGuide | undefined {
  if (!role) return undefined
  return ROLE_GUIDES.find(g => g.role === role)
}
