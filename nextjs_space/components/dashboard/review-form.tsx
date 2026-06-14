'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, Send, ShieldCheck, Lock, Info, Star } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  RECOMMENDATION_CONFIG,
  type RecommendationKey,
  getScoreTextClass,
} from '@/lib/review-status'

interface ReviewFormProps {
  review: any
  /** Reviewer còn được chỉnh sửa hay không (server tính theo quyết định BTV). */
  canEdit?: boolean
}

const RECOMMENDATION_ORDER: RecommendationKey[] = ['ACCEPT', 'MINOR', 'MAJOR', 'REJECT']

const CRITERIA: { key: string; label: string; placeholder: string }[] = [
  { key: 'novelty', label: '1. Tính mới và độc đáo', placeholder: 'Bài viết có đóng góp gì mới cho lĩnh vực?' },
  { key: 'methodology', label: '2. Phương pháp nghiên cứu', placeholder: 'Phương pháp nghiên cứu có phù hợp và chặt chẽ không?' },
  { key: 'results', label: '3. Kết quả và phân tích', placeholder: 'Kết quả có rõ ràng, chính xác và đủ hỗ trợ cho kết luận không?' },
  { key: 'presentation', label: '4. Trình bày và cấu trúc', placeholder: 'Bài viết có cấu trúc tốt, dễ đọc và dễ hiểu không?' },
  { key: 'references', label: '5. Tài liệu tham khảo', placeholder: 'Trích dẫn có đầy đủ, phù hợp và cập nhật không?' },
]

export default function ReviewForm({ review, canEdit = true }: ReviewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const isReadOnly = !canEdit
  const wasSubmitted = !!review.submittedAt
  const existingFormData = review.formJson || {}

  const [formData, setFormData] = useState({
    score: review.score || 0,
    recommendation: (review.recommendation || '') as RecommendationKey | '',
    novelty: existingFormData.novelty || '',
    methodology: existingFormData.methodology || '',
    results: existingFormData.results || '',
    presentation: existingFormData.presentation || '',
    references: existingFormData.references || '',
    strengths: existingFormData.strengths || '',
    weaknesses: existingFormData.weaknesses || '',
    comments: existingFormData.comments || '',
    confidentialComments: existingFormData.confidentialComments || '',
  })

  const setField = (key: keyof typeof formData, value: string | number) =>
    setFormData((prev) => ({ ...prev, [key]: value }))

  const handleSaveDraft = async () => {
    if (isReadOnly) return
    setIsSavingDraft(true)
    try {
      const response = await fetch(`/api/reviews/${review.id}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('draft failed')
      toast.success('Đã lưu nháp phản biện')
      router.refresh()
    } catch (error) {
      toast.error('Không lưu được nháp. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Có lỗi xảy ra khi nộp phản biện')
      }
      toast.success(wasSubmitted ? 'Cập nhật phản biện thành công!' : 'Nộp phản biện thành công!')
      router.push('/dashboard/reviewer')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Đã nộp nhưng còn sửa được */}
      {wasSubmitted && canEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <p className="text-foreground/80">
            Bạn đã nộp phản biện này. Bạn <strong>vẫn có thể chỉnh sửa</strong> cho tới khi
            biên tập viên ra quyết định cho vòng phản biện.
          </p>
        </div>
      )}

      {/* ── 1. Đánh giá tổng quan ───────────────────────────────── */}
      <section className="space-y-4">
        <h4 className="flex items-center gap-2 text-base font-semibold">
          <Star className="h-4 w-4 text-gold" />
          Đánh giá tổng quan
        </h4>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Score */}
          <div className="space-y-2">
            <Label htmlFor="score">Điểm tổng thể (0–100) <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-3">
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                required
                disabled={isReadOnly}
                value={formData.score}
                onChange={(e) => setField('score', parseInt(e.target.value) || 0)}
                placeholder="0–100"
                className="max-w-[140px]"
              />
              <span className={`text-2xl font-bold tabular-nums ${getScoreTextClass(Number(formData.score))}`}>
                {Number(formData.score) || 0}
              </span>
            </div>
          </div>

          {/* Recommendation chips */}
          <div className="space-y-2">
            <Label>Khuyến nghị <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {RECOMMENDATION_ORDER.map((key) => {
                const cfg = RECOMMENDATION_CONFIG[key]
                const selected = formData.recommendation === key
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setField('recommendation', key)}
                    className={[
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
                      selected ? cfg.solidClass + ' border-transparent shadow-sm' : 'border-border bg-background hover:bg-muted',
                    ].join(' ')}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── 2. Tiêu chí chi tiết ────────────────────────────────── */}
      <section className="space-y-4">
        <h4 className="text-base font-semibold">Đánh giá chi tiết</h4>
        {CRITERIA.map((c) => (
          <div key={c.key} className="space-y-2">
            <Label htmlFor={c.key}>{c.label} <span className="text-red-500">*</span></Label>
            <Textarea
              id={c.key}
              required
              disabled={isReadOnly}
              value={formData[c.key as keyof typeof formData] as string}
              onChange={(e) => setField(c.key as keyof typeof formData, e.target.value)}
              placeholder={c.placeholder}
              rows={3}
            />
          </div>
        ))}
      </section>

      <Separator />

      {/* ── 3. Điểm mạnh / điểm yếu ─────────────────────────────── */}
      <section className="space-y-4">
        <h4 className="text-base font-semibold">Điểm mạnh và điểm yếu</h4>
        <div className="space-y-2">
          <Label htmlFor="strengths">Điểm mạnh <span className="text-red-500">*</span></Label>
          <Textarea
            id="strengths"
            required
            disabled={isReadOnly}
            value={formData.strengths}
            onChange={(e) => setField('strengths', e.target.value)}
            placeholder="Liệt kê các điểm mạnh của bài viết"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weaknesses">Điểm yếu và đề xuất cải thiện <span className="text-red-500">*</span></Label>
          <Textarea
            id="weaknesses"
            required
            disabled={isReadOnly}
            value={formData.weaknesses}
            onChange={(e) => setField('weaknesses', e.target.value)}
            placeholder="Liệt kê các điểm yếu và đề xuất cách cải thiện"
            rows={4}
          />
        </div>
      </section>

      <Separator />

      {/* ── 4. Nhận xét ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Nhận xét dành cho tác giả <span className="text-red-500">*</span></Label>
          <Textarea
            id="comments"
            required
            disabled={isReadOnly}
            value={formData.comments}
            onChange={(e) => setField('comments', e.target.value)}
            placeholder="Nhận xét và góp ý dành cho tác giả"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">Nhận xét này sẽ được gửi cho tác giả.</p>
        </div>

        {/* Khối bảo mật — tách rõ về thị giác để tránh nhầm với nhận xét cho tác giả */}
        <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
          <Label htmlFor="confidentialComments" className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <ShieldCheck className="h-4 w-4" />
            Nhận xét bảo mật cho biên tập
          </Label>
          <Textarea
            id="confidentialComments"
            disabled={isReadOnly}
            value={formData.confidentialComments}
            onChange={(e) => setField('confidentialComments', e.target.value)}
            placeholder="Nhận xét riêng cho biên tập viên (không gửi cho tác giả)"
            rows={4}
            className="bg-background"
          />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Nội dung này chỉ biên tập viên mới xem được — không hiển thị cho tác giả.
          </p>
        </div>
      </section>

      {/* ── Sticky action bar ───────────────────────────────────── */}
      {!isReadOnly && (
        <div className="sticky bottom-0 -mx-6 mt-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button type="submit" disabled={isSubmitting || isSavingDraft}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {wasSubmitted ? 'Cập nhật phản biện' : 'Nộp phản biện'}
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting || isSavingDraft}>
            {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu nháp
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting || isSavingDraft}>
            Hủy
          </Button>
        </div>
      )}

      {/* Khóa: đã có quyết định biên tập */}
      {isReadOnly && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Lock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Phản biện đã khóa</p>
            <p className="mt-1 text-sm">
              {review.submittedAt
                ? `Bạn đã nộp phản biện vào ${new Date(review.submittedAt).toLocaleDateString('vi-VN')}. Biên tập đã ra quyết định nên không thể chỉnh sửa.`
                : 'Không thể chỉnh sửa phản biện này.'}
            </p>
          </div>
        </div>
      )}
    </form>
  )
}
