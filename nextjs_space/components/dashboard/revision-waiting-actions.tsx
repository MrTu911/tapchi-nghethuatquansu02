'use client'

/**
 * Hành động của biên tập khi bài đang ở trạng thái REVISION (chờ tác giả nộp bản sửa).
 *
 * Ở trạng thái này chỉ có một quyết định hợp lệ theo state machine: TỪ CHỐI
 * (REVISION → REJECTED). Mọi quyết định khác (chấp nhận/sửa tiếp) phải chờ tác giả
 * nộp lại để bài quay về UNDER_REVIEW. Vì vậy form này chỉ cho phép từ chối, gọi
 * cùng API quyết định duy nhất /api/submissions/[id]/decision.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, XCircle } from 'lucide-react'

interface RevisionWaitingActionsProps {
  submissionId: string
  roundNo: number
}

export default function RevisionWaitingActions({ submissionId, roundNo }: RevisionWaitingActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REJECT', note: note.trim(), roundNo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể từ chối bài')
      toast.success('Đã từ chối bài viết')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <XCircle className="mr-2 h-4 w-4" />
        Từ chối bài
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối bài viết</DialogTitle>
            <DialogDescription>
              Bài đang chờ tác giả nộp bản chỉnh sửa. Từ chối sẽ kết thúc quy trình và thông báo cho tác giả.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">Lý do từ chối *</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nêu rõ lý do để gửi cho tác giả…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Huỷ</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
