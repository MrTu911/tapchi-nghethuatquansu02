'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Plus, Search, RefreshCw, ToggleLeft, ToggleRight,
  Trash2, Eye, Clock, Play, CheckCircle2, XCircle,
  AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Rss, Database, TrendingUp, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  createdAt: string
  creator?: { fullName: string }
  _count?: { crawlJobs: number; crawledContents: number }
}

const FREQ_LABELS: Record<string, string> = {
  EVERY_HOUR: 'Mỗi giờ',
  EVERY_6_HOURS: '6 giờ/lần',
  EVERY_12_HOURS: '12 giờ/lần',
  DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần',
  MANUAL: 'Thủ công',
}

const FREQ_COLORS: Record<string, string> = {
  EVERY_HOUR: 'bg-purple-100 text-purple-700',
  EVERY_6_HOURS: 'bg-indigo-100 text-indigo-700',
  EVERY_12_HOURS: 'bg-blue-100 text-blue-700',
  DAILY: 'bg-cyan-100 text-cyan-700',
  WEEKLY: 'bg-teal-100 text-teal-700',
  MANUAL: 'bg-slate-100 text-slate-600',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Source Form Dialog ───────────────────────────────────────────────────────

function WebSourceFormDialog({
  open, onClose, onSaved, initialData
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: WebSource | null
}) {
  const isEdit = !!initialData
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; title?: string; contentPreview?: string; imageUrls?: string[]; error?: string } | null>(null)

  const [form, setForm] = useState({
    name: initialData?.name || '',
    url: initialData?.url || '',
    description: initialData?.description || '',
    frequency: initialData?.frequency || 'DAILY',
    isActive: initialData?.isActive !== false,
    delayBetweenRequests: 2000,
    maxArticlesPerRun: 20,
    defaultCategory: '',
    selectorRules: {
      articleListSelector: '',
      articleLinkSelector: 'a',
      titleSelector: 'h1',
      contentSelector: '.article-content',
      authorSelector: '',
      dateSelector: '',
      summarySelector: '',
      maxPages: 1,
      userAgent: '',
    },
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const setRule = (k: string, v: unknown) => setForm(f => ({
    ...f, selectorRules: { ...f.selectorRules, [k]: v }
  }))

  async function handleSave() {
    if (!form.name || !form.url) {
      toast.error('Vui lòng nhập Tên nguồn và URL')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(
        isEdit ? `/api/web-sources/${initialData!.id}` : '/api/web-sources',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu')
      toast.success(isEdit ? 'Cập nhật thành công' : 'Tạo nguồn web thành công')
      onSaved()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi server')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!form.url) { toast.error('Vui lòng nhập URL'); return }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/web-sources/${initialData?.id || 'new'}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url, selectorRules: form.selectorRules }),
      })
      const data = await res.json()
      setTestResult(data.data || data)
    } catch {
      setTestResult({ success: false, error: 'Không kết nối được server' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-indigo-600" />
            {isEdit ? 'Chỉnh sửa nguồn web' : 'Thêm nguồn web mới'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Thông tin</TabsTrigger>
            <TabsTrigger value="selectors">Cấu hình Selector</TabsTrigger>
            <TabsTrigger value="test">Test Crawl</TabsTrigger>
          </TabsList>

          {/* Tab 1: Thông tin cơ bản */}
          <TabsContent value="basic" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Tên nguồn <span className="text-red-500">*</span></Label>
                <Input placeholder="VD: Báo Quân đội Nhân dân" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>URL trang danh sách bài <span className="text-red-500">*</span></Label>
                <Input placeholder="https://example.com/news" value={form.url} onChange={e => set('url', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Mô tả</Label>
                <Textarea placeholder="Mô tả ngắn về nguồn này..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Tần suất crawl</Label>
                <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Số bài tối đa/lần</Label>
                <Input type="number" min={1} max={100} value={form.maxArticlesPerRun}
                  onChange={e => set('maxArticlesPerRun', parseInt(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Delay giữa requests (ms)</Label>
                <Input type="number" min={500} value={form.delayBetweenRequests}
                  onChange={e => set('delayBetweenRequests', parseInt(e.target.value))} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Switch checked={form.isActive} onCheckedChange={v => set('isActive', v)} />
                <Label>Kích hoạt ngay</Label>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Selector config */}
          <TabsContent value="selectors" className="space-y-3 pt-2">
            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
              Nhập CSS selectors để xác định vị trí các phần tử trên trang web nguồn.
            </p>
            {[
              ['articleListSelector', 'Container danh sách bài *', '.article-list'],
              ['articleLinkSelector', 'Link từng bài * (trong container)', 'a.article-link'],
              ['titleSelector', 'Tiêu đề bài *', 'h1.article-title'],
              ['contentSelector', 'Nội dung bài *', '.article-content, .post-body'],
              ['summarySelector', 'Tóm tắt bài', '.article-summary'],
              ['authorSelector', 'Tác giả', '.author-name'],
              ['dateSelector', 'Ngày đăng', 'time, .publish-date'],
              ['userAgent', 'User-Agent tùy chỉnh', 'Mozilla/5.0 ...'],
            ].map(([k, label, placeholder]) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  placeholder={placeholder as string}
                  value={((form.selectorRules as unknown) as Record<string, string>)[k] || ''}
                  onChange={e => setRule(k, e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Số trang danh sách tối đa</Label>
              <Input type="number" min={1} max={10} value={form.selectorRules.maxPages}
                onChange={e => setRule('maxPages', parseInt(e.target.value))} />
            </div>
          </TabsContent>

          {/* Tab 3: Test crawl */}
          <TabsContent value="test" className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">Nhập URL bài cụ thể để kiểm tra cấu hình selector. Kết quả không được lưu vào hệ thống.</p>
            <Button onClick={handleTest} disabled={testing} className="w-full">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              {testing ? 'Đang test...' : 'Chạy Test Crawl'}
            </Button>
            {testResult && (
              <div className={`p-3 rounded-lg border text-sm space-y-2 ${testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                {testResult.success ? (
                  <>
                    <p className="font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Thành công
                    </p>
                    {testResult.title && <p><span className="text-slate-500">Tiêu đề:</span> {testResult.title}</p>}
                    {testResult.contentPreview && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded border max-h-24 overflow-y-auto">
                        {testResult.contentPreview}...
                      </p>
                    )}
                    {testResult.imageUrls && testResult.imageUrls.length > 0 && (
                      <p className="text-xs"><span className="text-slate-500">Ảnh tìm thấy:</span> {testResult.imageUrls.length}</p>
                    )}
                  </>
                ) : (
                  <p className="text-red-700 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> {testResult.error}
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isEdit ? 'Lưu thay đổi' : 'Tạo nguồn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WebSourcesPage() {
  const [sources, setSources] = useState<WebSource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [filterFreq, setFilterFreq] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editSource, setEditSource] = useState<WebSource | null>(null)
  const [crawlingId, setCrawlingId] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '15',
        ...(search && { search }),
        ...(filterActive !== 'all' && { isActive: filterActive }),
        ...(filterFreq !== 'all' && { frequency: filterFreq }),
      })
      const res = await fetch(`/api/web-sources?${params}`)
      const data = await res.json()
      if (data.success) {
        setSources(data.data.webSources)
        setTotalPages(data.data.pagination.totalPages)
        setTotalCount(data.data.pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, filterActive, filterFreq])

  useEffect(() => { fetchSources() }, [fetchSources])

  async function handleCrawlNow(sourceId: string) {
    setCrawlingId(sourceId)
    try {
      const res = await fetch(`/api/web-sources/${sourceId}/crawl`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Đã khởi tạo tác vụ crawl (Job: ${data.data?.jobId?.substring(0, 8)}...)`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setCrawlingId(null)
    }
  }

  async function handleToggle(source: WebSource) {
    try {
      const res = await fetch(`/api/web-sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !source.isActive }),
      })
      if (!res.ok) throw new Error('Lỗi cập nhật')
      toast.success(source.isActive ? 'Đã tắt nguồn' : 'Đã bật nguồn')
      fetchSources()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  async function handleDelete(source: WebSource) {
    if (!confirm(`Xóa nguồn "${source.name}"?`)) return
    try {
      const res = await fetch(`/api/web-sources/${source.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || 'Đã xóa')
      fetchSources()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  const activeSources = sources.filter(s => s.isActive).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
                <Rss className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Quản lý Nguồn Web</h1>
                <p className="text-indigo-200 text-sm mt-0.5">Cấu hình và theo dõi tự động sao chép bài viết</p>
              </div>
            </div>
            <Button
              onClick={() => { setEditSource(null); setShowForm(true) }}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold gap-2"
            >
              <Plus className="h-4 w-4" /> Thêm nguồn
            </Button>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Tổng nguồn', value: totalCount, icon: Globe, color: 'bg-white/10 text-white' },
              { label: 'Đang hoạt động', value: activeSources, icon: Activity, color: 'bg-emerald-500/20 text-emerald-300' },
              { label: 'Không hoạt động', value: totalCount - activeSources, icon: XCircle, color: 'bg-slate-500/20 text-slate-300' },
              { label: 'Bài đã crawl', value: sources.reduce((a, s) => a + s.totalCrawled, 0), icon: Database, color: 'bg-blue-500/20 text-blue-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`p-3 rounded-xl backdrop-blur ${color} flex items-center gap-3`}>
                <Icon className="h-5 w-5 opacity-80" />
                <div>
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-xs opacity-70">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Tìm kiếm nguồn..." className="pl-9 h-9"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select value={filterActive} onValueChange={v => { setFilterActive(v); setPage(1) }}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Đã tắt</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFreq} onValueChange={v => { setFilterFreq(v); setPage(1) }}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tần suất" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tần suất</SelectItem>
              {Object.entries(FREQ_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchSources}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Globe className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Chưa có nguồn web nào</p>
              <p className="text-sm mt-1">Bấm "Thêm nguồn" để bắt đầu</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Tên nguồn', 'Tần suất', 'Trạng thái', 'Đã crawl', 'Đã import', 'Crawl gần nhất', 'Hành động'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {sources.map((source, i) => (
                    <motion.tr
                      key={source.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{source.name}</p>
                          <a href={source.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:underline truncate block max-w-48">
                            {source.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${FREQ_COLORS[source.frequency]}`}>
                          <Clock className="h-3 w-3" />
                          {FREQ_LABELS[source.frequency]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {source.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {source.isActive ? 'Hoạt động' : 'Đã tắt'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{source.totalCrawled}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{source.totalImported}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {source.lastCrawledAt
                          ? new Date(source.lastCrawledAt).toLocaleString('vi-VN')
                          : <span className="text-slate-300">Chưa crawl</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/admin/web-sources/${source.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-600">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleCrawlNow(source.id)}
                            disabled={crawlingId === source.id || !source.isActive}
                          >
                            {crawlingId === source.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className={`h-7 px-2 ${source.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            onClick={() => handleToggle(source)}
                          >
                            {source.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-slate-500 hover:bg-slate-50"
                            onClick={() => { setEditSource(source); setShowForm(true) }}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(source)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">Trang {page}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {showForm && (
        <WebSourceFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditSource(null) }}
          onSaved={fetchSources}
          initialData={editSource}
        />
      )}
    </div>
  )
}
