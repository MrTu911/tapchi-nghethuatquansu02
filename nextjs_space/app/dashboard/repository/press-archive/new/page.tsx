'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface Issue {
  id: string
  label: string
  year: number
}

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

export default function NewPressArchivePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [issues, setIssues] = useState<Issue[]>([])
  const [sections, setSections] = useState<IssueSection[]>([])
  const [loadingIssues, setLoadingIssues] = useState(true)

  // Form state
  const [issueId, setIssueId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState<AuthorRow[]>([
    { name: '', militaryRank: '', academicTitle: '', degree: '', organization: '' },
  ])
  const [abstract, setAbstract] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [pageStart, setPageStart] = useState('')
  const [pageEnd, setPageEnd] = useState('')
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  useEffect(() => {
    fetch('/api/issues?status=PUBLISHED&limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const mapped = (d.data?.issues || d.data || []).map((iss: any) => ({
            id: iss.id,
            label: `Số ${iss.number}/${iss.year}${iss.title ? ' — ' + iss.title : ''}`,
            year: iss.year,
          }))
          // Sorted descending by year
          mapped.sort((a: Issue, b: Issue) => b.year - a.year)
          setIssues(mapped)
        }
      })
      .catch(() => toast.error('Không tải được danh sách số báo'))
      .finally(() => setLoadingIssues(false))
  }, [])

  useEffect(() => {
    if (!issueId) {
      setSections([])
      setSectionId('')
      return
    }
    fetch(`/api/issues/${issueId}/sections`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSections(d.data || [])
        else setSections([])
        setSectionId('')
      })
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
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw])
    }
    setKeywordInput('')
  }

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!issueId) return toast.error('Vui lòng chọn số báo')
    if (!title.trim()) return toast.error('Vui lòng nhập tiêu đề')
    if (authors.some((a) => !a.name.trim())) return toast.error('Tên tác giả không được để trống')
    if (!pageStart || isNaN(parseInt(pageStart))) return toast.error('Trang bắt đầu không hợp lệ')

    setSaving(true)
    try {
      const authorsWithOrder = authors.map((a, i) => ({ ...a, order: i }))
      const authorsText = buildAuthorsText(authorsWithOrder)

      const payload = {
        issueId,
        sectionId: sectionId || undefined,
        title: title.trim(),
        authorsText,
        authors: authorsWithOrder,
        abstract: abstract.trim() || undefined,
        keywords,
        pageStart: parseInt(pageStart),
        pageEnd: pageEnd ? parseInt(pageEnd) : undefined,
        status,
      }

      const fd = new FormData()
      fd.append('data', JSON.stringify(payload))
      if (pdfFile) fd.append('pdf', pdfFile)

      const res = await fetch('/api/repository/press-archive', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.success) {
        toast.success('Đã thêm bài báo vào CSDL')
        router.push('/dashboard/repository/press-archive')
      } else {
        toast.error(data.error || 'Lỗi lưu bài báo')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thêm bài báo lịch sử</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin số báo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin số báo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số báo <span className="text-red-500">*</span></Label>
              {loadingIssues ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : (
                <Select value={issueId} onValueChange={setIssueId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số báo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {issues.map((iss) => (
                      <SelectItem key={iss.id} value={iss.id}>{iss.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Chuyên mục</Label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={!issueId || sections.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={sections.length === 0 ? 'Không có chuyên mục' : 'Chọn chuyên mục'} />
                </SelectTrigger>
                <SelectContent>
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
                placeholder="Ví dụ: 3"
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
                placeholder="Ví dụ: 12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tiêu đề */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung bài báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề bài báo <span className="text-red-500">*</span></Label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề đầy đủ của bài báo"
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tóm tắt</Label>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Tóm tắt nội dung bài báo (không bắt buộc)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Từ khóa</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
                  }}
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
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tác giả {idx + 1}</span>
                  {authors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-7 w-7 p-0"
                      onClick={() => removeAuthorRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Họ và tên <span className="text-red-500">*</span></Label>
                    <Input
                      value={author.name}
                      onChange={(e) => updateAuthor(idx, 'name', e.target.value)}
                      placeholder="Họ và tên đầy đủ"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quân hàm</Label>
                    <Select value={author.militaryRank || '_none'} onValueChange={(v) => updateAuthor(idx, 'militaryRank', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                      <SelectContent>
                        {MILITARY_RANKS.map((r) => (
                          <SelectItem key={r} value={r || '_none'}>{r || '(Không có)'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Học hàm</Label>
                    <Select value={author.academicTitle || '_none'} onValueChange={(v) => updateAuthor(idx, 'academicTitle', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="GS, PGS..." /></SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_TITLES.map((t) => (
                          <SelectItem key={t} value={t || '_none'}>{t || '(Không có)'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Học vị</Label>
                    <Select value={author.degree || '_none'} onValueChange={(v) => updateAuthor(idx, 'degree', v === '_none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="TS, ThS..." /></SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => (
                          <SelectItem key={d} value={d || '_none'}>{d || '(Không có)'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Đơn vị / Tổ chức</Label>
                    <Input
                      value={author.organization}
                      onChange={(e) => updateAuthor(idx, 'organization', e.target.value)}
                      placeholder="Đơn vị công tác"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* File PDF + Trạng thái */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File và trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>File PDF bài báo</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFile ? pdfFile.name : 'Chọn file PDF'}
                </Button>
                {pdfFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)}>
                    Xóa
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái xuất bản</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'PUBLISHED' | 'DRAFT')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/repository/press-archive">Hủy</Link>
          </Button>
          <Button type="submit" disabled={saving} className="bg-sky-600 hover:bg-sky-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {saving ? 'Đang lưu...' : 'Lưu bài báo'}
          </Button>
        </div>
      </form>
    </div>
  )
}
