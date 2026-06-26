
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

interface NavigationItem {
  id: string
  label: string
  labelEn?: string | null
  url: string
  target: string
  isActive: boolean
  children?: NavigationItem[]
}

const fallbackMenuItems: NavigationItem[] = [
  { id: 'home', label: 'TRANG CHỦ', url: '/', target: '_self', isActive: true },
  {
    id: 'about', label: 'GIỚI THIỆU', url: '#', target: '_self', isActive: true,
    children: [
      { id: 'about-journal', label: 'Về Tạp chí', url: '/pages/about', target: '_self', isActive: true },
      { id: 'editorial-board', label: 'Hội đồng biên tập', url: '/pages/editorial-board', target: '_self', isActive: true },
      { id: 'scope', label: 'Phạm vi & Mục tiêu', url: '/pages/scope', target: '_self', isActive: true },
    ],
  },
  {
    id: 'process', label: 'XUẤT BẢN', url: '#', target: '_self', isActive: true,
    children: [
      { id: 'publishing-process', label: 'Quy trình xuất bản', url: '/pages/publishing-process', target: '_self', isActive: true },
      { id: 'author-guidelines', label: 'Hướng dẫn tác giả', url: '/pages/author-guidelines', target: '_self', isActive: true },
      { id: 'review-policy', label: 'Chính sách phản biện', url: '/pages/review-policy', target: '_self', isActive: true },
    ],
  },
  { id: 'latest', label: 'SỐ MỚI NHẤT', url: '/issues/latest', target: '_self', isActive: true },
  { id: 'archive', label: 'LƯU TRỮ', url: '/archive', target: '_self', isActive: true },
  { id: 'library', label: 'THƯ VIỆN', url: '/library', target: '_self', isActive: true },
  { id: 'news', label: 'TIN TỨC', url: '/news', target: '_self', isActive: true },
  { id: 'videos', label: 'VIDEO', url: '/videos', target: '_self', isActive: true },
  { id: 'podcasts', label: 'PODCAST', url: '/podcasts', target: '_self', isActive: true },
  { id: 'submit', label: 'GỬI BÀI', url: '/dashboard/author', target: '_self', isActive: true },
  { id: 'contact', label: 'LIÊN HỆ', url: '/pages/contact', target: '_self', isActive: true },
]

// Ẩn khỏi menu điều hướng (vẫn giữ route + bản ghi DB, chỉ không hiển thị).
const HIDDEN_MENU_IDS = new Set(['videos', 'podcasts'])
const HIDDEN_MENU_URLS = new Set(['/videos', '/podcasts'])

function hideMenuItems(items: NavigationItem[]): NavigationItem[] {
  return items
    .filter((item) => !HIDDEN_MENU_IDS.has(item.id) && !HIDDEN_MENU_URLS.has(item.url))
    .map((item) => (item.children ? { ...item, children: hideMenuItems(item.children) } : item))
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/navigation?isActive=true')
        const data = await res.json()
        if (data.success && data.data && data.data.length > 0) {
          // Inject "THƯ VIỆN" sau "LƯU TRỮ" nếu menu DB chưa có
          const items = [...data.data]
          if (!items.find((i: any) => i.id === 'library' || i.url === '/library')) {
            const libraryItem = {
              id: 'library', label: 'THƯ VIỆN', url: '/library',
              target: '_self', isActive: true,
            }
            const archiveIdx = items.findIndex((i: any) => i.id === 'archive' || i.url === '/archive')
            if (archiveIdx >= 0) {
              items.splice(archiveIdx + 1, 0, libraryItem)
            } else {
              items.push(libraryItem)
            }
          }
          setMenuItems(hideMenuItems(items))
        } else {
          setMenuItems(hideMenuItems(fallbackMenuItems))
        }
      } catch {
        setMenuItems(hideMenuItems(fallbackMenuItems))
      } finally {
        setLoading(false)
      }
    }
    fetchNavigation()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const toggleMobileSubmenu = (id: string) => {
    setOpenMobileSubmenu(prev => prev === id ? null : id)
  }

  return (
    <header className="relative bg-white dark:bg-slate-900 shadow-md transition-colors">
      {/* Banner - Full Width with Responsive Images */}
      <div className="w-full bg-white dark:bg-slate-900 transition-colors">
        <div className="relative w-full max-w-[1280px] mx-auto">
          {/* Mobile Banner — building-less crop, contain để hiện trọn logo + tên */}
          <div className="relative w-full h-[120px] md:hidden">
            <Image
              src="/banner-mobile.png"
              alt="Tạp chí Nghệ thuật Quân sự Việt Nam"
              fill
              className="object-contain object-center"
              priority
              sizes="768px"
            />
          </div>
          {/* Tablet Banner */}
          <div className="relative w-full h-[192px] hidden md:block lg:hidden">
            <Image
              src="/banner-tablet.png"
              alt="Tạp chí Nghệ thuật Quân sự Việt Nam"
              fill
              className="object-cover object-center"
              priority
              sizes="1024px"
            />
          </div>
          {/* PC Banner */}
          <div className="relative w-full h-[240px] hidden lg:block">
            <Image
              src="/banner-pc.png"
              alt="Tạp chí Nghệ thuật Quân sự Việt Nam"
              fill
              className="object-cover object-center"
              priority
              sizes="1280px"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="w-full">
        <div className="w-full max-w-[1280px] mx-auto bg-[#8B1A1A]">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center">
              {loading ? (
                <div className="text-white/60 text-sm px-3">Đang tải...</div>
              ) : (
                menuItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0
                  return (
                    <div key={item.id} className="relative group">
                      {hasChildren ? (
                        /* Item có dropdown */
                        <>
                          <button
                            className="flex items-center gap-1 text-sm font-semibold text-white hover:bg-white/20 transition-colors px-3 py-2 rounded whitespace-nowrap tracking-wide h-14"
                          >
                            {item.label}
                            <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                          </button>
                          {/* Dropdown menu */}
                          <div className="absolute top-full left-0 hidden group-hover:block z-50 min-w-[200px] pt-1">
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                              {item.children!.map(child => (
                                <Link
                                  key={child.id}
                                  href={child.url}
                                  target={child.target}
                                  rel={child.target === '_blank' ? 'noopener noreferrer' : undefined}
                                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#FDF5E6] hover:text-[#8B1A1A] dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Item không có dropdown */
                        <Link
                          href={item.url}
                          target={item.target}
                          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                          className="flex items-center text-sm font-semibold text-white hover:bg-white/20 transition-colors px-3 py-2 rounded whitespace-nowrap tracking-wide h-14"
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Search + Theme */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <Input
                  type="search"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9 rounded-l-md rounded-r-none border-0 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-l-none rounded-r-md bg-white hover:bg-gray-100 text-[#8B1A1A] px-3 border-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="text-white">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/10">
              <div className="space-y-0.5 pt-2">
                {loading ? (
                  <div className="text-white/60 text-sm px-4 py-2">Đang tải...</div>
                ) : (
                  menuItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0
                    const isOpen = openMobileSubmenu === item.id
                    return (
                      <div key={item.id}>
                        {hasChildren ? (
                          <>
                            <button
                              className="w-full flex items-center justify-between text-sm font-semibold text-white hover:bg-white/20 transition-colors px-4 py-2.5 tracking-wide"
                              onClick={() => toggleMobileSubmenu(item.id)}
                            >
                              {item.label}
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                              <div className="bg-[#6B1313] pl-4">
                                {item.children!.map(child => (
                                  <Link
                                    key={child.id}
                                    href={child.url}
                                    target={child.target}
                                    className="block text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors px-4 py-2 border-l-2 border-[#C8960C]/40"
                                    onClick={() => { setIsMenuOpen(false); setOpenMobileSubmenu(null) }}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.url}
                            target={item.target}
                            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                            className="block text-sm font-semibold text-white hover:bg-white/20 transition-colors px-4 py-2.5 tracking-wide"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mt-3 px-4 md:hidden">
                <div className="flex items-center">
                  <Input
                    type="search"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 h-9 rounded-l-md rounded-r-none border-0 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-l-none rounded-r-md bg-white hover:bg-gray-100 text-[#8B1A1A] px-3"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
