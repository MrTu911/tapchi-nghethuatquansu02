'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, RefreshCw, Loader2, LayoutDashboard, TrendingUp,
  FlaskConical, Globe2, Star, Library, AlertTriangle,
  Calendar, FileBarChart, ChevronDown
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { CommanderData, DateRangeOption } from './components/types'
import OverviewTab from './components/OverviewTab'
import TrendForecastTab from './components/TrendForecastTab'
import ResearchFieldsTab from './components/ResearchFieldsTab'
import EcosystemTab from './components/EcosystemTab'
import QualityTab from './components/QualityTab'
import DigitalLibraryTab from './components/DigitalLibraryTab'

// Roles that do NOT belong on the Commander dashboard — redirect them home.
// SYSADMIN and COMMANDER are intentionally excluded: both are allowed here.
const ROLE_DASHBOARDS: Record<string, string> = {
  AUTHOR: '/dashboard/author',
  REVIEWER: '/dashboard/reviewer',
  SECTION_EDITOR: '/dashboard/editor',
  MANAGING_EDITOR: '/dashboard/managing',
  EIC: '/dashboard/eic',
  LAYOUT_EDITOR: '/dashboard/layout',
  SECURITY_AUDITOR: '/dashboard/security',
}

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  30: '30 ngày qua',
  90: '90 ngày qua',
  180: '6 tháng qua',
  365: '1 năm qua',
}

const TABS = [
  { value: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { value: 'trend', label: 'Xu hướng & Dự báo', icon: TrendingUp },
  { value: 'research', label: 'Lĩnh vực NC', icon: FlaskConical },
  { value: 'ecosystem', label: 'Hệ sinh thái', icon: Globe2 },
  { value: 'quality', label: 'Chất lượng', icon: Star },
  { value: 'library', label: 'Kho học liệu', icon: Library },
]

export default function CommanderDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<CommanderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Chỉ huy')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeOption>(365)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview')
  const dateRangeRef = useRef<DateRangeOption>(dateRange)

  const fetchData = useCallback(async (days?: DateRangeOption) => {
    const effectiveDays = days ?? dateRangeRef.current
    setLoading(true)
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/statistics/commander?days=${effectiveDays}`),
      ])

      const me = await meRes.json()
      if (me?.data?.user) {
        const u = me.data.user
        if (ROLE_DASHBOARDS[u.role]) {
          router.replace(ROLE_DASHBOARDS[u.role])
          return
        }
        setUserName(u.fullName || 'Chỉ huy')
      }

      if (statsRes.ok) {
        const json = await statsRes.json()
        if (json.success) {
          setData(json.data)
          setLastUpdated(new Date())
        }
      }
    } catch (e) {
      console.error('[CommanderDashboard]', e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDateRangeChange = (days: DateRangeOption) => {
    dateRangeRef.current = days
    setDateRange(days)
    fetchData(days)
  }

  const hasAlerts = data && (data.overview.overdueCount > 0 || data.qualityMetrics.avgPlagiarismScore > 15)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f1f3d] via-[#1e3a5f] to-[#0f2444]">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/20 animate-ping" />
            <div className="absolute inset-1 rounded-full border-2 border-yellow-400/40 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-blue-200 text-sm tracking-widest uppercase font-medium">Đang tải dữ liệu chỉ huy...</p>
          <p className="text-blue-400/60 text-xs mt-2">Trung tâm Chỉ huy — Học viện Quốc phòng</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600 font-medium">Không thể tải dữ liệu.</p>
          <p className="text-slate-400 text-sm mt-1">Vui lòng kiểm tra kết nối và thử lại.</p>
          <Button onClick={() => fetchData()} className="mt-4 bg-[#1e3a5f] hover:bg-[#0f2444]" >
            <RefreshCw className="w-4 h-4 mr-2" /> Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">

      {/* ── Executive Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-[#0f1f3d] via-[#1e3a5f] to-[#0f2444] text-white shadow-2xl border-b border-white/5"
      >
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

            {/* Left: Identity */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-xl shadow-yellow-500/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                {hasAlerts && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f1f3d] animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                    Trung tâm Chỉ huy
                  </h1>
                  <span className="hidden md:inline text-blue-300/50 text-xl">—</span>
                  <span className="hidden md:inline text-blue-200 text-base font-normal">Tạp chí Nghệ thuật Quân sự Việt Nam</span>
                </div>
                <p className="text-blue-200/80 text-sm mt-0.5">
                  Xin chào, <span className="font-semibold text-yellow-300">{userName}</span>
                  {lastUpdated && (
                    <span className="text-blue-300/60 ml-2 text-xs">
                      · Cập nhật {lastUpdated.toLocaleTimeString('vi-VN')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Alert badge */}
              {hasAlerts && (
                <div className="flex items-center gap-1.5 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cần chú ý</span>
                </div>
              )}

              {/* Date */}
              <span className="text-xs text-blue-300/70 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>

              {/* Date range picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 border border-white/20 rounded-full text-xs h-8 px-3 gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {DATE_RANGE_LABELS[dateRange]}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(Object.entries(DATE_RANGE_LABELS) as [string, string][]).map(([days, label]) => (
                    <DropdownMenuItem
                      key={days}
                      onClick={() => handleDateRangeChange(parseInt(days) as DateRangeOption)}
                      className={dateRange === parseInt(days) ? 'font-semibold text-blue-600' : ''}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Report link */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 border border-white/20 rounded-full text-xs h-8 px-3 gap-1.5"
                asChild
              >
                <Link href="/dashboard/commander/report">
                  <FileBarChart className="w-3.5 h-3.5" />
                  Báo cáo
                </Link>
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 border border-white/20 rounded-full w-8 h-8"
                onClick={() => fetchData()}
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tab Navigation + Content ─────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/60">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col md:flex-row items-center gap-1.5 py-2.5 px-2 text-xs md:text-sm rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#1e3a5f] data-[state=active]:to-[#0f2444] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-tight text-center">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <OverviewTab data={data} />
          </TabsContent>

          <TabsContent value="trend" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <TrendForecastTab data={data} />
          </TabsContent>

          <TabsContent value="research" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <ResearchFieldsTab data={data} />
          </TabsContent>

          <TabsContent value="ecosystem" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <EcosystemTab data={data} />
          </TabsContent>

          <TabsContent value="quality" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <QualityTab data={data} />
          </TabsContent>

          <TabsContent value="library" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
            <DigitalLibraryTab data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
