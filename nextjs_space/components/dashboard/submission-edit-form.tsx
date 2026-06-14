'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
}

interface CurrentFile {
  id: string
  originalName: string
  mimeType: string | null
}

interface SubmissionEditFormProps {
  submissionId: string
  initialData: {
    title: string
    abstractVn: string
    abstractEn: string
    keywords: string        // comma-joined string
    categoryId: string
    securityLevel: string
  }
  currentFile: CurrentFile | null
  categories: Category[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fieldError(field: string, value: string): string | null {
  if (field === 'title' && value.trim().length < 5)
    return `Cần ít nhất 5 ký tự (hiện tại: ${value.trim().length})`
  if (field === 'abstractVn' && value.trim().length < 30)
    return `Cần ít nhất 30 ký tự (hiện tại: ${value.trim().length})`
  if (field === 'keywords' && value.trim().length < 3)
    return 'Cần ít nhất 3 ký tự'
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubmissionEditForm({
  submissionId,
  initialData,
  currentFile,
  categories,
}: SubmissionEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: initialData.title,
    abstractVn: initialData.abstractVn,
    abstractEn: initialData.abstractEn,
    keywords: initialData.keywords,
    categoryId: initialData.categoryId,
    securityLevel: initialData.securityLevel,
  })

  const [newFile, setNewFile] = useState<File | null>(null)
  const [replaceFile, setReplaceFile] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const markTouched = (field: string) =>
    setTouched((t) => ({ ...t, [field]: true }))

  const updateField = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Check if any field changed from initial
  const hasChanges =
    formData.title !== initialData.title ||
    formData.abstractVn !== initialData.abstractVn ||
    formData.abstractEn !== initialData.abstractEn ||
    formData.keywords !== initialData.keywords ||
    formData.categoryId !== initialData.categoryId ||
    formData.securityLevel !== initialData.securityLevel ||
    !!newFile

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateAll = (): boolean => {
    const errors: string[] = []
    if (formData.title.trim().length < 5)
      errors.push('Tiêu đề: cần ít nhất 5 ký tự')
    if (formData.abstractVn.trim().length < 30)
      errors.push('Tóm tắt: cần ít nhất 30 ký tự')
    if (formData.keywords.trim().length < 3)
      errors.push('Từ khóa: cần ít nhất 3 ký tự')
    if (newFile && newFile.size > 10 * 1024 * 1024)
      errors.push('File mới quá lớn (tối đa 10MB)')

    if (errors.length > 0) {
      setTouched({ title: true, abstractVn: true, keywords: true })
      toast.error(
        <div className="space-y-1">
          <p className="font-semibold">Vui lòng kiểm tra lại:</p>
          <ul className="list-disc ml-4 text-sm space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>,
        { duration: 8000 }
      )
      return false
    }
    return true
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    if (!hasChanges) {
      toast.info('Không có thay đổi nào để lưu.')
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.title.trim())
      fd.append('abstractVn', formData.abstractVn.trim())
      fd.append('abstractEn', formData.abstractEn.trim())
      fd.append('keywords', formData.keywords.trim())
      fd.append('categoryId', formData.categoryId)
      fd.append('securityLevel', formData.securityLevel)
      if (newFile) fd.append('file', newFile)

      const res = await fetch(`/api/submissions/${submissionId}/edit`, {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Có lỗi xảy ra khi lưu.')
      }

      toast.success('Đã lưu thay đổi thành công!')
      router.push(`/dashboard/author/submissions/${submissionId}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file PDF, DOC, DOCX.')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn. Tối đa 10MB.')
      e.target.value = ''
      return
    }
    setNewFile(file)
  }

  const removeNewFile = () => {
    setNewFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>

      {/* ── Bước 1: Thông tin cơ bản ─────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            1
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Thông tin cơ bản</p>
            <p className="text-xs text-gray-500">Tiêu đề, chuyên mục và phân loại bảo mật</p>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title">
              Tiêu đề bài viết <span aria-hidden>*</span>
            </Label>
            <span
              className={cn(
                'text-xs',
                formData.title.length < 5 ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}
            >
              {formData.title.length}/500
              {formData.title.length < 5 && ' (tối thiểu 5)'}
            </span>
          </div>
          <Input
            id="title"
            required
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            onBlur={() => markTouched('title')}
            aria-invalid={touched.title && !!fieldError('title', formData.title)}
            className={cn(
              touched.title && fieldError('title', formData.title) && 'border-red-500'
            )}
          />
          {touched.title && fieldError('title', formData.title) && (
            <p className="text-xs text-red-500">{fieldError('title', formData.title)}</p>
          )}
        </div>

        {/* Chuyên mục */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">Chuyên mục</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(v) => updateField('categoryId', v)}
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Chọn chuyên mục..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bảo mật */}
        <div className="space-y-2">
          <Label htmlFor="securityLevel">Mức độ bảo mật</Label>
          <Select
            value={formData.securityLevel}
            onValueChange={(v) => updateField('securityLevel', v)}
          >
            <SelectTrigger id="securityLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Công khai</SelectItem>
              <SelectItem value="INTERNAL">Nội bộ</SelectItem>
              <SelectItem value="CONFIDENTIAL">Bảo mật</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* ── Bước 2: Nội dung ─────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            2
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Nội dung</p>
            <p className="text-xs text-gray-500">Tóm tắt và từ khóa</p>
          </div>
        </div>

        {/* Tóm tắt Tiếng Việt */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="abstractVn">
              Tóm tắt (Tiếng Việt) <span aria-hidden>*</span>
            </Label>
            <span
              className={cn(
                'text-xs',
                formData.abstractVn.length < 30 ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}
            >
              {formData.abstractVn.length} ký tự
              {formData.abstractVn.length < 30 && ' (tối thiểu 30)'}
            </span>
          </div>
          <Textarea
            id="abstractVn"
            required
            rows={6}
            value={formData.abstractVn}
            onChange={(e) => updateField('abstractVn', e.target.value)}
            onBlur={() => markTouched('abstractVn')}
            className={cn(
              'resize-y',
              touched.abstractVn && fieldError('abstractVn', formData.abstractVn) && 'border-red-500'
            )}
          />
          {touched.abstractVn && fieldError('abstractVn', formData.abstractVn) && (
            <p className="text-xs text-red-500">
              {fieldError('abstractVn', formData.abstractVn)}
            </p>
          )}
        </div>

        {/* Tóm tắt Tiếng Anh */}
        <div className="space-y-2">
          <Label htmlFor="abstractEn">
            Abstract (Tiếng Anh)
            <span className="ml-1 text-xs text-muted-foreground">(không bắt buộc)</span>
          </Label>
          <Textarea
            id="abstractEn"
            rows={5}
            value={formData.abstractEn}
            onChange={(e) => updateField('abstractEn', e.target.value)}
            className="resize-y"
          />
        </div>

        {/* Từ khóa */}
        <div className="space-y-2">
          <Label htmlFor="keywords">
            Từ khóa <span aria-hidden>*</span>
          </Label>
          <Input
            id="keywords"
            required
            placeholder="nghệ thuật quân sự, chiến thuật, quản lý"
            value={formData.keywords}
            onChange={(e) => updateField('keywords', e.target.value)}
            onBlur={() => markTouched('keywords')}
            className={cn(
              touched.keywords && fieldError('keywords', formData.keywords) && 'border-red-500'
            )}
          />
          <p className="text-xs text-muted-foreground">Ngăn cách bởi dấu phẩy</p>
          {touched.keywords && fieldError('keywords', formData.keywords) && (
            <p className="text-xs text-red-500">
              {fieldError('keywords', formData.keywords)}
            </p>
          )}
        </div>
      </section>

      {/* ── Bước 3: File bản thảo ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            3
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">File bản thảo</p>
            <p className="text-xs text-gray-500">
              Giữ file cũ hoặc thay bằng file mới
            </p>
          </div>
        </div>

        {/* File hiện tại */}
        {currentFile && !replaceFile && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-brand shrink-0" />
              <span className="text-sm font-medium truncate">{currentFile.originalName}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({currentFile.mimeType?.includes('pdf') ? 'PDF' : 'Word'})
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReplaceFile(true)}
              className="shrink-0 ml-2"
            >
              Thay file
            </Button>
          </div>
        )}

        {/* Upload file mới */}
        {(!currentFile || replaceFile) && (
          <div className="space-y-3">
            {replaceFile && currentFile && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    File cũ <strong>{currentFile.originalName}</strong> sẽ bị thay thế sau khi lưu.
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setReplaceFile(false); removeNewFile() }}
                    className="ml-2 h-6 text-xs"
                  >
                    Giữ file cũ
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {newFile ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium truncate">{newFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeNewFile}
                  className="shrink-0 ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nhấn để chọn file bản thảo</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX — tối đa 10MB</p>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        )}
      </section>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/author/submissions/${submissionId}`)}
          disabled={isSubmitting}
        >
          Hủy
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
