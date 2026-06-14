'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, ArrowLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface IssueSection {
  id: string
  name: string
}

interface AuthorRow {
  name: string
  militaryRank: string
  academicTitle: string
  degree: string
  organization: string
}

const JOURNAL_TYPES: { value: string; label: string }[] = [
  { value: 'DOMESTIC_PEER_REVIEWED', label: 'Trong nước (có phản biện)' },
  { value: 'SCI', label: 'SCI' },
  { value: 'SCIE', label: 'SCIE' },
  { value: 'SCOPUS', label: 'Scopus' },
  { value: 'ESCI', label: 'ESCI' },
  { value: 'CONFERENCE', label: 'Hội nghị khoa học' },
  { value: 'OTHER', label: 'Khác' },
]

const ACADEMIC_TITLES = ['', 'GS', 'PGS']
const DEGREES = ['', 'TS', 'ThS', 'CN', 'BS', 'BSCKI', 'BSCKII']
const MILITARY_RANKS = [
  '', 'Đại tướng', 'Thượng tướng', 'Trung tướng', 'Thiếu tướng',
  'Đại tá', 'Thượng tá', 'Trung tá', 'Thiếu tá',
  'Đại úy', 'Thượng úy', 'Trung úy', 'Thiếu úy',
]

function buildAuthorsText(authors: AuthorRow[]): string {
  return authors
    .map((a) => {
      const parts = [a.militaryRank, a.academicTitle, a.degree ? `${a.degree}.` : '', a.name].filter(Boolean)
      return parts.join(' ').replace(/\s+/g, ' ').trim()
    })
    .join('; ')
}

export default function EditPressArchivePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sections, setSections] = useState<IssueSection[]>([])
  const [issueId, setIssueId] = useState('')
  const [issueLabel, setIssueLabel] = useState('')

  // Form state
  const [sectionId, setSectionId] = useState('')
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState<AuthorRow[]>([])
  const [abstract, setAbstract] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [pageStart, setPageStart] = useState('')
  const [pageEnd, setPageEnd] = useState('')
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'WITHDRAWN'>('PUBLISHED')
  const [journalType, setJournalType] = useState<string>('DOMESTIC_PEER_REVIEWED')
  const [journalNameOverride, setJournalNameOverride] = useState('')
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [clearPdf, setClearPdf] = useState(false)

  useEffect(() => {
    fetch(`/api/repository/press-archive/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { toast.error('Không tìm thấy bài báo'); return }
        const a = d.data
        setIssueId(a.issueId)
        setIssueLabel(
          a.issue
            ? `Số ${a.issue.number}/${a.issue.year}${a.issue.title ? ' — ' + a.issue.title : ''}`
            : '',
        )
        setSectionId(a.sectionId || '')
        setTitle(a.title)
        setAbstract(a.abstract || '')
        setKeywords(a.keywords || [])
        setPageStart(String(a.pageStart))
        setPageEnd(a.pageEnd ? String(a.pageEnd) : '')
        setStatus(a.status)
        setJournalType(a.journalType || 'DOMESTIC_PEER_REVIEWED')
        setJournalNameOverride(a.journalNameOverride || '')
        setCurrentPdfUrl(a.articlePdfUrl || null)
        setAuthors(
          a.authors.map((au: any) => ({
            name: au.name,
            militaryRank: au.militaryRank || '',
            academicTitle: au.academicTitle || '',
            degree: au.degree || '',
            organization: au.organization || '',
          })),
        )
      })
      .catch(() => toast.error('Lỗi tải bài báo'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!issueId) { setSections([]); return }
    fetch(`/api/issues/${issueId}/sections`)
      .then((r) => r.json())
      .then((d) => setSections(d.success ? d.data || [] : []))
      .catch(() => setSections([]))
  }, [issueId])

  const addAuthorRow = () => {
    setAuthors((prev) => [...prev, { name: '', militaryRank: '', academicTitle: '', degree: '', organization: '' }])
  }

  const removeAuthorRow = (index: number) => {
    setAuthors((prev) => prev.filter((_, i) => i !== index))
  }

  const updateAuthor = (index: number, field: keyof AuthorRow, value: string) => {
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) setKeywords((prev) => [...prev, kw])
    setKeywordInput('')
  }

  const removeKeyword = (kw: string) => setKeywords((prev) => prev.filter((k) => k !== kw))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return toast.error('Tiêu đề không được để trống')
    if (authors.some((a) => !a.name.trim())) return toast.error('Tên tác giả không được để trống')
    if (!pageStart || isNaN(parseInt(pageStart))) return toast.error('Trang bắt đầu không hợp lệ')

    setSaving(true)
    try {
      const authorsWithOrder = authors.map((a, i) => ({ ...a, order: i }))
      const authorsText = buildAuthorsText(authorsWithOrder)

      const payload: any = {
        sectionId: sectionId || null,
        title: title.trim(),
        authorsText,
        authors: authorsWithOrder,
        abstract: abstract.trim() || null,
        keywords,
        pageStart: parseInt(pageStart),
        pageEnd: pageEnd ? parseInt(pageEnd) : null,
        status,
        journalType,
        journalNameOverride: journalNameOverride.trim() || null,
        clearPdf,
      }

      const fd = new FormData()
      fd.append('data', JSON.stringify(payload))
      if (pdfFile) fd.append('pdf', pdfFile)

      const res = await fetch(`/api/repository/press-archive/${id}`, { method: 'PATCH', body: fd })
      const data = await res.json()

      if (data.success) {
        toast.success('Đã cập nhật bài báo')
        router.push('/dashboard/repository/press-archive')
      } else {
        toast.error(data.error || 'Lỗi cập nhật')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/repository/press-archive">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa bài báo lịch sử</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin số báo (read-only — không đổi issue sau khi tạo) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin số báo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số báo</Label>
              <Input value={issueLabel} disabled className="bg-gray-50 dark:bg-gray-800" />
            </div>

            <div className="space-y-2">
              <Label>Chuyên mục</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chuyên mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Không có</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trang bắt đầu <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                value={pageStart}
                onChange={(e) => setPageStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Trang kết thúc</Label>
              <Input
                type="number"
                min={1}
                value={pageEnd}
                onChange={(e) => setPageEnd(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại tạp chí (dùng cho báo cáo công bố)</Label>
              <Select value={journalType} onValueChange={setJournalType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOURNAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tên tạp chí/hội nghị (nếu khác Tạp chí NTQS)</Label>
              <Input
                value={journalNameOverride}
                onChange={(e) => setJournalNameOverride(e.target.value)}
                placeholder="Để trống nếu đăng trên Tạp chí NTQS"
              />
            </div>
          </CardContent>
        </Card>

        {/* Nội dung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung bài báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tóm tắt</Label>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Từ khóa</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                  placeholder="Nhập từ khóa rồi nhấn Enter"
                />
                <Button type="button" variant="outline" onClick={addKeyword}>Thêm</Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(kw)}>
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tác giả */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Danh sách tác giả <span className="text-red-500">*</span></span>
              <Button type="button" variant="outline" size="sm" onClick={addAuthorRow}>
                <Plus className="h-4 w-4 mr-1" /> Thêm tác giả
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {authors.map((author, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tác giả {idx + 1}</span>
                  {authors.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={() => removeAuthorRow(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Họ và tên <span className="text-red-500">*</span></Label>
                    <Input value={author.name} onChange={(e) => updateAuthor(idx, 'name', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quân hàm</Label>
                    <Select value={author.militaryRank || '_none'} onValueChange={(v) => updateAuthor(idx, 'militaryRank', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MILITARY_RANKS.map((r) => <SelectItem key={r} value={r || '_none'}>{r || '(Không có)'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Học hàm</Label>
                    <Select value={author.academicTitle || '_none'} onValueChange={(v) => updateAuthor(idx, 'academicTitle', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_TITLES.map((t) => <SelectItem key={t} value={t || '_none'}>{t || '(Không có)'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Học vị</Label>
                    <Select value={author.degree || '_none'} onValueChange={(v) => updateAuthor(idx, 'degree', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => <SelectItem key={d} value={d || '_none'}>{d || '(Không có)'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Đơn vị</Label>
                    <Input value={author.organization} onChange={(e) => updateAuthor(idx, 'organization', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* File + Trạng thái */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File và trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>File PDF bài báo</Label>
              {currentPdfUrl && !clearPdf && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                  <span className="text-gray-600">File hiện tại: {currentPdfUrl.split('/').pop()}</span>
                  <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setClearPdf(true)}>
                    Xóa file
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={(e) => { setPdfFile(e.target.files?.[0] || null); setClearPdf(false) }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFile ? pdfFile.name : (clearPdf ? 'Chọn file thay thế' : 'Thay file PDF')}
                </Button>
                {pdfFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)}>Hủy</Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="WITHDRAWN">Thu hồi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/repository/press-archive">Hủy</Link>
          </Button>
          <Button type="submit" disabled={saving} className="bg-sky-600 hover:bg-sky-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
