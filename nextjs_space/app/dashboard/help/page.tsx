import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen, Crown, ShieldHalf, ClipboardList, ArrowRight, CheckCircle2,
  PenLine, FileText, Layers, ShieldAlert, Monitor, Settings, UserCheck,
} from 'lucide-react'

/**
 * Trung tâm Hướng dẫn sử dụng trong ứng dụng.
 *
 * Hub tra cứu nhanh theo vai trò: ảnh màn hình + các bước chính + lối tắt tới
 * trang thao tác thật. Bản đầy đủ để in/phát hành nằm ở file .docx
 * (docs/huong-dan/*.docx) — xem mục "Tài liệu đầy đủ" cuối trang.
 */

interface RoleGuide {
  key: string
  role: string
  title: string
  icon: React.ElementType
  dashboard: string
  screenshot?: string
  summary: string
  bullets: { label: string; href: string }[]
  note?: string
}

const GUIDES: RoleGuide[] = [
  {
    key: 'eic',
    role: 'EIC',
    title: 'Tổng biên tập',
    icon: Crown,
    dashboard: '/dashboard/eic',
    screenshot: '/help/screenshots/eic-dashboard.png',
    summary:
      'Quyền cao nhất về nội dung và là người duy nhất KÝ XUẤT BẢN. Giám sát toàn bộ quy trình, duyệt số, quản trị người dùng & phân quyền.',
    bullets: [
      { label: 'Bảng điều khiển & hàng chờ', href: '/dashboard/eic' },
      { label: 'Bài cần xử lý & ra quyết định', href: '/dashboard/editor/submissions' },
      { label: 'Ký xuất bản (Hàng đợi Sản xuất)', href: '/dashboard/layout/production' },
      { label: 'Phân tích chi tiết', href: '/dashboard/eic/analytics' },
      { label: 'Phân quyền RBAC', href: '/dashboard/admin/permissions' },
    ],
  },
  {
    key: 'deputy',
    role: 'DEPUTY_EIC',
    title: 'Phó Tổng biên tập',
    icon: ShieldHalf,
    dashboard: '/dashboard/deputy',
    screenshot: '/help/screenshots/deputy-dashboard.png',
    summary:
      'Điều hành thường trực toàn bộ quy trình ngang Tổng biên tập, TRỪ quyền ký xuất bản cuối. Giám sát và trình bài hoàn tất lên Tổng biên tập.',
    bullets: [
      { label: 'Bảng điều khiển giám sát', href: '/dashboard/deputy' },
      { label: 'Bài cần xử lý & ra quyết định', href: '/dashboard/editor/submissions' },
      { label: 'Phân công biên tập', href: '/dashboard/managing/assignments' },
      { label: 'Theo dõi dàn trang', href: '/dashboard/layout/production' },
    ],
    note: 'Không có nút Xuất bản — bước ký cuối thuộc Tổng biên tập.',
  },
  {
    key: 'managing',
    role: 'MANAGING_EDITOR',
    title: 'Thư ký tòa soạn',
    icon: ClipboardList,
    dashboard: '/dashboard/managing',
    screenshot: '/help/screenshots/managing-dashboard.png',
    summary:
      'Đầu mối điều phối hằng ngày: phân công bài cho biên tập viên, điều phối phản biện, theo dõi deadline và chuẩn bị số tạp chí.',
    bullets: [
      { label: 'Bảng điều khiển & số tạp chí', href: '/dashboard/managing' },
      { label: 'Phân công biên tập viên', href: '/dashboard/managing/assignments' },
      { label: 'Gán phản biện', href: '/dashboard/editor/assign-reviewers' },
      { label: 'Quản lý Số tạp chí', href: '/dashboard/admin/issues' },
    ],
  },
  {
    key: 'section-editor',
    role: 'SECTION_EDITOR',
    title: 'Biên tập viên chuyên mục',
    icon: FileText,
    dashboard: '/dashboard/editor',
    screenshot: '/help/screenshots/section-editor-dashboard.png',
    summary:
      'Xử lý các bài ĐƯỢC PHÂN CÔNG: gán phản biện, theo dõi tiến độ, ra quyết định biên tập. Chỉ thấy bài được giao cho mình.',
    bullets: [
      { label: 'Bài cần xử lý (được giao)', href: '/dashboard/editor/submissions' },
      { label: 'Gán phản biện', href: '/dashboard/editor/assign-reviewers' },
      { label: 'Quy trình & Deadline', href: '/dashboard/editor/workflow' },
    ],
    note: 'Không ký xuất bản, không đưa vào sản xuất, không phân công biên tập viên.',
  },
  {
    key: 'layout',
    role: 'LAYOUT_EDITOR',
    title: 'Biên tập viên dàn trang',
    icon: Layers,
    dashboard: '/dashboard/layout/production',
    screenshot: '/help/screenshots/layout-production.png',
    summary:
      'Phụ trách sản xuất: hiệu đính, dàn trang, hoàn thiện tệp xuất bản và metadata. Trình bài đã dàn trang lên Tổng biên tập ký.',
    bullets: [
      { label: 'Hàng đợi Sản xuất', href: '/dashboard/layout/production' },
      { label: 'Kiểm tra đạo văn', href: '/dashboard/plagiarism' },
    ],
    note: 'Không có nút Xuất bản — bước ký cuối thuộc Tổng biên tập.',
  },
  {
    key: 'reviewer',
    role: 'REVIEWER',
    title: 'Phản biện viên',
    icon: UserCheck,
    dashboard: '/dashboard/reviewer',
    screenshot: '/help/screenshots/reviewer-dashboard.png',
    summary:
      'Đánh giá độc lập chất lượng khoa học của bài nộp theo nguyên tắc phản biện kín. Nhận/từ chối lời mời, nộp và sửa phản biện.',
    bullets: [
      { label: 'Bài cần phản biện', href: '/dashboard/reviewer/assignments' },
      { label: 'Lịch sử phản biện', href: '/dashboard/reviewer/history' },
    ],
    note: 'Không liên hệ trực tiếp tác giả (blind review).',
  },
  {
    key: 'author',
    role: 'AUTHOR',
    title: 'Tác giả',
    icon: PenLine,
    dashboard: '/dashboard/author',
    screenshot: '/help/screenshots/author-dashboard.png',
    summary:
      'Gửi bài nghiên cứu, theo dõi quá trình phản biện, phản hồi yêu cầu chỉnh sửa và xem quyết định biên tập.',
    bullets: [
      { label: 'Nộp bài mới', href: '/dashboard/author/submit' },
      { label: 'Bài đã nộp của tôi', href: '/dashboard/author/submissions' },
      { label: 'Báo cáo công bố của tôi', href: '/dashboard/reports/publications?mode=author' },
    ],
  },
  {
    key: 'security',
    role: 'SECURITY_AUDITOR',
    title: 'Kiểm định bảo mật',
    icon: ShieldAlert,
    dashboard: '/dashboard/security',
    screenshot: '/help/screenshots/security-dashboard.png',
    summary:
      'Giám sát an toàn hệ thống (cảnh báo, phiên đăng nhập, nhật ký kiểm toán) và ĐỒNG KÝ bài mật cùng Tổng biên tập (quy tắc hai người).',
    bullets: [
      { label: 'Bảng kiểm soát bảo mật', href: '/dashboard/security' },
    ],
    note: 'Đồng ký bài SECRET/TOP_SECRET — cần đủ chữ ký Tổng biên tập + Kiểm định bảo mật.',
  },
  {
    key: 'commander',
    role: 'COMMANDER',
    title: 'Chỉ huy Học viện',
    icon: Monitor,
    dashboard: '/dashboard/commander',
    screenshot: '/help/screenshots/commander-dashboard.png',
    summary:
      'Xem báo cáo tổng hợp, giám sát toàn cảnh hoạt động Tạp chí. Vai trò chỉ đọc, không can thiệp nghiệp vụ biên tập.',
    bullets: [
      { label: 'Trung tâm Chỉ huy', href: '/dashboard/commander' },
      { label: 'Báo cáo Điều hành', href: '/dashboard/commander/report' },
      { label: 'Báo cáo công bố (tổng hợp)', href: '/dashboard/reports/publications' },
    ],
  },
  {
    key: 'sysadmin',
    role: 'SYSADMIN',
    title: 'Quản trị hệ thống',
    icon: Settings,
    dashboard: '/dashboard/admin',
    summary:
      'Toàn quyền kỹ thuật & vận hành: người dùng, phân quyền RBAC, tích hợp, cấu hình, bảo mật. Vai trò duy nhất gán được vai trò cấp cao.',
    bullets: [
      { label: 'Tất cả Người dùng', href: '/dashboard/admin/users' },
      { label: 'Phân quyền RBAC', href: '/dashboard/admin/permissions' },
      { label: 'Cài đặt Website', href: '/dashboard/admin/cms/settings' },
      { label: 'Tích hợp & hệ thống', href: '/dashboard/admin/integrations' },
    ],
  },
]

export default async function HelpCenterPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const myRole = session.role
  const featured = GUIDES.find(g => g.role === myRole)
  const others = GUIDES.filter(g => g.role !== myRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-emerald-700" />
          Trung tâm Hướng dẫn
        </h1>
        <p className="text-muted-foreground mt-1">
          Hướng dẫn sử dụng hệ thống tạp chí điện tử theo từng vai trò. Xin chào, {session.fullName}.
        </p>
      </div>

      {/* Featured: guide cho vai trò hiện tại */}
      {featured && (
        <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <featured.icon className="h-5 w-5 text-emerald-700" />
              <CardTitle>Hướng dẫn cho bạn — {featured.title}</CardTitle>
              <Badge className="bg-emerald-700">Vai trò hiện tại</Badge>
            </div>
            <CardDescription className="mt-1">{featured.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            {featured.screenshot ? (
              <div className="rounded-lg border overflow-hidden">
                <Image
                  src={featured.screenshot}
                  alt={`Bảng điều khiển ${featured.title}`}
                  width={1440}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/40 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Mở bảng điều khiển để xem giao diện trực tiếp.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Truy cập nhanh các chức năng chính:</p>
              {featured.bullets.map(b => (
                <Button key={b.href} asChild variant="outline" className="w-full justify-between">
                  <Link href={b.href}>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {b.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
              {featured.note && (
                <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">⚠️ {featured.note}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Các vai trò lãnh đạo khác */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {featured ? 'Các vai trò lãnh đạo khác' : 'Hướng dẫn theo vai trò lãnh đạo'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {others.map(g => (
            <Card key={g.key} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <g.icon className="h-5 w-5 text-emerald-700" />
                  {g.title}
                </CardTitle>
                <CardDescription>{g.summary}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" className="w-full">
                  <Link href={g.dashboard}>
                    Mở bảng điều khiển <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tài liệu đầy đủ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tài liệu đầy đủ (để in / phát hành)</CardTitle>
          <CardDescription>
            Bản chi tiết từng bước (kèm ảnh minh họa) được phát hành dạng Word (.docx) trong thư mục
            <code className="mx-1 px-1 rounded bg-muted">docs/huong-dan/</code>:
            <code className="mx-1">tong-bien-tap.docx</code>,
            <code className="mx-1">pho-tong-bien-tap.docx</code>,
            <code className="mx-1">thu-ky-toa-soan.docx</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
