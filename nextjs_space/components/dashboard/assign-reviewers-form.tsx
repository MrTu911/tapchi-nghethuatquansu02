'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Sparkles, Search, Users, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ReviewerSuggestionDialog } from './reviewer-suggestion-dialog'

interface Reviewer {
  id: string
  fullName: string
  email: string
  org?: string | null
  role: string
  _count: { reviews: number }
}

interface AssignReviewersFormProps {
  submission: any
  reviewers: Reviewer[]
  currentReviewerIds: string[]
}

const ROLE_LABEL: Record<string, string> = {
  REVIEWER: 'Phản biện viên',
  SECTION_EDITOR: 'BTV chuyên mục',
  MANAGING_EDITOR: 'Thư ký tòa soạn',
  EIC: 'Tổng biên tập',
}

const MIN_REVIEWERS = 2

/** Gợi ý mức độ bận của phản biện viên dựa trên tổng lượt đã nhận (heuristic nhẹ). */
function workloadHint(totalReviews: number): { label: string; className: string } {
  if (totalReviews >= 7) return { label: 'Đang nhiều việc', className: 'text-red-600 dark:text-red-400' }
  if (totalReviews >= 3) return { label: 'Tải vừa', className: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Rảnh', className: 'text-brand dark:text-emerald-400' }
}

export default function AssignReviewersForm({
  submission,
  reviewers,
  currentReviewerIds,
}: AssignReviewersFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>(currentReviewerIds)
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [query, setQuery] = useState('')

  const filteredReviewers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return reviewers
    return reviewers.filter((r) =>
      [r.fullName, r.email, r.org].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    )
  }, [reviewers, query])

  const handleToggleReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedReviewers.length < MIN_REVIEWERS) {
      toast.error(`Vui lòng chọn ít nhất ${MIN_REVIEWERS} phản biện viên`)
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/submissions/${submission.id}/assign-reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerIds: selectedReviewers }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Có lỗi xảy ra khi gán phản biện')
      }
      toast.success('Gán phản biện viên thành công!')
      router.push(`/dashboard/editor/submissions/${submission.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAIAssign = async (reviewerIds: string[]) => {
    setSelectedReviewers((prev) => Array.from(new Set([...prev, ...reviewerIds])))
  }

  const enough = selectedReviewers.length >= MIN_REVIEWERS

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Toolbar: tìm kiếm + gợi ý AI */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, đơn vị…"
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setShowAISuggestion(true)}>
            <Sparkles className="h-4 w-4 text-gold" />
            Gợi ý AI
          </Button>
        </div>

        {/* Danh sách phản biện viên */}
        {filteredReviewers.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>{query ? `Không tìm thấy phản biện viên khớp "${query}"` : 'Chưa có phản biện viên khả dụng'}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReviewers.map((reviewer) => {
              const isSelected = selectedReviewers.includes(reviewer.id)
              const isCurrent = currentReviewerIds.includes(reviewer.id)
              const hint = workloadHint(reviewer._count.reviews)
              return (
                <label
                  key={reviewer.id}
                  htmlFor={reviewer.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:border-brand/40 ${
                    isSelected ? 'border-brand/60 bg-brand/[0.06] ring-1 ring-brand/20' : 'bg-card'
                  }`}
                >
                  <Checkbox
                    id={reviewer.id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleReviewer(reviewer.id)}
                    className="mt-1"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-emerald-600 text-sm font-bold text-white">
                    {reviewer.fullName?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{reviewer.fullName}</span>
                      <Badge variant="outline" className="text-xs">{ROLE_LABEL[reviewer.role] || reviewer.role}</Badge>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Đã gán
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {reviewer.email}{reviewer.org ? ` • ${reviewer.org}` : ''}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{reviewer._count.reviews} lượt phản biện</span>
                      <span className={`font-medium ${hint.className}`}>· {hint.label}</span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {/* Sticky action bar */}
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-brand" />
            <span>
              Đã chọn <strong className={enough ? 'text-brand' : 'text-destructive'}>{selectedReviewers.length}</strong> phản biện viên
            </span>
            {!enough && <span className="text-destructive">· cần tối thiểu {MIN_REVIEWERS}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting || !enough}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentReviewerIds.length > 0 ? 'Cập nhật phản biện viên' : 'Gán phản biện viên'}
            </Button>
          </div>
        </div>
      </form>

      <ReviewerSuggestionDialog
        open={showAISuggestion}
        onClose={() => setShowAISuggestion(false)}
        submissionId={submission.id}
        submissionTitle={submission.title}
        onAssign={handleAIAssign}
      />
    </>
  )
}
