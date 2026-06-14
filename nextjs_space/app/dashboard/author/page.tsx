'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  FileText, CheckCircle, Clock, BookOpen, Bell, PlusCircle,
  Loader2, Eye, Download, TrendingUp, Calendar, Star,
  AlertCircle, ChevronRight, BarChart3, Edit3
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#94a3b8', '#fbbf24', '#f97316', '#34d399', '#ef4444', '#ef4444', '#8b5cf6', '#3b82f6']
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; step: number }> = {
  NEW:          { label: 'Bản nháp', color: 'text-slate-500', bg: 'bg-slate-100', step: 1 },
  UNDER_REVIEW: { label: 'Đang phản biện', color: 'text-amber-600', bg: 'bg-amber-100', step: 2 },
  REVISION:     { label: 'Cần chỉnh sửa', color: 'text-orange-600', bg: 'bg-orange-100', step: 3 },
  ACCEPTED:     { label: 'Đã chấp nhận', color: 'text-emerald-600', bg: 'bg-emerald-100', step: 4 },
  IN_PRODUCTION:{ label: 'Đang xuất bản', color: 'text-purple-600', bg: 'bg-purple-100', step: 5 },
  PUBLISHED:    { label: 'Đã xuất bản', color: 'text-emerald-600', bg: 'bg-emerald-100', step: 6 },
  REJECTED:     { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-100', step: 0 },
  DESK_REJECT:  { label: 'Từ chối sơ bộ', color: 'text-red-700', bg: 'bg-red-100', step: 0 },
}

const ROLE_DASHBOARD: Record<string, string> = {
  SECTION_EDITOR: '/dashboard/editor',
  MANAGING_EDITOR: '/dashboard/managing',
  DEPUTY_EIC: '/dashboard/deputy',
  EIC: '/dashboard/eic',
  SYSADMIN: '/dashboard/admin',
  REVIEWER: '/dashboard/reviewer',
  LAYOUT_EDITOR: '/dashboard/layout',
  SECURITY_AUDITOR: '/dashboard/security',
  COMMANDER: '/dashboard/commander',
}

const JOURNEY_STEPS = [
  { key: 'NEW', label: 'Nộp bài', icon: '📝' },
  { key: 'UNDER_REVIEW', label: 'Phản biện', icon: '🔍' },
  { key: 'REVISION', label: 'Chỉnh sửa', icon: '✏️' },
  { key: 'ACCEPTED', label: 'Chấp nhận', icon: '✅' },
  { key: 'IN_PRODUCTION', label: 'Xuất bản', icon: '📰' },
  { key: 'PUBLISHED', label: 'Công bố', icon: '🌐' },
]

export default function AuthorDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [recentArticles, setRecentArticles] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [activeSubmissions, setActiveSubmissions] = useState<any[]>([])
  const [publishedArticles, setPublishedArticles] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [meRes, statsRes, pubRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/author/statistics'),
        fetch('/api/author/published-articles').catch(() => null),
      ])

      const me = await meRes.json()
      if (me?.data?.user) {
        const u = me.data.user
        const redirect = ROLE_DASHBOARD[u.role as string]
        if (redirect) { setIsRedirecting(true); router.replace(redirect); return }
        setUser(u)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setRecentArticles(data.recentSubmissions || [])
        setChartData(data.chartData || [])

        // Build active submissions for journey view
        const allSubs: any[] = data.allSubmissions || data.recentSubmissions || []
        setActiveSubmissions(allSubs.filter((s: any) => !['PUBLISHED', 'REJECTED', 'DESK_REJECT'].includes(s.status)))

        // Category breakdown
        const catMap: Record<string, number> = {}
        for (const s of allSubs) {
          if (s.category) catMap[s.category] = (catMap[s.category] || 0) + 1
        }
        setCategoryData(Object.entries(catMap).map(([name, count]) => ({ name, count })))
      }

      if (pubRes?.ok) {
        const pubData = await pubRes.json()
        setPublishedArticles(pubData.articles || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return { text: 'Chào buổi sáng', icon: '☀️' }
    if (h < 18) return { text: 'Chào buổi chiều', icon: '🌤️' }
    return { text: 'Chào buổi tối', icon: '🌙' }
  }

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  const g = greeting()
  const revisionItems = recentArticles.filter((a: any) => a.status === 'REVISION')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand/5 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 space-y-6">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand to-military-600 bg-clip-text text-transparent">
            {g.icon} {g.text}, {user?.fullName || 'Tác giả'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý bài viết và theo dõi tiến trình xuất bản
          </p>
        </div>
        <div className="flex items-center gap-3">
          {revisionItems.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1.5">
              <AlertCircle className="w-4 h-4 mr-1" />
              {revisionItems.length} bài cần chỉnh sửa
            </Badge>
          )}
          <Button asChild className="bg-gradient-to-r from-brand to-military-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <Link href="/dashboard/author/submit">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tạo bài mới
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="relative" asChild>
            <Link href="/dashboard/author/notifications">
              <Bell className="w-4 h-4" />
              {(stats?.underReview ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {stats.underReview > 9 ? '9+' : stats.underReview}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </motion.header>

      {/* Revision alert */}
      {revisionItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-4">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                Bạn có {revisionItems.length} bài cần chỉnh sửa theo yêu cầu phản biện
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">Hãy kiểm tra và nộp lại sớm để tiếp tục quy trình</p>
            </div>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
              <Link href="/dashboard/author/submissions">Xem ngay</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Tổng bài viết', value: stats?.total || 0, icon: FileText, gradient: 'from-brand to-military-700', bg: 'bg-brand/5', desc: 'Tất cả bài nộp' },
          { title: 'Đang phản biện', value: stats?.underReview || 0, icon: Clock, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Đang được xem xét' },
          { title: 'Đã chấp nhận', value: stats?.accepted || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Được duyệt xuất bản' },
          { title: 'Đã xuất bản', value: stats?.published || 0, icon: BookOpen, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', desc: 'Công khai trên tạp chí' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.02, y: -3 }}>
            <Card className={`${card.bg} border-0 shadow-lg`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                    <p className={`text-3xl font-bold mt-0.5 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>{card.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Submission Journey + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-0 shadow-xl rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand to-military-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Phân bố trạng thái bài viết</CardTitle>
                  <CardDescription>Tổng quan danh mục bài của bạn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {chartData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={50} paddingAngle={3}
                        label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {stats && (
                    <div className="w-full grid grid-cols-3 gap-3 mt-2">
                      {[
                        { label: 'Tỷ lệ chấp nhận', value: `${stats.acceptanceRate}%`, color: 'text-emerald-600' },
                        { label: 'Phản biện nhận được', value: stats.totalReviews, color: 'text-brand' },
                        { label: 'Đang xuất bản', value: stats.inProduction || 0, color: 'text-purple-600' },
                      ].map((m, i) => (
                        <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                          <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-center">
                  <div>
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-muted-foreground">Chưa có dữ liệu bài viết</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-gradient-to-br from-brand/5 to-gold/10 dark:from-slate-800 dark:to-slate-800/70 border-0 shadow-xl rounded-2xl h-full">
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/dashboard/author/articles', icon: FileText, label: 'Bài viết của tôi' },
                { href: '/dashboard/author/submissions', icon: Clock, label: 'Tiến trình phản biện' },
                { href: '/dashboard/author/submit', icon: PlusCircle, label: 'Nộp bài mới' },
                { href: '/dashboard/author/settings', icon: Edit3, label: 'Cài đặt cá nhân' },
              ].map(({ href, icon: Icon, label }) => (
                <Button key={href} asChild variant="outline" className="w-full justify-start hover:bg-white dark:hover:bg-slate-700 transition-all">
                  <Link href={href}>
                    <Icon className="w-4 h-4 mr-2 text-brand" />
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active submissions journey */}
      {activeSubmissions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Hành trình bài viết đang xử lý</CardTitle>
                  <CardDescription>Theo dõi tiến độ từng bài đang trong quy trình</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-5">
                {activeSubmissions.slice(0, 4).map((s: any) => {
                  const statusInfo = STATUS_MAP[s.status] || { label: s.status, color: 'text-slate-500', bg: 'bg-slate-100', step: 0 }
                  const currentStep = statusInfo.step
                  return (
                    <div key={s.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-1">{s.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{s.id?.slice(0, 8) || ''} · {s.category || 'Chưa phân loại'}</p>
                        </div>
                        <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0 flex-shrink-0 text-xs`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {/* Journey steps */}
                      <div className="flex items-center gap-1">
                        {JOURNEY_STEPS.map((step, i) => {
                          const done = currentStep > i + 1
                          const active = currentStep === i + 1
                          return (
                            <div key={i} className="flex items-center flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0
                                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-brand text-white ring-2 ring-brand/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                                title={step.label}
                              >
                                {done ? '✓' : i + 1}
                              </div>
                              {i < JOURNEY_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-400">
                          {JOURNEY_STEPS[Math.max(0, currentStep - 1)]?.label} → {JOURNEY_STEPS[Math.min(JOURNEY_STEPS.length - 1, currentStep)]?.label}
                        </p>
                        <Button asChild variant="ghost" size="sm" className="h-6 text-xs text-brand px-2">
                          <Link href={`/dashboard/author/articles/${s.id}`}>
                            Chi tiết <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent articles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-brand to-military-600">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Bài viết gần đây</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/author/articles">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {recentArticles.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                <p className="font-medium text-slate-500 mb-2">Chưa có bài viết nào</p>
                <p className="text-sm text-muted-foreground mb-5">Bắt đầu hành trình xuất bản của bạn ngay hôm nay</p>
                <Button asChild className="bg-gradient-to-r from-brand to-military-700">
                  <Link href="/dashboard/author/submit">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Tạo bài viết đầu tiên
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article: any) => {
                  const statusInfo = STATUS_MAP[article.status] || { label: article.status, color: 'text-slate-500', bg: 'bg-slate-100' }
                  return (
                    <motion.div
                      key={article.id}
                      whileHover={{ scale: 1.005, x: 3 }}
                      className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">{article.title}</h3>
                            <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0 text-xs flex-shrink-0`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                            {article.category && (
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">{article.category}</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/author/articles/${article.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
