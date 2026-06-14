'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  UserCheck,
  Star,
  BookOpen,
  Key,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewerSuggestion {
  rank: number
  reviewerId: string
  fullName: string
  email: string
  org: string | null
  expertise: string[]
  totalReviews: number
  averageRating: number
  activeReviews: number
  score: number
  breakdown: {
    expertiseMatch: number
    keywordMatch: number
    availabilityScore: number
  }
}

interface ReviewerSuggestionPanelProps {
  submissionId: string
}

function ScoreBar({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
    </div>
  )
}

function SuggestionCard({
  suggestion,
  onAssign,
  isAssigning,
}: {
  suggestion: ReviewerSuggestion
  onAssign: (reviewerId: string) => void
  isAssigning: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const overallPct = Math.round(suggestion.score * 100)
  const ringColor =
    overallPct >= 70
      ? 'ring-green-500/40 bg-green-50 dark:bg-green-950/20'
      : overallPct >= 40
      ? 'ring-amber-500/40 bg-amber-50 dark:bg-amber-950/20'
      : 'ring-slate-300 bg-muted/50'

  return (
    <div className={cn('rounded-lg border ring-1 p-4 space-y-3', ringColor)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Rank badge */}
          <div
            className={cn(
              'shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold',
              suggestion.rank === 1
                ? 'bg-amber-400 text-amber-900'
                : suggestion.rank === 2
                ? 'bg-slate-300 text-slate-700'
                : suggestion.rank === 3
                ? 'bg-orange-300 text-orange-900'
                : 'bg-muted text-muted-foreground'
            )}
          >
            #{suggestion.rank}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{suggestion.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{suggestion.email}</p>
            {suggestion.org && (
              <p className="text-xs text-muted-foreground truncate">{suggestion.org}</p>
            )}
          </div>
        </div>

        {/* Overall score */}
        <div className="shrink-0 text-center">
          <div
            className={cn(
              'text-lg font-bold tabular-nums',
              overallPct >= 70
                ? 'text-green-600'
                : overallPct >= 40
                ? 'text-amber-600'
                : 'text-muted-foreground'
            )}
          >
            {overallPct}%
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight">
            Phù hợp
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Star className="h-3 w-3" aria-hidden="true" />
          {suggestion.averageRating > 0
            ? suggestion.averageRating.toFixed(1)
            : 'Chưa có'}{' '}
          / 5
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          {suggestion.totalReviews} phản biện
        </span>
        <span
          className={cn(
            'flex items-center gap-1',
            suggestion.activeReviews >= 4
              ? 'text-red-500'
              : 'text-muted-foreground'
          )}
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          {suggestion.activeReviews} đang chờ
        </span>
      </div>

      {/* Expertise badges (truncated) */}
      {suggestion.expertise.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestion.expertise.slice(0, 3).map(exp => (
            <Badge key={exp} variant="secondary" className="text-[10px] py-0">
              {exp}
            </Badge>
          ))}
          {suggestion.expertise.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0">
              +{suggestion.expertise.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Expandable breakdown */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
        Chi tiết điểm
      </button>

      {expanded && (
        <div className="space-y-2 pt-1">
          <ScoreBar
            label="Từ khóa"
            value={suggestion.breakdown.keywordMatch}
            icon={<Key className="h-3 w-3" aria-hidden="true" />}
          />
          <ScoreBar
            label="Chuyên môn"
            value={suggestion.breakdown.expertiseMatch}
            icon={<BookOpen className="h-3 w-3" aria-hidden="true" />}
          />
          <ScoreBar
            label="Khả năng nhận"
            value={suggestion.breakdown.availabilityScore}
            icon={<Clock className="h-3 w-3" aria-hidden="true" />}
          />
        </div>
      )}

      {/* Assign button */}
      <Button
        size="sm"
        className="w-full"
        onClick={() => onAssign(suggestion.reviewerId)}
        disabled={isAssigning}
        aria-label={`Gán ${suggestion.fullName} làm phản biện`}
      >
        {isAssigning ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        ) : (
          <UserCheck className="h-4 w-4 mr-2" aria-hidden="true" />
        )}
        Gán phản biện
      </Button>
    </div>
  )
}

export function ReviewerSuggestionPanel({
  submissionId,
}: ReviewerSuggestionPanelProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<ReviewerSuggestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    setSuggestions(null)
    setAssignSuccess(null)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/suggest-reviewers`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Không thể lấy gợi ý')
      } else {
        setSuggestions(json.data)
      }
    } catch {
      setError('Lỗi kết nối — thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(reviewerId: string) {
    setAssigningId(reviewerId)
    setError(null)
    try {
      // Build new reviewer list: all currently pending reviewers + this one
      // For simplicity we post a single-reviewer add; the assign-reviewers API
      // needs at least 2. Instead, navigate to the assign page with reviewer pre-selected.
      router.push(
        `/dashboard/editor/assign-reviewers?submissionId=${submissionId}&suggested=${reviewerId}`
      )
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="space-y-3">
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Gợi ý phản biện (AI)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xếp hạng dựa trên từ khóa, chuyên môn và khả năng nhận phản biện
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" aria-hidden="true" />
          )}
          {suggestions ? 'Làm mới' : 'Gợi ý tự động'}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {assignSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
        >
          <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {assignSuccess}
        </div>
      )}

      {suggestions !== null && suggestions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Không tìm thấy phản biện viên phù hợp hoặc tất cả đã được gán.
        </p>
      )}

      {suggestions !== null && suggestions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.reviewerId}
              suggestion={suggestion}
              onAssign={handleAssign}
              isAssigning={assigningId === suggestion.reviewerId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
