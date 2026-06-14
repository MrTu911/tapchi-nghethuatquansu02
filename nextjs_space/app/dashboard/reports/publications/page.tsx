'use client'

/**
 * Trang: Báo cáo tổng hợp công bố khoa học.
 * Dùng chung cho tác giả (báo cáo cá nhân) và tòa soạn (báo cáo tổng hợp).
 * Component chỉ hiển thị + gọi API; toàn bộ map/đếm/dựng file ở backend.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileBarChart, FileText, FileSpreadsheet, FileDown, Loader2, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const EDITORIAL_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'COMMANDER']
const ALL = 'ALL' // sentinel cho Select "tất cả"

const JOURNAL_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'DOMESTIC_PEER_REVIEWED', label: 'Trong nước (có phản biện)' },
  { value: 'SCI', label: 'SCI' },
  { value: 'SCIE', label: 'SCIE' },
  { value: 'SCOPUS', label: 'Scopus' },
  { value: 'ESCI', label: 'ESCI' },
  { value: 'CONFERENCE', label: 'Hội nghị khoa học' },
  { value: 'OTHER', label: 'Khác' },
]

type ReportMode = 'author' | 'aggregate'

interface FilterState {
  mode: ReportMode
  authorName: string
  sectionName: string
  volumeId: string
  year: string
  yearFrom: string
  yearTo: string
  role: 'all' | 'chu-tri' | 'dong-tac-gia'
  journalType: string
  keyword: string
}

interface ReportRow {
  tt: number
  title: string
  issueRef: string
  pages: string
  role: string
  journalType: string
  journalName: string
  sectionName: string
}

interface Summary {
  total: number
  international: number
  domesticPeerReviewed: number
  conference: number
  asMainAuthor: number
  asCoAuthor: number
}

interface PreviewData {
  mode: ReportMode
  authorHeader?: { fullName: string; rankTitle: string; organization: string }
  summary: Summary
  rows: ReportRow[]
  total: number
  truncated: boolean
}

interface Options {
  sections: string[]
  years: number[]
  volumes: { id: string; volumeNo: number; year: number }[]
}

const emptyFilters: FilterState = {
  mode: 'author',
  authorName: '',
  sectionName: '',
  volumeId: '',
  year: '',
  yearFrom: '',
  yearTo: '',
  role: 'all',
  journalType: '',
  keyword: '',
}

export default function PublicationReportPage() {
  const [role, setRole] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [options, setOptions] = useState<Options>({ sections: [], years: [], volumes: [] })
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)

  const isEditorial = EDITORIAL_ROLES.includes(role)

  // Tải thông tin người dùng + tùy chọn lọc
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((res) => {
        const user = res?.data?.user
        if (user) {
          setRole(user.role)
          setFullName(user.fullName)
          // Tác giả: khóa tên về chính mình
          if (!EDITORIAL_ROLES.includes(user.role)) {
            setFilters((f) => ({ ...f, mode: 'author', authorName: user.fullName }))
          }
        }
      })
      .catch(() => {})

    fetch('/api/reports/publications/options')
      .then((r) => r.json())
      .then((res) => {
        if (res?.success) setOptions(res.data)
      })
      .catch(() => {})
  }, [])

  const buildQuery = useCallback((): string => {
    const params = new URLSearchParams()
    params.set('mode', filters.mode)
    if (filters.authorName) params.set('authorName', filters.authorName)
    if (filters.sectionName) params.set('sectionName', filters.sectionName)
    if (filters.volumeId) params.set('volumeId', filters.volumeId)
    if (filters.year) params.set('year', filters.year)
    if (filters.yearFrom) params.set('yearFrom', filters.yearFrom)
    if (filters.yearTo) params.set('yearTo', filters.yearTo)
    if (filters.mode === 'author' && filters.role !== 'all') params.set('role', filters.role)
    if (filters.journalType) params.set('journalType', filters.journalType)
    if (filters.keyword) params.set('keyword', filters.keyword)
    return params.toString()
  }, [filters])

  // Tải xem trước (debounce)
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true)
      fetch(`/api/reports/publications?${buildQuery()}&pageSize=100`)
        .then((r) => r.json())
        .then((res) => {
          if (res?.success) setPreview(res.data)
          else toast.error(res?.error || 'Không tải được xem trước')
        })
        .catch(() => toast.error('Lỗi kết nối khi tải xem trước'))
        .finally(() => setLoading(false))
    }, 400)
    return () => clearTimeout(handle)
  }, [buildQuery])

  const handleExport = (format: 'docx' | 'xlsx' | 'pdf') => {
    if (!preview || preview.total === 0) {
      toast.warning('Không có dữ liệu để xuất')
      return
    }
    window.location.href = `/api/reports/publications/export?${buildQuery()}&format=${format}`
    toast.success('Đang tạo file báo cáo...')
  }

  const setField = (key: keyof FilterState, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const summaryCards = useMemo(() => {
    const s = preview?.summary
    return [
      { label: 'Tổng số bài', value: s?.total ?? 0 },
      { label: 'Tác giả chính/chủ trì', value: s?.asMainAuthor ?? 0 },
      { label: 'Đồng tác giả', value: s?.asCoAuthor ?? 0 },
      { label: 'Trong nước (có phản biện)', value: s?.domesticPeerReviewed ?? 0 },
    ]
  }, [preview])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="h-7 w-7 text-emerald-700" />
        <div>
          <h1 className="text-2xl font-bold">Báo cáo tổng hợp công bố khoa học</h1>
          <p className="text-sm text-muted-foreground">
            Tổng hợp danh mục và số lượng bài báo đã đăng trên tạp chí theo nhiều bộ lọc.
          </p>
        </div>
      </div>

      {/* Chế độ báo cáo */}
      <Tabs
        value={filters.mode}
        onValueChange={(v) => setField('mode', v as ReportMode)}
      >
        <TabsList>
          <TabsTrigger value="author">Báo cáo cá nhân tác giả</TabsTrigger>
          {isEditorial && (
            <TabsTrigger value="aggregate">Báo cáo tổng hợp tòa soạn</TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Tên tác giả</Label>
            <Input
              value={filters.authorName}
              disabled={!isEditorial}
              placeholder="Nhập tên tác giả"
              onChange={(e) => setField('authorName', e.target.value)}
            />
            {!isEditorial && (
              <p className="text-xs text-muted-foreground">Đã khóa theo tài khoản của bạn.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Chuyên mục</Label>
            <Select
              value={filters.sectionName || ALL}
              onValueChange={(v) => setField('sectionName', v === ALL ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Tất cả chuyên mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả chuyên mục</SelectItem>
                {options.sections.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tập (Volume)</Label>
            <Select
              value={filters.volumeId || ALL}
              onValueChange={(v) => setField('volumeId', v === ALL ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Tất cả các tập" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả các tập</SelectItem>
                {options.volumes.map((vol) => (
                  <SelectItem key={vol.id} value={vol.id}>
                    Tập {vol.volumeNo} ({vol.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Năm xuất bản</Label>
            <Select
              value={filters.year || ALL}
              onValueChange={(v) => setField('year', v === ALL ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Tất cả các năm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả các năm</SelectItem>
                {options.years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Khoảng năm (từ — đến)</Label>
            <div className="flex gap-2">
              <Input
                type="number" placeholder="Từ năm" value={filters.yearFrom}
                onChange={(e) => setField('yearFrom', e.target.value)}
              />
              <Input
                type="number" placeholder="Đến năm" value={filters.yearTo}
                onChange={(e) => setField('yearTo', e.target.value)}
              />
            </div>
          </div>

          {filters.mode === 'author' && (
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <Select
                value={filters.role}
                onValueChange={(v) => setField('role', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="chu-tri">Chủ trì / Tác giả chính</SelectItem>
                  <SelectItem value="dong-tac-gia">Đồng tác giả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Loại tạp chí</Label>
            <Select
              value={filters.journalType || ALL}
              onValueChange={(v) => setField('journalType', v === ALL ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Tất cả loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả loại tạp chí</SelectItem>
                {JOURNAL_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Từ khóa (tên bài / keyword)</Label>
            <Input
              value={filters.keyword}
              placeholder="Tìm theo tiêu đề hoặc từ khóa"
              onChange={(e) => setField('keyword', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Số liệu tổng hợp */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nút xuất */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => handleExport('docx')} className="gap-2">
          <FileText className="h-4 w-4" /> Xuất Word (.docx)
        </Button>
        <Button onClick={() => handleExport('xlsx')} variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Xuất Excel (.xlsx)
        </Button>
        <Button onClick={() => handleExport('pdf')} variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" /> Xuất PDF
        </Button>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {preview?.truncated && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="h-4 w-4" /> Kết quả vượt 2000 bản ghi — chỉ hiển thị/xuất 2000 dòng đầu. Hãy thu hẹp bộ lọc.
        </div>
      )}

      {/* Bảng xem trước */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh mục chi tiết{' '}
            {preview ? <Badge variant="secondary">{preview.total} bài</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">TT</TableHead>
                  <TableHead>Tên bài báo</TableHead>
                  <TableHead>Số, tập, năm</TableHead>
                  <TableHead className="w-20">Trang</TableHead>
                  {filters.mode === 'author' && <TableHead className="w-28">Vai trò</TableHead>}
                  <TableHead className="w-40">Loại tạp chí</TableHead>
                  <TableHead>Chuyên mục</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!preview || preview.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filters.mode === 'author' ? 7 : 6} className="py-10 text-center text-muted-foreground">
                      {loading ? 'Đang tải...' : 'Không có bài báo phù hợp với bộ lọc.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  preview.rows.map((row) => (
                    <TableRow key={row.tt}>
                      <TableCell>{row.tt}</TableCell>
                      <TableCell className="max-w-md font-medium">{row.title}</TableCell>
                      <TableCell>{row.issueRef}</TableCell>
                      <TableCell>{row.pages}</TableCell>
                      {filters.mode === 'author' && <TableCell>{row.role}</TableCell>}
                      <TableCell>{row.journalType}</TableCell>
                      <TableCell>{row.sectionName || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {preview && preview.total > preview.rows.length && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hiển thị {preview.rows.length} / {preview.total} bài. File xuất ra chứa toàn bộ danh mục.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
