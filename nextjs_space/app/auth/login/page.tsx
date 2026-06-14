'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Loader2,
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  ChevronRight,
  Users,
  Star,
  Zap,
} from 'lucide-react'

type DemoAccount = {
  label: string
  role: string
  email: string
  password: string
  color: string
  icon: string
  description: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Quản trị viên',
    role: 'SYSADMIN',
    email: 'admin@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
    icon: '🛡️',
    description: 'Toàn quyền hệ thống',
  },
  {
    label: 'Tổng Biên Tập',
    role: 'EIC',
    email: 'tongbientap@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
    icon: '👑',
    description: 'Quyết định xuất bản',
  },
  {
    label: 'Phó Tổng Biên Tập',
    role: 'DEPUTY_EIC',
    email: 'photongbientap@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700',
    icon: '🎖️',
    description: 'Giám sát, trình duyệt',
  },
  {
    label: 'Biên Tập Chính',
    role: 'MANAGING_EDITOR',
    email: 'bientapchinh@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    icon: '📋',
    description: 'Quản lý quy trình',
  },
  {
    label: 'Biên Tập Chuyên Mục',
    role: 'SECTION_EDITOR',
    email: 'bientap@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700',
    icon: '✏️',
    description: 'Phân công phản biện',
  },
  {
    label: 'Tác Giả',
    role: 'AUTHOR',
    email: 'tacgia@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700',
    icon: '📝',
    description: 'Nộp & theo dõi bài',
  },
  {
    label: 'Phản Biện',
    role: 'REVIEWER',
    email: 'phanbien@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
    icon: '🔍',
    description: 'Đánh giá bài nộp',
  },
  {
    label: 'Chỉ huy Học viện',
    role: 'COMMANDER',
    email: 'chihuy@tapchintqsvn.edu.vn',
    password: 'TapChi@2025',
    color: 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800',
    icon: '⭐',
    description: 'Giám sát & chỉ đạo',
  },
]

const getRoleDashboard = (role: string) => {
  const roleMap: Record<string, string> = {
    SYSADMIN: '/dashboard/admin',
    EIC: '/dashboard/eic',
    DEPUTY_EIC: '/dashboard/deputy',
    MANAGING_EDITOR: '/dashboard/managing',
    SECTION_EDITOR: '/dashboard/editor',
    EDITOR: '/dashboard/editor',
    REVIEWER: '/dashboard/reviewer',
    AUTHOR: '/dashboard/author',
    SECURITY_AUDITOR: '/dashboard/security',
    LAYOUT_EDITOR: '/dashboard/layout',
    COMMANDER: '/dashboard/commander',
    READER: '/dashboard/author',
  }
  return roleMap[role] || '/dashboard/author'
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [filledFrom, setFilledFrom] = useState<string | null>(null)

  useEffect(() => {
    const reason = searchParams?.get('reason')
    const error = searchParams?.get('error')

    if (reason === 'no_token') {
      toast.info('Vui lòng đăng nhập để tiếp tục')
    } else if (reason === 'invalid_token') {
      toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.')
    } else if (error === 'access_denied') {
      const attempted = searchParams?.get('attempted')
      toast.error(`Bạn không có quyền truy cập vào ${attempted}`)
    }
  }, [searchParams])

  const fillDemoAccount = (account: DemoAccount) => {
    setFormData({ email: account.email, password: account.password })
    setFilledFrom(account.role)
    setShowDemoPanel(false)
    toast.success(`Đã điền tài khoản ${account.label}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại')
      }

      // ✅ Bảo mật 2 lớp: nếu cần xác thực 2FA, chuyển sang trang nhập mã lớp 2
      if (data.data?.requires2FA) {
        const from = searchParams?.get('from')
        const params = new URLSearchParams()
        if (data.data?.method) params.set('method', data.data.method)
        if (from && from.startsWith('/dashboard')) params.set('from', from)
        window.location.href = `/2fa/verify?${params.toString()}`
        return
      }

      toast.success('Đăng nhập thành công!')

      const from = searchParams?.get('from')
      const targetUrl =
        from && from.startsWith('/dashboard')
          ? from
          : getRoleDashboard(data.data?.user?.role)

      window.location.href = targetUrl
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1a3a2a] via-[#1e4d35] to-[#152e22]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-16 w-48 h-48 rounded-full bg-emerald-500/10" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Top */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-300 uppercase tracking-widest">
                  Học viện Quốc phòng
                </div>
                <div className="text-sm font-semibold text-white/90">Tạp chí Khoa học</div>
              </div>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                Tạp chí
                <br />
                <span className="text-emerald-300">Nghệ thuật Quân sự Việt Nam</span>
              </h1>
              <p className="mt-3 text-white/60 text-sm leading-relaxed">
                Hệ thống quản lý biên tập khoa học của Học viện Quốc phòng — Hỗ trợ toàn quy trình từ nộp bài đến xuất bản.
              </p>
            </div>

            {/* Feature badges */}
            <div className="space-y-3">
              {[
                { icon: <Shield className="w-4 h-4" />, text: 'Phản biện kín hai chiều' },
                { icon: <Users className="w-4 h-4" />, text: 'Quản lý vai trò đa cấp' },
                { icon: <Star className="w-4 h-4" />, text: 'Theo dõi tiến độ thời gian thực' },
                { icon: <Zap className="w-4 h-4" />, text: 'Xuất bản số hóa DOI' },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
                    {feat.icon}
                  </div>
                  <span className="text-white/70 text-sm">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="text-white/40 text-xs">
            © 2025 Học viện Quốc phòng · Tạp chí Nghệ thuật Quân sự Việt Nam
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Tạp chí Nghệ thuật Quân sự Việt Nam</span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>
            <p className="mt-1 text-sm text-gray-500">
              Truy cập hệ thống quản lý biên tập
            </p>
          </div>

          {/* Demo accounts toggle */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemoPanel(!showDemoPanel)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>🧪</span>
                <span>Tài khoản demo — click để tự điền</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showDemoPanel ? 'rotate-90' : ''}`}
              />
            </button>

            {showDemoPanel && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => fillDemoAccount(account)}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all text-xs ${account.color}`}
                  >
                    <span className="text-base leading-none mt-0.5">{account.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{account.label}</div>
                      <div className="opacity-70 truncate">{account.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active fill indicator */}
          {filledFrom && !showDemoPanel && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              <span>✅</span>
              <span>
                Đã điền tài khoản{' '}
                <strong>
                  {DEMO_ACCOUNTS.find((a) => a.role === filledFrom)?.label}
                </strong>
                {' '}— nhấn Đăng nhập để vào
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setFilledFrom(null)
                }}
                placeholder="email@example.com"
                className="h-10 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật khẩu
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-10 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-emerald-600 hover:underline font-medium">
                Đăng ký
              </Link>
            </span>
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">
              ← Trang chủ
            </Link>
          </div>

          {/* Password hint for demo panel */}
          {showDemoPanel && (
            <p className="text-center text-xs text-gray-400">
              Mật khẩu chung:{' '}
              <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                TapChi@2025
              </code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
