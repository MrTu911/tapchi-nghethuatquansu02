import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Home,
  Newspaper,
  Menu as MenuIcon,
  Settings,
  Image as ImageIcon,
  Video,
  Headphones,
  FileText,
  CheckCircle2,
  Clock,
  PanelsTopLeft,
  Link2,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Trung tâm CMS — màn hình tổng quan, là điểm vào thống nhất cho mọi công cụ
 * quản lý nội dung trang public (trang, menu, trang chủ, cấu hình, media).
 */
export default async function CmsHubPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!can.admin(session.role as Role)) redirect("/dashboard");

  const [
    totalPages,
    publishedPages,
    navItems,
    homepageSections,
    sliders,
    newsCount,
  ] = await Promise.all([
    prisma.publicPage.count(),
    prisma.publicPage.count({ where: { isPublished: true } }),
    prisma.navigationItem.count(),
    prisma.homepageSection.count(),
    prisma.banner.count({ where: { targetRole: "HOME_SLIDER" } }),
    prisma.news.count().catch(() => 0),
  ]);
  const draftPages = totalPages - publishedPages;

  const stats = [
    { label: "Tổng số trang", value: totalPages, icon: FileText, accent: "text-emerald-700" },
    { label: "Đã xuất bản", value: publishedPages, icon: CheckCircle2, accent: "text-emerald-600" },
    { label: "Bản nháp", value: draftPages, icon: Clock, accent: "text-amber-600" },
    { label: "Mục menu", value: navItems, icon: MenuIcon, accent: "text-blue-600" },
    { label: "Khối trang chủ", value: homepageSections, icon: LayoutGrid, accent: "text-purple-600" },
    { label: "Slider", value: sliders, icon: ImageIcon, accent: "text-rose-600" },
  ];

  const groups: {
    title: string;
    description: string;
    cards: {
      label: string;
      description: string;
      href: string;
      icon: typeof Globe;
      badge?: string;
    }[];
  }[] = [
    {
      title: "Nội dung",
      description: "Trang tĩnh, khối trang chủ và tin tức của website",
      cards: [
        {
          label: "Trang công khai",
          description: "Giới thiệu, liên hệ, hướng dẫn, chính sách... Soạn thảo, xem trước & lịch sử phiên bản.",
          href: "/dashboard/admin/cms/pages",
          icon: Globe,
          badge: `${totalPages} trang`,
        },
        {
          label: "Khối trang chủ",
          description: "Sắp xếp hero, bài nổi bật, số mới, thống kê... hiển thị trên trang chủ.",
          href: "/dashboard/admin/cms/homepage",
          icon: Home,
          badge: `${homepageSections} khối`,
        },
        {
          label: "Tin tức",
          description: "Bài viết tin tức, thông báo và sự kiện của tòa soạn.",
          href: "/dashboard/admin/news",
          icon: Newspaper,
          badge: `${newsCount} bài`,
        },
      ],
    },
    {
      title: "Điều hướng & Thương hiệu",
      description: "Menu, chân trang và liên kết ngoài",
      cards: [
        {
          label: "Menu điều hướng",
          description: "Thêm/sắp xếp mục menu trên thanh điều hướng (kéo-thả, song ngữ).",
          href: "/dashboard/admin/cms/navigation",
          icon: MenuIcon,
          badge: `${navItems} mục`,
        },
        {
          label: "Chân trang & Header",
          description: "Tên tạp chí, ISSN, giấy phép, địa chỉ, SĐT, email, chuyên mục, mạng xã hội, banner.",
          href: "/dashboard/admin/cms/settings?tab=footer",
          icon: PanelsTopLeft,
        },
        {
          label: "Liên kết ngoài",
          description: "Các đường dẫn tới trang đối tác/liên quan hiển thị ở chân trang.",
          href: "/dashboard/admin/cms/settings?tab=external_links",
          icon: Link2,
        },
      ],
    },
    {
      title: "Cấu hình",
      description: "Thiết lập chung của website",
      cards: [
        {
          label: "Cài đặt Website",
          description: "Thông tin chung, liên hệ, mạng xã hội, SEO, giao diện và chân trang.",
          href: "/dashboard/admin/cms/settings",
          icon: Settings,
        },
      ],
    },
    {
      title: "Media",
      description: "Hình ảnh, slider và đa phương tiện",
      cards: [
        {
          label: "Thư viện Media",
          description: "Quản lý hình ảnh dùng chung cho bài viết và trang.",
          href: "/dashboard/admin/cms/media",
          icon: ImageIcon,
        },
        {
          label: "Banner & Slider",
          description: "Ảnh trình chiếu và banner trên trang chủ.",
          href: "/dashboard/admin/cms/sliders",
          icon: ImageIcon,
          badge: `${sliders} slider`,
        },
        {
          label: "Video",
          description: "Quản lý video của tạp chí.",
          href: "/dashboard/admin/cms/videos",
          icon: Video,
        },
        {
          label: "Podcast",
          description: "Quản lý podcast/âm thanh.",
          href: "/dashboard/admin/cms/podcasts",
          icon: Headphones,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#1E3924] to-[#2d5236] p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#E5C86E]/20 p-2.5">
            <LayoutGrid className="h-6 w-6 text-[#E5C86E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trung tâm quản lý nội dung</h1>
            <p className="mt-0.5 text-sm text-white/80">
              Điểm vào thống nhất để xây dựng và chỉnh sửa các trang công khai của
              Tạp chí Nghệ thuật Quân sự Việt Nam
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-5 w-5 shrink-0 ${s.accent}`} />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Groups */}
      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {group.title}
            </h2>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card) => (
              <Link key={card.href} href={card.href} className="group">
                <Card className="h-full transition-all hover:border-emerald-300 hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <card.icon className="h-5 w-5" />
                      </div>
                      {card.badge && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                      {card.label}
                      <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
