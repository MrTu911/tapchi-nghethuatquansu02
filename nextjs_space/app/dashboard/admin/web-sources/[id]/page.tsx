'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Globe, ArrowLeft, Play, Loader2, Clock, CheckCircle2,
  XCircle, AlertTriangle, ChevronDown, ChevronUp,
  ExternalLink, RefreshCw, FileText, Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebSource {
  id: string
  name: string
  url: string
  description?: string
  frequency: string
  isActive: boolean
  totalCrawled: number
  totalImported: number
  lastCrawledAt?: string
  nextCrawlAt?: string
  selectorRules: Record<string, unknown>
  defaultCategory?: string
  delayBetweenRequests: number
  maxArticlesPerRun: number
  createdAt: string
  creator?: { fullName: string }
  crawlJobs: CrawlJob[]
  _count?: { crawledContents: number }
}

interface CrawlJob {
  id: string
  status: string
  triggeredBy?: string
  trigger?: { fullName: string }
  startedAt?: string
  completedAt?: string
  articlesFound: number
  articlesNew: number
  articlesDuplicate: number
  articlesFailed: number
  error?: string
  logs?: Array<{ time: string; level: string; message: string }>
  createdAt: string
}

const FREQ_LABELS: Record<string, string> = {
  EVERY_HOUR: 'Mỗi giờ', EVERY_6_HOURS: '6 giờ/lần',
  EVERY_12_HOURS: '12 giờ/lần', DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần', MANUAL: 'Thủ công',
}

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Chờ chạy',   color: 'bg-slate-100 text-slate-600',  icon: Clock },
  RUNNING:   { label: 'Đang chạy',  color: 'bg-blue-100 text-blue-700',    icon: Loader2 },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  FAILED:    { label: 'Thất bại',   color: 'bg-red-100 text-red-700',      icon: XCircle },
  PARTIAL:   { label: 'Một phần',   color: 'bg-amber-100 text-amber-700',  icon: AlertTriangle },
}

const LOG_COLORS: Record<string, string> = {
  info: 'text-slate-500',
  warn: 'text-amber-600',
  error: 'text-red-600',
}

// ─── Crawl Job Row ────────────────────────────────────────────────────────────

function CrawlJobRow({ job }: { job: CrawlJob }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.PENDING
  const Icon = cfg.icon

  const duration = job.startedAt && job.completedAt
    ? Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
    : null

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${cfg.color}`}>
          <Icon className={`h-3 w-3 ${job.status === 'RUNNING' ? 'animate-spin' : ''}`} />
          {cfg.label}
        </span>
        <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
          <span className="text-slate-500">
            {new Date(job.createdAt).toLocaleString('vi-VN')}
          </span>
          <span className="text-emerald-600 font-medium">+{job.articlesNew} mới</span>
          <span className="text-amber-600">~{job.articlesDuplicate} trùng</span>
          <span className="text-red-500">{job.articlesFailed} lỗi</span>
        </div>
        {duration !== null && (
          <span className="text-xs text-slate-400">{duration}s</span>
        )}
        <span className="text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </div>

      {expanded && job.logs && job.logs.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 max-h-60 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 mb-2">Nhật ký chi tiết</p>
          <div className="space-y-1 font-mono text-xs">
            {job.logs.map((log, i) => (
              <div key={i} className={`flex gap-2 ${LOG_COLORS[log.level] || 'text-slate-500'}`}>
                <span className="text-slate-300 shrink-0">{new Date(log.time).toLocaleTimeString('vi-VN')}</span>
                <span className="uppercase font-semibold shrink-0 w-8">{log.level}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && job.error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {job.error}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebSourceDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [source, setSource] = useState<WebSource | null>(null)
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [recentContent, setRecentContent] = useState<unknown[]>([])

  const fetchSource = useCallback(async () => {
    try {
      const res = await fetch(`/api/web-sources/${id}`)
      const data = await res.json()
      if (data.success) setSource(data.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchRecentContent = useCallback(async () => {
    const res = await fetch(`/api/crawled-content?webSourceId=${id}&limit=10`)
    const data = await res.json()
    if (data.success) setRecentContent(data.data.contents)
  }, [id])

  useEffect(() => {
    fetchSource()
    fetchRecentContent()
  }, [fetchSource, fetchRecentContent])

  async function handleCrawlNow() {
    setCrawling(true)
    try {
      const res = await fetch(`/api/web-sources/${id}/crawl`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Đã khởi tạo tác vụ crawl')
      setTimeout(fetchSource, 3000)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setCrawling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!source) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
        <Globe className="h-12 w-12 mb-3 opacity-30" />
        <p>Không tìm thấy nguồn web</p>
        <Link href="/dashboard/admin/web-sources">
          <Button variant="outline" size="sm" className="mt-3">Quay lại</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard/admin/web-sources">
              <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/10 gap-1">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{source.name}</h1>
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-300 text-sm hover:underline flex items-center gap-1">
                  {source.url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${source.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                {source.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {source.isActive ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
              <Button
                onClick={handleCrawlNow}
                disabled={crawling || !source.isActive}
                className="bg-white text-indigo-900 hover:bg-indigo-50 gap-2 font-semibold"
              >
                {crawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Crawl ngay
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng bài crawl', value: source.totalCrawled, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Đã import', value: source.totalImported, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Số lần crawl', value: source.crawlJobs.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Bài chờ review', value: (source._count?.crawledContents || 0) - source.totalImported, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className={`p-4 ${bg} rounded-xl`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="jobs">Lịch sử Crawl ({source.crawlJobs.length})</TabsTrigger>
            <TabsTrigger value="content">Nội dung đã crawl</TabsTrigger>
          </TabsList>

          {/* Tab: Thông tin */}
          <TabsContent value="info" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-slate-400 mb-1">Tần suất</p><p className="font-medium">{FREQ_LABELS[source.frequency]}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Delay requests</p><p className="font-medium">{source.delayBetweenRequests}ms</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Tối đa bài/lần</p><p className="font-medium">{source.maxArticlesPerRun}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Chuyên mục mặc định</p><p className="font-medium">{source.defaultCategory || '—'}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Crawl gần nhất</p><p className="font-medium">{source.lastCrawledAt ? new Date(source.lastCrawledAt).toLocaleString('vi-VN') : '—'}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Tạo bởi</p><p className="font-medium">{source.creator?.fullName || '—'}</p></div>
                </div>
                {source.description && (
                  <div><p className="text-xs text-slate-400 mb-1">Mô tả</p><p className="text-sm">{source.description}</p></div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Cấu hình Selectors</p>
                  <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs overflow-x-auto">
                    {JSON.stringify(source.selectorRules, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Lịch sử jobs */}
          <TabsContent value="jobs" className="mt-4 space-y-2">
            {source.crawlJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Chưa có lịch sử crawl</p>
              </div>
            ) : (
              source.crawlJobs.map(job => <CrawlJobRow key={job.id} job={job} />)
            )}
          </TabsContent>

          {/* Tab: Nội dung crawl */}
          <TabsContent value="content" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-slate-500">10 bài gần nhất</p>
              <Link href={`/dashboard/admin/crawled-content?webSourceId=${id}`}>
                <Button size="sm" variant="outline">Xem tất cả →</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {(recentContent as Array<{
                id: string; rawTitle: string; editedTitle?: string; status: string;
                createdAt: string; coverImageS3?: string
              }>).map(item => {
                const STATUS_COLORS: Record<string, string> = {
                  PENDING: 'bg-amber-100 text-amber-700',
                  APPROVED: 'bg-blue-100 text-blue-700',
                  IMPORTED: 'bg-emerald-100 text-emerald-700',
                  REJECTED: 'bg-red-100 text-red-700',
                  DUPLICATE: 'bg-purple-100 text-purple-700',
                }
                const STATUS_LABELS: Record<string, string> = {
                  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt',
                  IMPORTED: 'Đã import', REJECTED: 'Từ chối', DUPLICATE: 'Trùng lặp',
                }
                return (
                  <Link key={item.id} href={`/dashboard/admin/crawled-content/${item.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                      <p className="text-sm text-slate-700 truncate flex-1">
                        {item.editedTitle || item.rawTitle}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
