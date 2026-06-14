'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch, Search, Filter, ChevronLeft, ChevronRight,
  Loader2, Eye, CheckCircle2, XCircle, Download,
  Clock, Globe, AlertCircle, Inbox, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string
  rawTitle: string
  editedTitle?: string
  rawSummary?: string
  editedSummary?: string
  sourceUrl: string
  coverImageS3?: string
  rawImageUrls: string[]
  status: string
  category?: string
  createdAt: string
  reviewedAt?: string
  importedAt?: string
  webSource?: { id: string; name: string }
  reviewer?: { fullName: string }
}

interface Stats {
  total: number
  pending: number
  approved: number
  imported: number
  rejected: number
  duplicate: number
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Chờ duyệt',  color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400',   icon: Clock },
  APPROVED:  { label: 'Đã duyệt',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    icon: CheckCircle2 },
  IMPORTED:  { label: 'Đã import',  color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', icon: Download },
  REJECTED:  { label: 'Từ chối',    color: 'bg-red-100 text-red-700',       dot: 'bg-red-500',     icon: XCircle },
  DUPLICATE: { label: 'Trùng lặp',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',  icon: AlertCircle },
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Tổng bài',     value: stats.total,     color: 'from-slate-500 to-slate-700',    icon: Inbox },
    { label: 'Chờ duyệt',   value: stats.pending,   color: 'from-amber-400 to-amber-600',    icon: Clock },
    { label: 'Đã duyệt',    value: stats.approved,  color: 'from-blue-400 to-blue-600',      icon: CheckCircle2 },
    { label: 'Đã import',   value: stats.imported,  color: 'from-emerald-400 to-emerald-600',icon: Download },
    { label: 'Từ chối',     value: stats.rejected,  color: 'from-red-400 to-red-600',        icon: XCircle },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {items.map(({ label, value, color, icon: Icon }) => (
        <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${color}`} />
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600', icon: AlertCircle }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CrawledContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, imported: 0, rejected: 0, duplicate: 0 })
  const [webSources, setWebSources] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  const fetchContents = useCallback(async () => {
    setLoading(true)
    setSelected([])
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(search && { search }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterSource !== 'all' && { webSourceId: filterSource }),
      })
      const res = await fetch(`/api/crawled-content?${params}`)
      const data = await res.json()
      if (data.success) {
        setContents(data.data.contents)
        setStats(data.data.stats)
        setTotalPages(data.data.pagination.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterSource])

  const fetchSources = useCallback(async () => {
    const res = await fetch('/api/web-sources?limit=100')
    const data = await res.json()
    if (data.success) setWebSources(data.data.webSources)
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  async function handleBulkApprove() {
    if (!selected.length) return
    setBulkLoading(true)
    try {
      await Promise.all(selected.map(id =>
        fetch(`/api/crawled-content/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      ))
      toast.success(`Đã duyệt ${selected.length} bài`)
      fetchContents()
    } catch {
      toast.error('Có lỗi khi duyệt')
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleQuickApprove(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/crawled-content/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
      })
      if (!res.ok) throw new Error('Lỗi')
      toast.success('Đã duyệt bài viết')
      fetchContents()
    } catch {
      toast.error('Lỗi khi duyệt')
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const displayTitle = (item: ContentItem) => item.editedTitle || item.rawTitle
  const displaySummary = (item: ContentItem) => item.editedSummary || item.rawSummary || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
              <FileSearch className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Review Nội Dung Đã Crawl</h1>
              <p className="text-blue-200 text-sm mt-0.5">Duyệt và import bài viết vào hệ thống tạp chí</p>
            </div>
          </motion.div>

          <div className="mt-5">
            <StatsRow stats={stats} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm tiêu đề..."
              className="pl-9 h-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={v => { setFilterSource(v); setPage(1) }}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Nguồn web" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nguồn</SelectItem>
              {webSources.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchContents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg"
            >
              <span className="text-sm font-medium">Đã chọn {selected.length} bài</span>
              <Button
                size="sm"
                className="bg-white text-indigo-700 hover:bg-indigo-50 gap-1.5 h-7"
                onClick={handleBulkApprove}
                disabled={bulkLoading}
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Duyệt tất cả
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 h-7"
                onClick={() => setSelected([])}
              >
                Bỏ chọn
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Inbox className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Không có bài viết nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc crawl thêm từ nguồn web</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selected.length === contents.length && contents.length > 0}
                      onCheckedChange={checked => setSelected(checked ? contents.map(c => c.id) : [])}
                    />
                  </th>
                  {['Bài viết', 'Nguồn', 'Trạng thái', 'Ngày crawl', 'Hành động'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {contents.map((item, i) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`hover:bg-slate-50/50 transition-colors ${selected.includes(item.id) ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="w-14 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                            {item.coverImageS3 ? (
                              <img
                                src={`/api/files/${item.coverImageS3}`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : item.rawImageUrls?.[0] ? (
                              <img
                                src={item.rawImageUrls[0]}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileSearch className="h-4 w-4 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 line-clamp-1">{displayTitle(item)}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{displaySummary(item)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-600">{item.webSource?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/admin/crawled-content/${item.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:bg-blue-50 gap-1 text-xs">
                              <Eye className="h-3.5 w-3.5" /> Xem
                            </Button>
                          </Link>
                          {item.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 gap-1 text-xs"
                              onClick={e => handleQuickApprove(item.id, e)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                            </Button>
                          )}
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
          <div className="flex items-center justify-center gap-3">
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
    </div>
  )
}
