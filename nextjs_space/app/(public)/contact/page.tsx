import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Mail, MapPin, Clock, Phone, Send, MessageSquare, ChevronRight, BookOpen, Pencil } from 'lucide-react'
import Link from 'next/link'
import ContactForm from './contact-form'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.publicPage.findUnique({ where: { slug: 'contact', isPublished: true } })
  return {
    title: page?.metaTitle ?? 'Liên hệ | Tạp chí Nghệ thuật Quân sự Việt Nam',
    description: page?.metaDesc ?? 'Liên hệ với Ban biên tập Tạp chí Nghệ thuật Quân sự Việt Nam.',
  }
}

async function getPageData() {
  const [cmsPage, settings] = await Promise.all([
    prisma.publicPage.findUnique({ where: { slug: 'contact', isPublished: true } }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: ['contact_email', 'contact_email_editorial', 'contact_phone',
            'contact_address', 'contact_working_hours', 'site_name', 'site_publisher'],
        },
      },
    }),
  ])
  return { cmsPage, info: Object.fromEntries(settings.map(s => [s.key, s.value ?? ''])) }
}

export default async function ContactPage() {
  const { cmsPage, info } = await getPageData()

  const hasCmsContent = !!cmsPage?.content

  const contactCards = [
    {
      icon: Mail, title: 'Email tòa soạn',
      value: info.contact_email || 'tapchi@hocvienhaucanhqd.edu.vn',
      href: `mailto:${info.contact_email || 'tapchi@hocvienhaucanhqd.edu.vn'}`,
      color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', iconColor: 'text-blue-600',
    },
    {
      icon: Mail, title: 'Email biên tập',
      value: info.contact_email_editorial || info.contact_email || 'tapchi@hocvienhaucanhqd.edu.vn',
      href: `mailto:${info.contact_email_editorial || info.contact_email || ''}`,
      color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', iconColor: 'text-emerald-600',
    },
    {
      icon: Phone, title: 'Điện thoại',
      value: info.contact_phone || 'Đang cập nhật',
      href: info.contact_phone ? `tel:${info.contact_phone}` : undefined,
      color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', iconColor: 'text-purple-600',
    },
    {
      icon: Clock, title: 'Giờ làm việc',
      value: info.contact_working_hours || 'Thứ 2 – Thứ 6: 8:00 – 17:00',
      color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', iconColor: 'text-orange-600',
    },
  ]

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
            <MessageSquare className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-300 text-sm font-medium uppercase tracking-widest">Liên hệ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {cmsPage?.title ?? 'Liên hệ với Ban biên tập'}
          </h1>
          {cmsPage?.titleEn && (
            <p className="text-emerald-200 italic text-sm mb-3">{cmsPage.titleEn}</p>
          )}
          <p className="text-emerald-100 text-base leading-relaxed max-w-2xl">
            Chúng tôi sẵn sàng giải đáp mọi thắc mắc về quy trình nộp bài, phản biện, và các vấn đề liên quan đến tạp chí.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* ── LEFT ─────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Contact cards (luôn lấy từ SiteSetting) */}
          <div className="grid grid-cols-2 gap-3">
            {contactCards.map((card) => (
              <div key={card.title} className={`rounded-xl border p-4 ${card.color}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor} mb-2`} />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{card.title}</p>
                {card.href ? (
                  <a href={card.href} className={`text-sm font-medium ${card.iconColor} hover:underline break-all`}>{card.value}</a>
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{card.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Địa chỉ */}
          {info.contact_address && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Địa chỉ tòa soạn</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{info.contact_address}</p>
                  <p className="text-xs text-gray-400 mt-1">{info.site_publisher || 'Học viện Quốc phòng'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CMS: FAQ & extra content ─────────────────────────── */}
          {hasCmsContent && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Thông tin thêm</h2>
                </div>
                {cmsPage?.updatedAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    {new Date(cmsPage.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                )}
              </div>
              <div
                className="px-6 py-5 prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-[#295232] dark:prose-headings:text-emerald-400 prose-headings:font-bold
                  prose-h2:text-base prose-h3:text-sm
                  prose-a:text-[#295232] dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                  prose-table:w-full prose-td:py-2 prose-td:px-3 prose-th:py-2 prose-th:px-3
                  prose-table:border prose-td:border prose-th:border prose-table:border-gray-200 dark:prose-table:border-gray-700
                  prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300"
                dangerouslySetInnerHTML={{ __html: cmsPage!.content }}
              />
            </div>
          )}

          {/* Form liên hệ */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Send className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Gửi thư tới Ban biên tập</h2>
            </div>
            <div className="p-6">
              <ContactForm contactEmail={info.contact_email || 'tapchi@hocvienhaucanhqd.edu.vn'} />
            </div>
          </div>
        </div>

        {/* ── RIGHT Sidebar ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* FAQ static fallback — chỉ hiện khi CMS chưa có nội dung */}
          {!hasCmsContent && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#295232] dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Câu hỏi thường gặp</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { q: 'Thời gian xử lý bài nộp là bao lâu?', a: 'Thông thường 4–6 tuần từ lúc nhận bài đến khi có kết quả phản biện.' },
                  { q: 'Phí nộp bài là bao nhiêu?', a: 'Tạp chí không thu phí xử lý bài (APC). Hoàn toàn miễn phí cho tác giả.' },
                  { q: 'Sau khi gửi bài, tôi theo dõi ở đâu?', a: 'Đăng nhập vào tài khoản tác giả trên hệ thống để xem trạng thái bài gửi.' },
                  { q: 'Tôi có thể gửi bài tiếng Anh không?', a: 'Tạp chí chủ yếu nhận bài tiếng Việt. Tóm tắt và từ khóa yêu cầu có bản tiếng Anh.' },
                ].map((faq, i) => (
                  <details key={i} className="group px-5 py-3 cursor-pointer">
                    <summary className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 list-none">
                      <span>{faq.q}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#295232] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Đường dẫn nhanh</h2>
            </div>
            <div className="py-2">
              {[
                { label: 'Hướng dẫn nộp bài', href: '/guidelines' },
                { label: 'Giới thiệu tạp chí', href: '/about' },
                { label: 'Danh mục số tạp chí', href: '/issues' },
                { label: 'Tìm kiếm bài báo', href: '/search' },
                { label: 'Đăng nhập / Đăng ký', href: '/auth/login' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-[#295232] dark:hover:text-emerald-400 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Journal card */}
          <div className="bg-gradient-to-br from-[#295232] to-[#4A7A55] text-white rounded-xl p-5">
            <BookOpen className="w-6 h-6 text-emerald-300 mb-3" />
            <h3 className="font-bold text-sm mb-1">{info.site_name || 'Tạp chí Nghệ thuật Quân sự Việt Nam'}</h3>
            <p className="text-xs text-emerald-200 leading-relaxed mb-3">
              {info.site_publisher || 'Học viện Quốc phòng'} – Phản biện kín, truy cập mở, phi lợi nhuận.
            </p>
            <Link href="/about"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Tìm hiểu thêm <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pb-12" />
    </div>
  )
}
