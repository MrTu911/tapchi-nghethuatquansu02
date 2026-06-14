'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, X } from 'lucide-react'

interface ReviewInviteActionsProps {
  reviewId: string
  /** compact: dùng trong thẻ danh sách (nút nhỏ, gọn). */
  compact?: boolean
}

/**
 * Nút Đồng ý / Từ chối lời mời phản biện (gọi POST /api/reviews/[id]/respond).
 * Khi từ chối, mở ô nhập lý do (tùy chọn) trước khi xác nhận.
 */
export default function ReviewInviteActions({ reviewId, compact = false }: ReviewInviteActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<'ACCEPT' | 'DECLINE' | null>(null)
  const [showDecline, setShowDecline] = useState(false)
  const [reason, setReason] = useState('')
  const btnSize = compact ? 'sm' : 'default'

  const respond = async (action: 'ACCEPT' | 'DECLINE') => {
    setPending(action)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'DECLINE' ? reason : undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Có lỗi xảy ra')
      }
      toast.success(action === 'ACCEPT' ? 'Đã đồng ý phản biện' : 'Đã từ chối lời mời')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-3">
      {!showDecline ? (
        <div className="flex flex-wrap gap-2">
          <Button size={btnSize} onClick={() => respond('ACCEPT')} disabled={pending !== null}>
            {pending === 'ACCEPT' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {compact ? 'Đồng ý' : 'Đồng ý phản biện'}
          </Button>
          <Button size={btnSize} variant="outline" onClick={() => setShowDecline(true)} disabled={pending !== null}>
            <X className="mr-2 h-4 w-4" />
            Từ chối
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do từ chối (tùy chọn) — giúp biên tập tìm phản biện thay thế phù hợp"
            rows={compact ? 2 : 3}
          />
          <div className="flex flex-wrap gap-2">
            <Button size={btnSize} variant="destructive" onClick={() => respond('DECLINE')} disabled={pending !== null}>
              {pending === 'DECLINE' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Xác nhận từ chối
            </Button>
            <Button size={btnSize} variant="ghost" onClick={() => setShowDecline(false)} disabled={pending !== null}>
              Quay lại
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
