
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search, CheckCircle2, Star, Calendar, FileText, Tag, Eye, ClipboardCheck,
} from 'lucide-react'
import { getRecommendationConfig, getScoreTextClass } from '@/lib/review-status'

interface CompletedReview {
  id: string
  roundNo: number
  score: number | null
  recommendation: string | null
  submittedAt: string | null
  submission: {
    code: string
    title: string
    category: { name: string } | null
  }
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">N/A</span>
  return (
    <span className={`text-sm font-bold ${getScoreTextClass(score)} flex items-center gap-1`}>
      <Star className="w-3.5 h-3.5" />
      {score}/100
    </span>
  )
}

export default function ReviewerAssignmentsCompleted({ reviews }: { reviews: CompletedReview[] }) {
  const [keyword, setKeyword] = useState('')

  const filtered = reviews.filter((r) => {
    if (!keyword.trim()) return true
    const q = keyword.toLowerCase()
    return (
      r.submission.title.toLowerCase().includes(q) ||
      r.submission.code.toLowerCase().includes(q) ||
      (r.submission.category?.name?.toLowerCase().includes(q) ?? false)
    )
  })

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Chưa có phản biện nào hoàn thành
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Các phản biện đã nộp sẽ xuất hiện ở đây.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl"
          placeholder="Tìm theo tên bài, mã, chuyên mục..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Không tìm thấy bài nào phù hợp.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((review) => {
          const rec = review.recommendation ? getRecommendationConfig(review.recommendation) : null
          return (
            <div
              key={review.id}
              className="rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-400 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {review.submission.title}
                    </h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Vòng {review.roundNo}
                    </Badge>
                    {rec && (
                      <Badge variant="outline" className={`text-xs ${rec.badgeClass}`}>
                        {rec.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-mono">{review.submission.code}</span>
                    </span>
                    {review.submission.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {review.submission.category.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {review.submittedAt
                        ? new Date(review.submittedAt).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </span>
                    <ScoreBadge score={review.score} />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm" asChild className="rounded-lg border-slate-200 hover:border-emerald-400 hover:text-emerald-600">
                    <Link href={`/dashboard/reviewer/review/${review.id}`}>
                      <Eye className="w-4 h-4 mr-1.5" />
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
