import Link from 'next/link'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import {
  FileText, CheckCircle, AlertCircle, Clock,
  Users, BookOpen, ChevronRight, Info,
  Mail, Shield, Pencil,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.publicPage.findUnique({ where: { slug: 'guidelines', isPublished: true } })
  return {
    title: page?.metaTitle ?? 'Hướng dẫn tác giả | Tạp chí Nghệ thuật Quân sự Việt Nam',
    description: page?.metaDesc ?? 'Hướng dẫn đầy đủ cho tác giả về quy cách trình bày và quy trình nộp bài.',
  }
}

// Các mục TOC cố định — giúp user điều hướng nhanh trong trang
const TOC_SECTIONS = [
  { id: 'submission', label: 'Điều kiện nộp bài' },
  { id: 'format', label: 'Quy cách trình bày' },
  { id: 'structure', label: 'Cấu trúc bài viết' },
  { id: 'references', label: 'Trích dẫn tài liệu' },
  { id: 'ethics', label: 'Đạo đức khoa học' },
  { id: 'process', label: 'Quy trình & Thời gian' },
]

// Nội dung fallback khi CMS chưa được cấu hình
const FALLBACK_STEPS = [
  { step: '01', label: 'Nộp bài', time: 'Ngay lập tức', desc: 'Hệ thống xác nhận qua email sau khi nộp thành công.' },
  { step: '02', label: 'Sàng lọc biên tập', time: '3 – 5 ngày', desc: 'Ban biên tập kiểm tra hình thức và phạm vi chủ đề.' },
  { step: '03', label: 'Phản biện kín', time: '2 – 4 tuần', desc: 'Phản biện kín, ít nhất 2 phản biện độc lập.' },
  { step: '04', label: 'Thông báo kết quả', time: '4 – 6 tuần', desc: 'Tác giả nhận kết quả: chấp nhận / chỉnh sửa / từ chối.' },
  { step: '05', label: 'Hoàn thiện', time: '1 – 2 tuần', desc: 'Tác giả nộp bản sửa theo yêu cầu (nếu có).' },
  { step: '06', label: 'Xuất bản', time: 'Theo lịch số', desc: 'Bài được xuất bản trực tuyến sau khi hoàn thiện kỹ thuật.' },
]

export default async function GuidelinesPage() {
  const cmsPage = await prisma.publicPage.findUnique({
    where: { slug: 'guidelines', isPublished: true },
  })

  const hasCmsContent = !!cmsPage?.content

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#1a3d22] via-[#295232] to-[#3d6b4a] text-white overflow-hidden rounded-xl mb-8">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative px-6 sm:px-10 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-300 text-sm font-medium uppercase tracking-widest">Hướng dẫn tác giả</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {cmsPage?.title ?? 'Quy định nộp bài & Hướng dẫn trình bày'}
          </h1>
          {cmsPage?.titleEn && (
            <p className="text-emerald-200 italic text-sm mb-3">{cmsPage.titleEn}</p>
          )}
          <p className="text-emerald-100 text-base leading-relaxed max-w-2xl">
            Đọc kỹ hướng dẫn trước khi chuẩn bị bài gửi tới Tạp chí để đảm bảo bài được xử lý nhanh chóng và đúng quy trình.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/auth/login"
              className="inline-flex items-center gap-2 bg-white text-[#295232] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors">
              <Pencil className="w-4 h-4" /> Nộp bài ngay
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-lg hover:bg-white/30 transition-colors">
              <Mail className="w-4 h-4" /> Liên hệ tòa soạn
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

        {/* ── Sticky TOC ─────────────────────────────────────────── */}
        <nav className="hidden lg:block">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-24 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nội dung</span>
            </div>
            <div className="py-2">
              {TOC_SECTIONS.map((sec) => (
                <a key={sec.id} href={`#${sec.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-[#295232] dark:hover:text-emerald-400 transition-colors">
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  {sec.label}
                </a>
              ))}
              {hasCmsContent && cmsPage?.updatedAt && (
                <div className="px-4 pt-3 pb-2 border-t border-gray-100 dark:border-gray-800 mt-2 text-xs text-gray-400 flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" />
                  {new Date(cmsPage.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Alert */}
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Lưu ý:</strong> Bài gửi không đúng quy cách có thể bị trả lại mà không qua phản biện. Vui lòng đọc kỹ toàn bộ hướng dẫn trước khi nộp bài.
            </div>
          </div>

          {/* ── CMS content block ─────────────────────────────────── */}
          {hasCmsContent ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Hướng dẫn chi tiết</h2>
              </div>
              <div
                className="px-6 py-5 prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-[#295232] dark:prose-headings:text-emerald-400 prose-headings:font-bold
                  prose-h2:text-base prose-h3:text-sm
                  prose-a:text-[#295232] dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                  prose-table:w-full prose-td:py-2 prose-td:px-3 prose-th:py-2 prose-th:px-3 prose-th:bg-gray-50 dark:prose-th:bg-gray-800
                  prose-table:border prose-td:border prose-th:border prose-table:border-gray-200 dark:prose-table:border-gray-700
                  prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
                  prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300"
                dangerouslySetInnerHTML={{ __html: cmsPage!.content }}
              />
            </div>
          ) : (
            /* Fallback khi CMS trống */
            <>
              {/* 1. Điều kiện */}
              <section id="submission" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">1. Điều kiện nộp bài</h2>
                </div>
                <div className="px-6 py-5 space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    'Công trình chưa được công bố ở bất kỳ ấn phẩm nào khác.',
                    'Không đang được gửi tới tạp chí hoặc hội thảo khác cùng lúc.',
                    'Nội dung thuộc phạm vi chủ đề của tạp chí.',
                    'Tác giả chịu trách nhiệm về tính xác thực của số liệu và kết quả.',
                    'Bài viết không vi phạm bản quyền, không sao chép, đạo văn.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2 mt-3">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-blue-800 dark:text-blue-300">
                      Tác giả cần đăng ký tài khoản để nộp bài và theo dõi quá trình xử lý.{' '}
                      <Link href="/auth/register" className="underline font-medium">Đăng ký tại đây.</Link>
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. Quy cách */}
              <section id="format" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Quy cách trình bày</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Định dạng file', value: 'Word (.docx) hoặc PDF' },
                      { label: 'Font chữ', value: 'Times New Roman, 12pt' },
                      { label: 'Giãn dòng', value: '1.5 hoặc 2.0' },
                      { label: 'Lề trang', value: 'Trên/Dưới 2.5cm; Trái/Phải 3cm' },
                      { label: 'Độ dài bài', value: '4.000 – 8.000 từ' },
                      { label: 'Hình/Bảng', value: 'Tiêu đề rõ, ≥ 300 DPI' },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{item.label}</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3-5. Cấu trúc, trích dẫn, đạo đức */}
              {[
                {
                  id: 'structure', icon: BookOpen, color: 'purple', title: '3. Cấu trúc bài viết',
                  items: ['Tiêu đề (VN + EN)', 'Thông tin tác giả', 'Tóm tắt VN (150–250 từ)', 'Tóm tắt EN', 'Từ khóa (4–6 từ)', 'Mở đầu', 'Nội dung / Phương pháp', 'Kết quả & Thảo luận', 'Kết luận', 'Tài liệu tham khảo'],
                },
                {
                  id: 'references', icon: Shield, color: 'orange', title: '4. Trích dẫn tài liệu',
                  items: ['Chuẩn APA 7th Edition', 'Trong bài: dạng (Tác giả, Năm)', 'Tối thiểu 10 tài liệu tham khảo', 'Ít nhất 3 tài liệu tiếng Anh', 'Ưu tiên tài liệu từ 5 năm gần nhất'],
                },
                {
                  id: 'ethics', icon: Shield, color: 'rose', title: '5. Đạo đức khoa học',
                  items: ['Tính nguyên gốc: không sao chép, đạo văn', 'Xung đột lợi ích phải công bố', 'Đóng góp tác giả phải trung thực', 'Dữ liệu không bịa đặt hoặc sửa đổi', 'Không nộp bài đang ở ấn phẩm khác'],
                },
              ].map(({ id, icon: Icon, color, title, items }) => (
                <section key={id} id={id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden scroll-mt-24">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${color}-700 dark:text-${color}-400`} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
                  </div>
                  <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Badge variant="outline" className="text-[10px] h-4 w-5 flex-shrink-0 flex items-center justify-center">{i + 1}</Badge>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* 6. Quy trình */}
              <section id="process" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">6. Quy trình & Thời gian xử lý</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="relative">
                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-4">
                      {FALLBACK_STEPS.map((item, i) => (
                        <div key={i} className="relative flex gap-4 pl-10">
                          <div className="absolute left-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#295232] to-[#4A7A55] flex items-center justify-center text-white text-xs font-bold z-10">
                            {item.step}
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-gray-500">
                                <Clock className="w-2.5 h-2.5 mr-0.5" />{item.time}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* CTA download — luôn hiển thị */}
          <div className="bg-gradient-to-br from-[#295232] to-[#4A7A55] text-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-emerald-300" />
              <h3 className="font-bold text-base">Sẵn sàng nộp bài?</h3>
            </div>
            <p className="text-emerald-100 text-sm leading-relaxed mb-4">
              Đăng nhập hoặc tạo tài khoản mới để bắt đầu quy trình nộp bài. Mọi thắc mắc liên hệ tòa soạn qua email:{' '}
              <a href="mailto:tapchi@hocvienhaucanhqd.edu.vn" className="underline">tapchi@hocvienhaucanhqd.edu.vn</a>
            </p>
            <div className="flex gap-3">
              <Link href="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-[#295232] font-semibold text-sm px-5 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                Đăng ký tài khoản
              </Link>
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 bg-white/20 text-white text-sm px-5 py-2 rounded-lg hover:bg-white/30 transition-colors">
                Đã có tài khoản
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-12" />
    </div>
  )
}
