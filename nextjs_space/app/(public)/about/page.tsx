import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import {
  BookOpen, FileText, Eye, Download, Users, Award,
  Target, Globe, Shield, Mail, MapPin, Clock, ChevronRight,
  CheckCircle, Star, Layers, Building2, Pencil,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.publicPage.findUnique({ where: { slug: 'about', isPublished: true } })
  return {
    title: page?.metaTitle ?? 'Giới thiệu | Tạp chí Nghệ thuật Quân sự Việt Nam',
    description: page?.metaDesc ?? 'Tạp chí Nghệ thuật Quân sự Việt Nam - Học viện Quốc phòng.',
  }
}

async function getPageData() {
  const [
    cmsPage,
    totalArticles,
    totalIssues,
    totalAuthors,
    totalCategories,
    articleStats,
    newsViews,
    siteSettings,
    editorialBoard,
    recentArticles,
  ] = await Promise.all([
    prisma.publicPage.findUnique({ where: { slug: 'about', isPublished: true } }),
    prisma.article.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.issue.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({ where: { role: 'AUTHOR' } }),
    prisma.category.count(),
    prisma.article.aggregate({
      where: { approvalStatus: 'APPROVED' },
      _sum: { views: true, downloads: true },
    }),
    prisma.news.aggregate({ where: { isPublished: true }, _sum: { views: true } }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: ['site_name', 'site_description', 'site_publisher', 'site_issn', 'site_eissn',
            'contact_email', 'contact_address', 'contact_working_hours', 'footer_about_text', 'footer_tagline'],
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'] } },
      select: { id: true, fullName: true, role: true, org: true },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    }),
    prisma.article.findMany({
      where: { approvalStatus: 'APPROVED', publishedAt: { lte: new Date() } },
      include: {
        submission: {
          include: {
            category: { select: { name: true, slug: true } },
            author: { select: { fullName: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
  ])

  const settings = Object.fromEntries(siteSettings.map(s => [s.key, s.value ?? '']))
  const totalViews = (articleStats._sum.views ?? 0) + (newsViews._sum.views ?? 0)
  const totalDownloads = articleStats._sum.downloads ?? 0

  return {
    cmsPage,
    stats: { totalArticles, totalIssues, totalAuthors, totalCategories, totalViews, totalDownloads },
    settings,
    editorialBoard,
    recentArticles,
  }
}

const ROLE_ORDER: Record<string, number> = { EIC: 0, MANAGING_EDITOR: 1, SECTION_EDITOR: 2 }
function getRoleLabel(role: string) {
  return ({ EIC: 'Tổng biên tập', MANAGING_EDITOR: 'Phó tổng biên tập', SECTION_EDITOR: 'Biên tập viên' })[role] ?? role
}

// Nội dung tĩnh fallback khi CMS chưa có dữ liệu
const FALLBACK_CONTENT = {
  mission: [
    'Chiến lược – Chiến dịch – Chiến thuật',
    'Quản lý kinh tế và tài chính quân sự',
    'Khoa học quân sự và trang bị hiện đại',
    'Khoa học quản lý và lãnh đạo trong quân đội',
    'Nghệ thuật tác chiến trong chiến tranh hiện đại',
    'Nghiên cứu ứng dụng và phát triển công nghệ',
  ],
}

export default async function AboutPage() {
  const { cmsPage, stats, settings, editorialBoard, recentArticles } = await getPageData()
  const sorted = [...editorialBoard].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))

  const hasCmsContent = !!cmsPage?.content

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#1a3d22] via-[#295232] to-[#3d6b4a] text-white overflow-hidden rounded-xl mb-8">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative px-6 sm:px-10 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-300 text-sm font-medium uppercase tracking-widest">Giới thiệu tạp chí</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {cmsPage?.title ?? settings.site_name ?? 'Tạp chí Nghệ thuật Quân sự Việt Nam'}
            </h1>
            {cmsPage?.titleEn && (
              <p className="text-emerald-200 italic text-base mb-4">{cmsPage.titleEn}</p>
            )}
            <p className="text-emerald-100 text-lg leading-relaxed mb-6">
              {settings.footer_about_text || 'Diễn đàn khoa học của Học viện Quốc phòng, nơi công bố các công trình nghiên cứu có giá trị lý luận và thực tiễn trong lĩnh vực nghệ thuật quân sự.'}
            </p>
            {settings.footer_tagline && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold italic">{settings.footer_tagline}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        {[
          { icon: FileText, label: 'Bài báo', value: stats.totalArticles.toLocaleString('vi-VN'), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { icon: BookOpen, label: 'Số tạp chí', value: stats.totalIssues.toLocaleString('vi-VN'), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { icon: Users, label: 'Tác giả', value: stats.totalAuthors.toLocaleString('vi-VN'), color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          { icon: Layers, label: 'Chuyên mục', value: stats.totalCategories.toLocaleString('vi-VN'), color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
          { icon: Eye, label: 'Lượt xem', value: stats.totalViews.toLocaleString('vi-VN'), color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
          { icon: Download, label: 'Tải xuống', value: stats.totalDownloads.toLocaleString('vi-VN'), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-xl p-4 flex flex-col items-center text-center border border-transparent hover:shadow-md transition-shadow`}>
            <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
            <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══ LEFT (2 cols) ══════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Nội dung CMS (editable) ────────────────────────── */}
          {hasCmsContent ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Mục tiêu & Phạm vi</h2>
                </div>
                {/* Badge gợi ý admin biết đây là CMS-driven */}
                <span className="hidden text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">CMS</span>
              </div>
              <div
                className="px-6 py-5 prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-[#295232] dark:prose-headings:text-emerald-400 prose-headings:font-bold
                  prose-a:text-[#295232] dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                  prose-table:w-full prose-td:py-1.5 prose-td:px-3 prose-th:py-1.5 prose-th:px-3
                  prose-table:border prose-td:border prose-th:border prose-table:border-gray-200 dark:prose-table:border-gray-700
                  prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300"
                dangerouslySetInnerHTML={{ __html: cmsPage!.content }}
              />
              {cmsPage?.updatedAt && (
                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-400">
                  <Pencil className="w-3 h-3" />
                  Cập nhật lần cuối: {new Date(cmsPage.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              )}
            </div>
          ) : (
            /* Fallback khi CMS chưa có */
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Mục tiêu & Phạm vi</h2>
              </div>
              <div className="px-6 py-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>Tạp chí Nghệ thuật Quân sự Việt Nam là ấn phẩm khoa học chuyên ngành của <strong>Học viện Quốc phòng</strong>, được xuất bản nhằm công bố kết quả nghiên cứu khoa học và trao đổi học thuật trong lĩnh vực nghệ thuật quân sự.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {FALLBACK_CONTENT.mission.map((topic) => (
                    <div key={topic} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Thông tin xuất bản (luôn static từ SiteSetting) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Thông tin xuất bản</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { label: 'Tên tạp chí', value: settings.site_name || 'Tạp chí Nghệ thuật Quân sự Việt Nam' },
                { label: 'Nhà xuất bản', value: settings.site_publisher || 'Học viện Quốc phòng' },
                { label: 'ISSN (in)', value: settings.site_issn || 'Đang cập nhật' },
                { label: 'eISSN (điện tử)', value: settings.site_eissn || 'Đang cập nhật' },
                { label: 'Ngôn ngữ', value: 'Tiếng Việt (tóm tắt tiếng Anh)' },
                { label: 'Hình thức phản biện', value: 'Phản biện kín (Double-blind peer review)' },
              ].map((row) => (
                <div key={row.label} className="flex items-start px-6 py-3">
                  <span className="w-44 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 pt-0.5">{row.label}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chính sách truy cập mở */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Chính sách truy cập mở</h2>
            </div>
            <div className="px-6 py-5 space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              {[
                'Truy cập mở hoàn toàn – miễn phí đọc và tải về',
                'Không thu phí xử lý bài (APC)',
                'Phản biện kín hai chiều (double-blind)',
                'Bảo lưu quyền tác giả, cấp phép sử dụng rõ ràng',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bài báo gần đây */}
          {recentArticles.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Bài báo tiêu biểu</h2>
                </div>
                <Link href="/articles" className="text-xs text-[#295232] dark:text-emerald-400 hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentArticles.map((art) => (
                  <Link key={art.id} href={`/articles/${art.id}`}
                    className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#295232] line-clamp-2 leading-snug">
                        {art.submission.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{art.submission.author?.fullName}</span>
                        {art.submission.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">{art.submission.category.name}</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-[#295232] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR ══════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Ban biên tập */}
          {sorted.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ban biên tập</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map((person) => (
                  <div key={person.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#295232] to-[#4A7A55] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {person.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{person.fullName}</p>
                      <p className="text-xs text-[#295232] dark:text-emerald-400 font-medium">{getRoleLabel(person.role)}</p>
                      {person.org && <p className="text-xs text-gray-400 line-clamp-1">{person.org}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liên hệ */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Liên hệ</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {settings.contact_email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="text-sm text-[#295232] dark:text-emerald-400 hover:underline break-all">
                    {settings.contact_email}
                  </a>
                </div>
              )}
              {settings.contact_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{settings.contact_address}</span>
                </div>
              )}
              {settings.contact_working_hours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{settings.contact_working_hours}</span>
                </div>
              )}
              <div className="pt-1">
                <Link href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#295232] hover:bg-[#1e3d25] px-3 py-1.5 rounded-lg transition-colors">
                  Gửi liên hệ <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Globe / Chính sách */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Chính sách truy cập</h2>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              {['Truy cập mở hoàn toàn', 'Không thu phí xử lý bài (APC)', 'Phản biện kín hai chiều', 'Bảo lưu quyền tác giả'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#295232] to-[#4A7A55] text-white rounded-xl p-5">
            <h3 className="font-bold text-sm mb-2">Gửi bài nghiên cứu</h3>
            <p className="text-emerald-100 text-xs leading-relaxed mb-4">
              Tạp chí luôn mở cửa tiếp nhận bài báo khoa học từ các nhà nghiên cứu trong và ngoài Học viện.
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-[#295232] hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              Nộp bài ngay <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pb-12" />
    </div>
  )
}
