'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  RotateCcw,
  X,
  FileText,
  BookOpen,
  Paperclip,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilePreview } from '@/components/dashboard/file-preview'

// ── Constants ─────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'tapchi_submission_draft'
const AUTOSAVE_DELAY_MS = 1500

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  code: string
  name: string
  slug: string
  description: string | null
}

interface SubmissionFormEnhancedProps {
  categories: Category[]
}

interface DraftData {
  title: string
  abstractVn: string
  abstractEn: string
  keywords: string
  section: string
  categoryId: string
  securityLevel: string
  savedAt: string
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: 'Thông tin',
    icon: FileText,
    requiredFields: ['title', 'categoryId'] as const,
    description: 'Tiêu đề, chuyên mục, bảo mật',
  },
  {
    id: 2,
    label: 'Nội dung',
    icon: BookOpen,
    requiredFields: ['abstractVn', 'keywords'] as const,
    description: 'Tóm tắt và từ khóa',
  },
  {
    id: 3,
    label: 'File & Nộp',
    icon: Paperclip,
    requiredFields: ['file'] as const,
    description: 'Tải lên bản thảo',
  },
]

// ── Helper: check field validity (independent of touched state) ───────────────

function isFieldValid(field: string, formData: { title: string; abstractVn: string; keywords: string; categoryId: string; file: File | null }) {
  switch (field) {
    case 'title':     return formData.title.trim().length >= 5
    case 'abstractVn': return formData.abstractVn.trim().length >= 30
    case 'keywords':  return formData.keywords.trim().length >= 3
    case 'categoryId': return !!formData.categoryId
    case 'file':      return !!formData.file && formData.file.size <= 10 * 1024 * 1024
    default:          return true
  }
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({
  formData,
}: {
  formData: { title: string; abstractVn: string; keywords: string; categoryId: string; file: File | null }
}) {
  return (
    <nav aria-label="Tiến trình nộp bài" className="mb-8">
      <ol className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const allRequired = step.requiredFields.every(f => isFieldValid(f, formData))
          const anyFilled = step.requiredFields.some(f => {
            if (f === 'file') return !!formData.file
            return (formData[f as keyof typeof formData] as string).trim().length > 0
          })

          const state: 'complete' | 'partial' | 'empty' =
            allRequired ? 'complete' : anyFilled ? 'partial' : 'empty'

          const Icon = step.icon

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                    state === 'complete'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : state === 'partial'
                      ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400',
                  )}
                  aria-label={`Bước ${step.id}: ${step.label} — ${state === 'complete' ? 'Hoàn thành' : state === 'partial' ? 'Đang điền' : 'Chưa bắt đầu'}`}
                >
                  {state === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium text-center leading-tight',
                    state === 'complete' ? 'text-emerald-600 dark:text-emerald-400'
                    : state === 'partial' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-0.5 mx-2 mt-[-18px] transition-colors',
                    state === 'complete'
                      ? 'bg-emerald-400'
                      : 'bg-gray-200 dark:bg-gray-700',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Draft Restore Banner ──────────────────────────────────────────────────────

function DraftBanner({
  draft,
  onRestore,
  onDiscard,
}: {
  draft: DraftData
  onRestore: () => void
  onDiscard: () => void
}) {
  const savedAt = new Date(draft.savedAt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 mb-6"
    >
      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Bạn có bản nháp chưa hoàn thành (đã lưu {savedAt})
        </p>
        {draft.title && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">
            &ldquo;{draft.title}&rdquo;
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
          onClick={onRestore}
        >
          <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
          Khôi phục
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
          onClick={onDiscard}
          aria-label="Bỏ bản nháp"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ── Autosave Indicator ────────────────────────────────────────────────────────

function AutosaveIndicator({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) return null
  const timeStr = savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return (
    <span className="text-[11px] text-gray-400 flex items-center gap-1" aria-live="polite" aria-atomic="true">
      <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
      Đã lưu nháp lúc {timeStr}
    </span>
  )
}

// ── Section Heading ───────────────────────────────────────────────────────────

function SectionHeading({ step, label, description }: { step: number; label: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
        {step}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SubmissionFormEnhanced({ categories }: SubmissionFormEnhancedProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    abstractVn: '',
    abstractEn: '',
    keywords: '',
    section: '',
    categoryId: '',
    securityLevel: 'PUBLIC',
    file: null as File | null,
  })

  // Track touched fields for aria-invalid
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const markTouched = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  // Draft & autosave state
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── On mount: check for existing draft ─────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw) as DraftData
        // Only show restore banner if draft has some content
        if (draft.title || draft.abstractVn || draft.keywords) {
          setPendingDraft(draft)
        }
      }
    } catch {
      // Corrupt draft — silently ignore
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  // ── beforeunload guard ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers show their own message, but setting returnValue triggers the dialog
      e.returnValue = 'Bạn có thay đổi chưa được lưu. Rời trang?'
    }

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ── Autosave: debounce 1.5s after last text change ─────────────────────────
  const scheduleSave = useCallback((data: typeof formData) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      try {
        const draft: DraftData = {
          title: data.title,
          abstractVn: data.abstractVn,
          abstractEn: data.abstractEn,
          keywords: data.keywords,
          section: data.section,
          categoryId: data.categoryId,
          securityLevel: data.securityLevel,
          savedAt: new Date().toISOString(),
        }
        // Only save if there's meaningful content (avoid empty saves on first render)
        if (draft.title || draft.abstractVn || draft.keywords) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
          setLastSavedAt(new Date())
        }
      } catch {
        // Storage quota or private mode — fail silently
      }
    }, AUTOSAVE_DELAY_MS)
  }, [])

  const updateFormData = useCallback(
    (patch: Partial<typeof formData>) => {
      setFormData(prev => {
        const next = { ...prev, ...patch }
        setIsDirty(true)
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  // ── Restore draft ───────────────────────────────────────────────────────────
  const handleRestoreDraft = useCallback(() => {
    if (!pendingDraft) return
    setFormData(prev => ({
      ...prev,
      title: pendingDraft.title,
      abstractVn: pendingDraft.abstractVn,
      abstractEn: pendingDraft.abstractEn,
      keywords: pendingDraft.keywords,
      section: pendingDraft.section,
      categoryId: pendingDraft.categoryId,
      securityLevel: pendingDraft.securityLevel,
      // file cannot be restored from localStorage
    }))
    setPendingDraft(null)
    setLastSavedAt(new Date(pendingDraft.savedAt))
    toast.info('Đã khôi phục bản nháp. File bản thảo cần tải lên lại.')
  }, [pendingDraft])

  const handleDiscardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setPendingDraft(null)
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setLastSavedAt(null)
    setIsDirty(false)
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
  }, [])

  // ── Validation ──────────────────────────────────────────────────────────────
  const isInvalid = {
    title: touched.title && formData.title.trim().length < 5,
    abstractVn: touched.abstractVn && formData.abstractVn.trim().length < 30,
    keywords: touched.keywords && formData.keywords.trim().length < 3,
    categoryId: touched.categoryId && !formData.categoryId,
    file: touched.file && !formData.file,
  }

  const validateBeforeSubmit = (): boolean => {
    const errors: string[] = []
    if (formData.title.trim().length < 5)
      errors.push(`Tiêu đề: Cần ít nhất 5 ký tự (hiện tại: ${formData.title.trim().length})`)
    if (formData.abstractVn.trim().length < 30)
      errors.push(`Tóm tắt: Cần ít nhất 30 ký tự (hiện tại: ${formData.abstractVn.trim().length})`)
    if (formData.keywords.trim().length < 3)
      errors.push(`Từ khóa: Cần ít nhất 3 ký tự (hiện tại: ${formData.keywords.trim().length})`)
    if (!formData.categoryId)
      errors.push('Chuyên mục: Vui lòng chọn chuyên mục')
    if (!formData.file)
      errors.push('File bản thảo: Vui lòng tải lên file bản thảo')
    else if (formData.file.size > 10 * 1024 * 1024)
      errors.push(`File: Dung lượng ${(formData.file.size / (1024 * 1024)).toFixed(2)}MB vượt quá 10MB`)

    if (errors.length > 0) {
      setTouched({ title: true, abstractVn: true, keywords: true, categoryId: true, file: true })
      toast.error(
        <div className="space-y-2">
          <p className="font-bold">Vui lòng kiểm tra lại:</p>
          <ul className="list-disc ml-4 space-y-1">
            {errors.map((err, i) => <li key={i} className="text-sm">{err}</li>)}
          </ul>
        </div>,
        { duration: 10000 },
      )
      return false
    }
    return true
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateBeforeSubmit()) return
    setIsSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('title', formData.title.trim())
      fd.append('abstractVn', formData.abstractVn.trim())
      fd.append('abstractEn', formData.abstractEn.trim())
      fd.append('keywords', formData.keywords.trim())
      fd.append('section', formData.section.trim())
      fd.append('categoryId', formData.categoryId)
      fd.append('securityLevel', formData.securityLevel)
      if (formData.file) fd.append('file', formData.file)

      const response = await fetch('/api/submissions', { method: 'POST', body: fd })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi nộp bài' }))
        if (errorData.details && typeof errorData.details === 'object') {
          const detailErrors = Object.entries(errorData.details).map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages]
            return `${field}: ${msgArray.join(', ')}`
          })
          toast.error(
            <div className="space-y-2">
              <p className="font-bold">Lỗi validation:</p>
              <ul className="list-disc ml-4 space-y-1">
                {detailErrors.map((err, i) => <li key={i} className="text-sm">{err}</li>)}
              </ul>
            </div>,
            { duration: 10000 },
          )
          return
        }
        throw new Error(errorData.error || 'Có lỗi xảy ra khi nộp bài')
      }

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Có lỗi xảy ra khi nộp bài')

      // Clear draft on success — no more beforeunload warning
      clearDraft()
      toast.success('Nộp bài thành công!')

      const submissionId = result.data?.id || result.id
      router.push(submissionId ? `/dashboard/author/submissions/${submissionId}` : '/dashboard/author/submissions')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Step progress */}
      <StepBar formData={formData} />

      {/* Draft restore banner */}
      {pendingDraft && (
        <DraftBanner
          draft={pendingDraft}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate aria-label="Form nộp bài báo">

        {/* ── Bước 1: Thông tin cơ bản ───────────────────────────────── */}
        <section aria-labelledby="step1-heading" className="space-y-5">
          <SectionHeading
            step={1}
            label="Thông tin cơ bản"
            description="Tiêu đề, chuyên mục và phân loại bảo mật"
          />

          {/* Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title">
                Tiêu đề bài viết <span aria-hidden="true">*</span>
                <span className="sr-only">(bắt buộc)</span>
              </Label>
              <span
                id="title-hint"
                aria-live="polite"
                className={`text-xs ${formData.title.length < 5 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}
              >
                {formData.title.length}/500
                {formData.title.length < 5 && ' (tối thiểu 5)'}
              </span>
            </div>
            <Input
              id="title"
              required
              aria-required="true"
              aria-describedby="title-hint"
              aria-invalid={isInvalid.title || undefined}
              value={formData.title}
              onChange={e => updateFormData({ title: e.target.value })}
              onBlur={() => markTouched('title')}
              placeholder="Nhập tiêu đề bài viết (tối thiểu 5 ký tự)"
            />
            {isInvalid.title && (
              <p role="alert" className="text-xs text-red-500">Tiêu đề cần ít nhất 5 ký tự</p>
            )}
          </div>

          {/* Category + Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Chuyên mục <span aria-hidden="true">*</span>
                <span className="sr-only">(bắt buộc)</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={value => {
                  updateFormData({ categoryId: value })
                  markTouched('categoryId')
                }}
                required
              >
                <SelectTrigger
                  id="categoryId"
                  aria-required="true"
                  aria-invalid={isInvalid.categoryId || undefined}
                  onBlur={() => markTouched('categoryId')}
                >
                  <SelectValue placeholder="Chọn chuyên mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid.categoryId && (
                <p role="alert" className="text-xs text-red-500">Vui lòng chọn chuyên mục</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Mục</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={e => updateFormData({ section: e.target.value })}
                placeholder="Ví dụ: Nghiên cứu khoa học"
              />
            </div>
          </div>

          {/* Security level */}
          <div className="space-y-2">
            <Label htmlFor="securityLevel">Mức độ bảo mật</Label>
            <Select
              value={formData.securityLevel}
              onValueChange={value => updateFormData({ securityLevel: value })}
            >
              <SelectTrigger id="securityLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Công khai</SelectItem>
                <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
                <SelectItem value="SECRET">Tối mật</SelectItem>
                <SelectItem value="TOP_SECRET">Tuyệt mật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* ── Bước 2: Nội dung khoa học ──────────────────────────────── */}
        <section aria-labelledby="step2-heading" className="space-y-5">
          <SectionHeading
            step={2}
            label="Nội dung khoa học"
            description="Tóm tắt tiếng Việt, tiếng Anh và từ khóa"
          />

          {/* Abstract VN */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="abstractVn">
                Tóm tắt (Tiếng Việt) <span aria-hidden="true">*</span>
                <span className="sr-only">(bắt buộc)</span>
              </Label>
              <span
                id="abstractVn-hint"
                aria-live="polite"
                className={`text-xs ${formData.abstractVn.length < 30 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}
              >
                {formData.abstractVn.length}/5000
                {formData.abstractVn.length < 30 && ' (tối thiểu 30)'}
              </span>
            </div>
            <Textarea
              id="abstractVn"
              required
              aria-required="true"
              aria-describedby="abstractVn-hint"
              aria-invalid={isInvalid.abstractVn || undefined}
              value={formData.abstractVn}
              onChange={e => updateFormData({ abstractVn: e.target.value })}
              onBlur={() => markTouched('abstractVn')}
              placeholder="Nhập tóm tắt bài viết bằng tiếng Việt (tối thiểu 30 ký tự)"
              rows={5}
            />
            {isInvalid.abstractVn && (
              <p role="alert" className="text-xs text-red-500">Tóm tắt cần ít nhất 30 ký tự</p>
            )}
          </div>

          {/* Abstract EN */}
          <div className="space-y-2">
            <Label htmlFor="abstractEn">Tóm tắt (Tiếng Anh)</Label>
            <Textarea
              id="abstractEn"
              value={formData.abstractEn}
              onChange={e => updateFormData({ abstractEn: e.target.value })}
              placeholder="Enter abstract in English (150–250 words)"
              rows={5}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="keywords">
                Từ khóa <span aria-hidden="true">*</span>
                <span className="sr-only">(bắt buộc)</span>
              </Label>
              <span
                id="keywords-hint"
                aria-live="polite"
                className={`text-xs ${formData.keywords.length < 3 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}
              >
                {formData.keywords.length}/500
                {formData.keywords.length < 3 && ' (tối thiểu 3)'}
              </span>
            </div>
            <Input
              id="keywords"
              required
              aria-required="true"
              aria-describedby="keywords-hint keywords-example"
              aria-invalid={isInvalid.keywords || undefined}
              value={formData.keywords}
              onChange={e => updateFormData({ keywords: e.target.value })}
              onBlur={() => markTouched('keywords')}
              placeholder="Nhập từ khóa, ngăn cách bởi dấu phẩy"
            />
            <p id="keywords-example" className="text-xs text-muted-foreground">
              Ví dụ: nghệ thuật quân sự, khoa học công nghệ, quốc phòng
            </p>
            {isInvalid.keywords && (
              <p role="alert" className="text-xs text-red-500">Từ khóa cần ít nhất 3 ký tự</p>
            )}
          </div>
        </section>

        {/* ── Bước 3: File bản thảo ──────────────────────────────────── */}
        <section aria-labelledby="step3-heading" className="space-y-5">
          <SectionHeading
            step={3}
            label="File bản thảo"
            description="Tải lên file PDF hoặc DOCX, tối đa 10MB"
          />

          <div className="space-y-2">
            <Label htmlFor="file">
              File bản thảo <span aria-hidden="true">*</span>
              <span className="sr-only">(bắt buộc)</span>
            </Label>

            {/* Drop-zone styled upload area */}
            <label
              htmlFor="file"
              className={cn(
                'flex flex-col items-center justify-center gap-3 px-4 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                formData.file
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
                  : isInvalid.file
                  ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50',
              )}
            >
              {formData.file ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {(formData.file.size / (1024 * 1024)).toFixed(2)} MB — Nhấp để thay đổi
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Kéo thả file vào đây hoặc nhấp để chọn
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      PDF, DOC, DOCX — tối đa 10MB
                    </p>
                  </div>
                </>
              )}
              <Input
                id="file"
                type="file"
                required
                aria-required="true"
                aria-describedby="file-hint"
                aria-invalid={isInvalid.file || undefined}
                onChange={e => {
                  updateFormData({ file: e.target.files?.[0] || null })
                  markTouched('file')
                }}
                accept=".pdf,.doc,.docx"
                className="sr-only"
              />
            </label>

            <p id="file-hint" className="text-xs text-muted-foreground">
              Chấp nhận file PDF, DOC, DOCX. Dung lượng tối đa 10MB.
            </p>
            {isInvalid.file && (
              <p role="alert" className="text-xs text-red-500">Vui lòng tải lên file bản thảo</p>
            )}
          </div>

          {/* Xem trước file TRƯỚC khi nộp */}
          {formData.file && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Xem trước bản thảo</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                  {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
                </Button>
              </div>
              {showPreview && (
                <FilePreview
                  file={formData.file}
                  title="Xem trước bản thảo (chưa nộp)"
                  height="560px"
                />
              )}
            </div>
          )}
        </section>

        {/* ── Action bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <AutosaveIndicator savedAt={lastSavedAt} />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Đang nộp bài…' : 'Nộp bài'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
