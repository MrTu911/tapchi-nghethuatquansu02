'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Home, FileText, Upload, CheckSquare, Users, Settings,
  BarChart3, FileCheck, Shield, BookOpen, Layout as LayoutIcon,
  FolderTree, Workflow, Plug, FileEdit, UserCheck, AlertTriangle,
  FileLock, Newspaper, Image as ImageIcon, Globe, Activity,
  TrendingUp, Clock, Menu, ChevronDown, ChevronRight, X, Bell,
  User, Palette, FileBarChart, Video, MessageSquare, Tags, Layers,
  Send, Inbox, Eye, MessagesSquare, BookText, Award, ClipboardList,
  Search, Archive, Database, GitBranch, Package, Headphones,
  ShieldCheck, History, BookMarked, FileSearch,
  Star, FlaskConical, Library, Globe2, Command
} from 'lucide-react'
import { can } from '@/lib/rbac'

interface SidebarProps {
  role: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface MenuItem {
  label: string
  icon: any
  href: string
  roles: string[]
  section?: string
  badge?: string
  description?: string
  /** Permission code required. If set, MANAGING_EDITOR must have this permission granted. */
  permission?: string
}

interface MenuSection {
  id: string
  label: string
  icon: any
  items: MenuItem[]
  defaultOpen?: boolean
  roles?: string[]
  description?: string
}

export default function DashboardSidebar({ role, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>([])

  /**
   * Dynamic permissions for MANAGING_EDITOR.
   * - null  → still loading (show items that don't require a permission)
   * - Set   → loaded; apply permission filter
   * For SYSADMIN / EIC we skip this check entirely (undefined signals "no check").
   */
  const [userPermissions, setUserPermissions] = useState<Set<string> | null | undefined>(
    role === 'MANAGING_EDITOR' ? null : undefined
  )

  // Fetch dynamic permissions whenever the role is MANAGING_EDITOR
  useEffect(() => {
    if (role !== 'MANAGING_EDITOR') {
      setUserPermissions(undefined)
      return
    }

    fetch('/api/permissions/me')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.permissions)) {
          setUserPermissions(new Set<string>(data.permissions))
        } else {
          // Fallback: no restriction if API fails
          setUserPermissions(new Set<string>())
        }
      })
      .catch(() => {
        // Fallback on network error
        setUserPermissions(new Set<string>())
      })
  // Re-fetch when navigating so changes made by admin take effect quickly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, pathname])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed-sections')
    if (saved) {
      try {
        const collapsed = JSON.parse(saved)
        const allSections = ['overview', 'commander', 'author', 'reviewer', 'editorial', 'production', 'repository', 'content', 'users', 'cms', 'webcrawler', 'system', 'security']
        setOpenSections(allSections.filter(s => !collapsed.includes(s)))
      } catch {
        setOpenSections(['overview'])
      }
    } else {
      setOpenSections(['overview'])
    }
  }, [])

  // Auto-open the section that contains the current path
  useEffect(() => {
    if (!pathname) return
    const sections = getMenuSections()
    sections.forEach(section => {
      if (section.items.some(item => pathname.startsWith(item.href))) {
        setOpenSections(prev => prev.includes(section.id) ? prev : [...prev, section.id])
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
      const allSections = ['overview', 'commander', 'author', 'reviewer', 'editorial', 'production', 'repository', 'content', 'users', 'cms', 'webcrawler', 'system', 'security']
      localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(allSections.filter(s => !next.includes(s))))
      return next
    })
  }

  const getRolePath = (role: string) => {
    const pathMap: Record<string, string> = {
      AUTHOR: 'author', REVIEWER: 'reviewer', SECTION_EDITOR: 'editor',
      MANAGING_EDITOR: 'managing', DEPUTY_EIC: 'deputy', EIC: 'eic', LAYOUT_EDITOR: 'layout',
      SYSADMIN: 'admin', SECURITY_AUDITOR: 'security'
    }
    return pathMap[role] || 'author'
  }

  /**
   * Returns true if the menu item should be visible given the current user's permissions.
   *
   * Rules:
   * - SYSADMIN / EIC (userPermissions === undefined): always visible.
   * - MANAGING_EDITOR, permissions loading (userPermissions === null): show items without a required permission only.
   * - MANAGING_EDITOR, permissions loaded (userPermissions is a Set):
   *   - If no permissions are seeded yet (empty set & item requires permission): fall back to showing all
   *     so the user isn't accidentally locked out before setup.
   *   - Otherwise: show only if item has no permission requirement OR permission is granted.
   */
  const isItemVisible = (item: MenuItem): boolean => {
    if (userPermissions === undefined) return true
    if (!item.permission) return true
    if (userPermissions === null) return false // still loading
    // If DB has no permissions configured at all → fall back to static RBAC (show all)
    if (userPermissions.size === 0) return true
    return userPermissions.has(item.permission)
  }

  const getMenuSections = (): MenuSection[] => {
    const sections: MenuSection[] = []
    const isAdmin = can.admin(role as any)

    sections.push({
      id: 'overview', label: 'Tổng quan', icon: Home,
      items: [
        { label: 'Bảng điều khiển', icon: Home, href: `/dashboard/${getRolePath(role)}`, roles: ['ALL'] },
        { label: 'Trang chủ công khai', icon: Globe, href: '/', roles: ['ALL'] },
        { label: 'Thông báo', icon: Bell, href: '/dashboard/notifications', roles: ['ALL'] },
        { label: 'Tin nhắn', icon: MessageSquare, href: '/dashboard/messages', roles: ['ALL'] },
        { label: 'Hồ sơ cá nhân', icon: User, href: '/dashboard/profile', roles: ['ALL'] },
        { label: 'Hướng dẫn sử dụng', icon: BookOpen, href: '/dashboard/help', roles: ['ALL'] },
      ]
    })

    // Commander Center — chỉ COMMANDER và SYSADMIN
    if (role === 'COMMANDER' || role === 'SYSADMIN') {
      sections.push({
        id: 'commander', label: 'Trung Tâm Chỉ Huy', icon: Command,
        defaultOpen: true,
        items: [
          { label: 'Tổng quan Học viện', icon: BarChart3, href: '/dashboard/commander', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Xu hướng & Dự báo', icon: TrendingUp, href: '/dashboard/commander?tab=trend', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Lĩnh vực Nghiên cứu', icon: FlaskConical, href: '/dashboard/commander?tab=research', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Hệ sinh thái Tác giả', icon: Globe2, href: '/dashboard/commander?tab=ecosystem', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Chất lượng & Bảo mật', icon: Star, href: '/dashboard/commander?tab=quality', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Kho học liệu', icon: Library, href: '/dashboard/commander?tab=library', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Báo cáo Điều hành', icon: FileBarChart, href: '/dashboard/commander/report', roles: ['COMMANDER', 'SYSADMIN'] },
          { label: 'Báo cáo công bố (tổng hợp)', icon: FileBarChart, href: '/dashboard/reports/publications', roles: ['COMMANDER', 'SYSADMIN'] },
        ]
      })
    }

    // Mọi vai trò đều có thể nộp bài (một người có thể vừa là phản biện, vừa là tác giả)
    const ALL_ROLES = ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN', 'COMMANDER', 'SECURITY_AUDITOR']
    sections.push({
      id: 'author', label: '1. Nộp Bài', icon: Send,
      items: [
        { label: 'Nộp bài mới', icon: Upload, href: '/dashboard/author/submit', roles: ALL_ROLES },
        { label: 'Bài đã nộp của tôi', icon: FileText, href: '/dashboard/author/submissions', roles: ALL_ROLES },
        { label: 'Báo cáo công bố của tôi', icon: FileBarChart, href: '/dashboard/reports/publications?mode=author', roles: ALL_ROLES },
      ]
    })

    if (can.review(role as any) || isAdmin) {
      sections.push({
        id: 'reviewer', label: '3. Phản Biện', icon: CheckSquare,
        items: [
          { label: 'Bài cần phản biện', icon: ClipboardList, href: '/dashboard/reviewer/assignments', roles: ['REVIEWER', 'SYSADMIN'], permission: 'reviews.submit' },
          { label: 'Lịch sử phản biện', icon: FileCheck, href: '/dashboard/reviewer/history', roles: ['REVIEWER', 'SYSADMIN'], permission: 'reviews.view' },
        ]
      })
    }

    if (can.decide(role as any) || isAdmin) {
      sections.push({
        id: 'editorial', label: '2/4. Biên Tập', icon: FileEdit,
        items: [
          { label: 'Bài cần xử lý', icon: Inbox, href: '/dashboard/editor/submissions', roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'], permission: 'decisions.make' },
          { label: 'Phân công biên tập', icon: UserCheck, href: '/dashboard/managing/assignments', roles: ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'] },
          { label: 'Gán phản biện', icon: UserCheck, href: '/dashboard/editor/assign-reviewers', roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'], permission: 'reviews.assign' },
          { label: 'Quy trình & Deadline', icon: Clock, href: '/dashboard/editor/workflow', roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'], permission: 'workflow.manage' },
        ]
      })
    }

    // Section "Kiểm tra trùng lặp & Đạo văn" — tên rõ ràng, đúng chức năng
    // REVIEWER chỉ thấy kiểm tra trùng lặp (hỗ trợ phản biện)
    // Editor/admin thấy cả hai công cụ
    if (role === 'REVIEWER') {
      sections.push({
        id: 'plagiarism', label: 'Kiểm tra Trùng lặp', icon: ShieldCheck,
        items: [
          { label: 'Kiểm tra trùng lặp', icon: ShieldCheck, href: '/dashboard/repository/duplicate-check', roles: ['REVIEWER'] },
        ]
      })
    }

    if (can.decide(role as any) || can.layout(role as any) || isAdmin) {
      sections.push({
        id: 'plagiarism', label: 'Kiểm tra Trùng lặp & Đạo văn', icon: FileSearch,
        items: [
          { label: 'Kiểm tra Đạo văn', icon: FileSearch, href: '/dashboard/plagiarism', roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN'] },
          { label: 'Kiểm tra trùng lặp', icon: ShieldCheck, href: '/dashboard/repository/duplicate-check', roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN'] },
        ]
      })
    }

    if (can.layout(role as any) || isAdmin) {
      sections.push({
        id: 'production', label: '5. Sản Xuất', icon: LayoutIcon,
        items: [
          { label: 'Hàng đợi Sản xuất', icon: Package, href: '/dashboard/layout/production', roles: ['LAYOUT_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'], permission: 'layout.manage' },
        ]
      })
    }

    if (isAdmin || can.decide(role as any)) {
      sections.push({
        id: 'repository', label: '6. Kho Bài Báo', icon: Archive,
        items: [
          { label: 'CSDL Báo chí', icon: Database, href: '/dashboard/repository', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'articles.view' },
          { label: 'Số hóa số báo cũ', icon: Upload, href: '/dashboard/repository/ingest', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'LAYOUT_EDITOR'] },
          { label: 'Bài báo lịch sử', icon: History, href: '/dashboard/repository/press-archive', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'articles.view' },
          { label: 'Tất cả Bài báo', icon: BookMarked, href: '/dashboard/admin/articles', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'articles.view' },
          { label: 'Báo cáo công bố', icon: FileBarChart, href: '/dashboard/reports/publications', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'articles.view' },
          { label: 'Tìm kiếm Nâng cao', icon: Search, href: '/search/advanced', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'articles.view' },
        ]
      })
    }

    if (isAdmin) {
      sections.push({
        id: 'content', label: 'Quản lý Nội dung', icon: BookOpen,
        items: [
          { label: 'Số Tạp chí', icon: BookOpen, href: '/dashboard/admin/issues', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'issues.manage' },
          { label: 'Tập (Volumes)', icon: Layers, href: '/dashboard/admin/volumes', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'volumes.manage' },
          { label: 'Chuyên mục', icon: FolderTree, href: '/dashboard/admin/categories', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'system.categories' },
          { label: 'Từ khóa', icon: Tags, href: '/dashboard/admin/keywords', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'keywords.manage' },
          { label: 'Metadata & Xuất bản', icon: FileCheck, href: '/dashboard/admin/metadata', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'metadata.manage' },
        ]
      })

      sections.push({
        id: 'users', label: 'Quản lý Người dùng', icon: Users,
        items: [
          { label: 'Tất cả Người dùng', icon: Users, href: '/dashboard/admin/users', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'users.view' },
          { label: 'Phản biện viên', icon: Award, href: '/dashboard/admin/reviewers', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'reviewers.manage' },
          { label: 'Quyền (RBAC)', icon: Shield, href: '/dashboard/admin/permissions', roles: ['SYSADMIN', 'EIC'], permission: 'permissions.manage' },
          { label: 'Phiên đăng nhập', icon: Activity, href: '/dashboard/admin/sessions', roles: ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'], permission: 'security.sessions' },
        ]
      })

      sections.push({
        id: 'cms', label: 'CMS & Website', icon: Globe,
        items: [
          { label: 'Trang chủ', icon: Home, href: '/dashboard/admin/cms/homepage', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR'], permission: 'cms.homepage.manage' },
          { label: 'Trang công khai', icon: Globe, href: '/dashboard/admin/cms/pages', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'cms.pages.manage' },
          { label: 'Tin tức', icon: Newspaper, href: '/dashboard/admin/news', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'cms.news.manage' },
          { label: 'Thông báo & Sự kiện', icon: Bell, href: '/dashboard/admin/announcements', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'cms.news.manage' },
          { label: 'Banner & Slider', icon: ImageIcon, href: '/dashboard/admin/banners', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'cms.banners.manage' },
          { label: 'Thư viện Media', icon: ImageIcon, href: '/dashboard/admin/cms/media', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'cms.media.manage' },
          { label: 'Video', icon: Video, href: '/dashboard/admin/cms/videos', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'cms.videos.manage' },
          { label: 'Podcast', icon: Headphones, href: '/dashboard/admin/cms/podcasts', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'], permission: 'cms.podcasts.manage' },
          { label: 'Menu điều hướng', icon: Menu, href: '/dashboard/admin/cms/navigation', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'cms.navigation.manage' },
          { label: 'Cài đặt Website', icon: Settings, href: '/dashboard/admin/cms/settings', roles: ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC'], permission: 'system.settings' },
        ]
      })

      sections.push({
        id: 'system', label: 'Hệ thống & Phân tích', icon: Activity,
        items: [
          { label: 'Thống kê Tổng quan', icon: BarChart3, href: '/dashboard/admin/statistics', roles: ['SYSADMIN', 'EIC'], permission: 'statistics.view' },
          { label: 'Phân tích Chi tiết', icon: TrendingUp, href: '/dashboard/admin/analytics', roles: ['SYSADMIN', 'EIC'], permission: 'analytics.view' },
          { label: 'Báo cáo & Export', icon: FileBarChart, href: '/dashboard/admin/reports', roles: ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'], permission: 'reports.view' },
          { label: 'Quy trình Workflow', icon: Workflow, href: '/dashboard/admin/workflow', roles: ['SYSADMIN'], permission: 'workflow.manage' },
          { label: 'Cài đặt Phản biện', icon: CheckSquare, href: '/dashboard/admin/review-settings', roles: ['SYSADMIN', 'EIC'], permission: 'review.settings' },
          { label: 'Tích hợp', icon: Plug, href: '/dashboard/admin/integrations', roles: ['SYSADMIN'], permission: 'system.integrations' },
          { label: 'Giao diện & Theme', icon: Palette, href: '/dashboard/admin/ui-config', roles: ['SYSADMIN'], permission: 'ui.config' },
        ]
      })

      sections.push({
        id: 'security', label: 'Bảo mật & Audit', icon: Shield,
        items: [
          { label: 'Cảnh báo Bảo mật', icon: AlertTriangle, href: '/dashboard/admin/security-alerts', roles: ['SYSADMIN', 'SECURITY_AUDITOR'], permission: 'security.alerts' },
          { label: 'Nhật ký Bảo mật', icon: FileLock, href: '/dashboard/admin/security-logs', roles: ['SYSADMIN', 'EIC', 'SECURITY_AUDITOR'], permission: 'security.logs' },
          { label: 'Nhật ký Kiểm toán', icon: FileBarChart, href: '/dashboard/admin/audit-logs', roles: ['SYSADMIN', 'EIC', 'SECURITY_AUDITOR'], permission: 'security.logs' },
        ]
      })
    }

    // Web Crawler — hiển thị cho mọi role có quyền crawl (kể cả non-admin editors)
    const CRAWLER_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']
    if (CRAWLER_ROLES.includes(role)) {
      sections.push({
        id: 'webcrawler', label: 'Web Crawler', icon: Globe2,
        items: [
          {
            label: 'Nguồn Web Crawl',
            icon: Globe2,
            href: '/dashboard/admin/web-sources',
            roles: CRAWLER_ROLES,
            permission: 'cms.webcrawler.manage',
          },
          {
            label: 'Nội dung đã Crawl',
            icon: FileSearch,
            href: '/dashboard/admin/crawled-content',
            roles: CRAWLER_ROLES,
            permission: 'cms.webcrawler.review',
          },
        ]
      })
    }

    if (can.securityAudit(role as any) && !isAdmin) {
      sections.push({
        id: 'security', label: 'Bảo mật', icon: Shield,
        items: [
          { label: 'Bảng kiểm soát bảo mật', icon: Shield, href: '/dashboard/security', roles: ['SECURITY_AUDITOR'] },
        ]
      })
    }

    return sections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        // 1. Static role filter (existing behavior)
        (item.roles.includes('ALL') || item.roles.includes(role)) &&
        // 2. Dynamic permission filter (only active for MANAGING_EDITOR)
        isItemVisible(item)
      )
    })).filter(section => section.items.length > 0)
  }

  const menuSections = getMenuSections()

  const toggleAllSections = () => {
    const allIds = menuSections.map(s => s.id)
    if (openSections.length === allIds.length) {
      setOpenSections([])
      localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(allIds))
    } else {
      setOpenSections(allIds)
      localStorage.setItem('sidebar-collapsed-sections', JSON.stringify([]))
    }
  }

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      SYSADMIN: 'Quản trị viên', EIC: 'Tổng biên tập',
      DEPUTY_EIC: 'Phó Tổng biên tập',
      MANAGING_EDITOR: 'Thư ký tòa soạn', SECTION_EDITOR: 'Biên tập viên',
      REVIEWER: 'Phản biện', AUTHOR: 'Tác giả',
      LAYOUT_EDITOR: 'Biên tập bố cục', SECURITY_AUDITOR: 'Kiểm định bảo mật',
      COMMANDER: 'Chỉ huy Học viện',
    }
    return map[role] || 'Dashboard'
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-military-700/30 bg-gradient-to-br from-military-900 via-military-800 to-military-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <BookText className="h-6 w-6 text-military-900" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Tạp chí NTQS</h2>
              <p className="text-[10px] text-military-300 font-medium">Dashboard v2.1</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleAllSections}
              className="p-1.5 rounded-lg hover:bg-military-700/50 transition-colors group"
              title={openSections.length === menuSections.length ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            >
              {openSections.length === menuSections.length ? (
                <ChevronDown className="h-4 w-4 text-military-400 group-hover:text-white" />
              ) : (
                <ChevronRight className="h-4 w-4 text-military-400 group-hover:text-white" />
              )}
            </button>
            {/* Close button — visible on any screen size when used as overlay */}
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg hover:bg-military-700/50 transition-colors lg:hidden"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5 text-military-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-military-700 scrollbar-track-military-900"
        aria-label="Điều hướng dashboard"
      >
        <div className="space-y-3">
          {menuSections.map((section) => {
            const SectionIcon = section.icon
            const isOpen = openSections.includes(section.id)
            const hasMultipleItems = section.items.length > 1

            return (
              <div key={section.id} className="space-y-1">
                {hasMultipleItems ? (
                  <>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-military-700/40 transition-all duration-200 group"
                    >
                      <SectionIcon className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="flex-1 text-left text-xs font-bold text-military-200 uppercase tracking-wider group-hover:text-white">
                        {section.label}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-military-400 shrink-0 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-military-400 shrink-0 transition-transform duration-200" />
                      )}
                    </button>

                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-200 ease-in-out',
                        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="ml-3 space-y-0.5 border-l-2 border-military-700/50 pl-2 pb-1">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={onMobileClose}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
                                isActive
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-military-900 shadow-lg shadow-amber-500/30 font-semibold'
                                  : 'text-military-300 hover:bg-military-700/40 hover:text-white'
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1">{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-military-900 shadow-lg shadow-amber-500/30 font-semibold'
                            : 'text-military-300 hover:bg-military-700/40 hover:text-white'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{section.label}</span>
                      </Link>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-military-700/30 bg-gradient-to-br from-military-900 via-military-800 to-military-900">
        <div className="flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <span className="text-military-900 font-bold text-sm">
              {role === 'SYSADMIN' ? 'AD' : role === 'EIC' ? 'TB' : role.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{getRoleLabel(role)}</p>
            <p className="text-[10px] text-military-300">Phiên bản 2.0.0</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-military-700/50 bg-gradient-to-b from-military-900 via-military-800 to-military-900 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* ── Mobile / tablet overlay sidebar ──────────────────────────────── */}
      {/* Backdrop — fade transition */}
      <div
        aria-hidden={!isMobileOpen}
        onClick={onMobileClose}
        className={cn(
          'lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />
      {/* Drawer — slide-in transition */}
      <aside
        id="dashboard-sidebar"
        aria-label="Menu điều hướng"
        aria-hidden={!isMobileOpen}
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col',
          'border-r border-military-700/50 bg-gradient-to-b from-military-900 via-military-800 to-military-900 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out will-change-transform',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
