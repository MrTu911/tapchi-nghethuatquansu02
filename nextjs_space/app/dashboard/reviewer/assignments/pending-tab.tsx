
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Clock, Search, ChevronRight, AlertTriangle, BookOpen, Calendar,
  Tag, FileText, Inbox, MailQuestion,
} from 'lucide-react'
import ReviewInviteActions from '@/components/dashboard/review-invite-actions'

interface PendingReview {
  id: string
  roundNo: number
  invitedAt: string | null
  acceptedAt: string | Date | null
  deadline: Date | null
  daysWaiting: number
  daysLeft: number | null
  isOverdue: boolean
  submission: {
    id: string
    code: string
    title: string
    abstractVn: string | null
    keywords: string[]
    createdAt: string
    category: { name: string } | null
    author: { fullName: string; email: string; org: string | null }
  }
}

function urgencyConfig(review: PendingReview) {
  if (review.isOverdue) {
    return {
      borderClass: 'border-l-4 border-l-red-500',
      bg: 'bg-red-50/50 dark:bg-red-900/10',
      badge: <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Quá hạn</Badge>,
      deadlineText: (
        <span className="text-red-600 font-medium text-xs flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Quá hạn {review.daysLeft !== null ? `${Math.abs(review.daysLeft)} ngày` : ''}
        </span>
      ),
    }
  }
  if (review.daysLeft !== null && review.daysLeft <= 3) {
    return {
      borderClass: 'border-l-4 border-l-orange-400',
      bg: 'bg-orange-50/40 dark:bg-orange-900/10',
      badge: <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Gấp</Badge>,
      deadlineText: (
        <span className="text-orange-600 font-medium text-xs flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Còn {review.daysLeft} ngày
        </span>
      ),
    }
  }
  return {
    borderClass: 'border-l-4 border-l-slate-200 dark:border-l-slate-600',
    bg: 'bg-white dark:bg-slate-800/60',
    badge: null,
    deadlineText: review.daysLeft !== null ? (
      <span className="text-slate-500 text-xs flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        Còn {review.daysLeft} ngày
      </span>
    ) : null,
  }
}

export default function ReviewerAssignmentsPending({ reviews }: { reviews: PendingReview[] }) {
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
        <Inbox className="w-16 h-16 text-brand/40 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Không có bài nào đang chờ
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Bạn đã hoàn thành tất cả phản biện được gán!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
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
          const cfg = urgencyConfig(review)
          return (
            <div
              key={review.id}
              className={`rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-md ${cfg.bg} ${cfg.borderClass}`}
            >
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-4">
                {/* Left: info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {review.submission.title}
                    </h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Vòng {review.roundNo}
                    </Badge>
                    {!review.acceptedAt && (
                      <Badge variant="outline" className="text-xs flex-shrink-0 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <MailQuestion className="mr-1 h-3 w-3" />
                        Chờ nhận lời
                      </Badge>
                    )}
                    {cfg.badge}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                      <Clock className="w-3.5 h-3.5" />
                      Gán {review.daysWaiting} ngày trước
                    </span>
                    {cfg.deadlineText}
                  </div>

                  {review.submission.abstractVn && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {review.submission.abstractVn}
                    </p>
                  )}

                  {review.submission.keywords && review.submission.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {review.submission.keywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                      {review.submission.keywords.length > 4 && (
                        <span className="text-[11px] text-muted-foreground px-1">
                          +{review.submission.keywords.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: action — chưa nhận lời thì hiện Đồng ý/Từ chối, đã nhận thì vào phản biện */}
                <div className="flex-shrink-0 flex md:flex-col gap-2 items-start md:items-end">
                  {review.acceptedAt ? (
                    <Button asChild size="sm" className="shadow-sm">
                      <Link href={`/dashboard/reviewer/review/${review.id}`}>
                        <BookOpen className="w-4 h-4 mr-1.5" />
                        Phản biện
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <div className="space-y-2 md:text-right">
                      <ReviewInviteActions reviewId={review.id} compact />
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                        <Link href={`/dashboard/reviewer/review/${review.id}`}>Xem chi tiết bài</Link>
                      </Button>
                    </div>
                  )}
                  {review.deadline && (
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                      Hạn: {new Date(review.deadline).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
