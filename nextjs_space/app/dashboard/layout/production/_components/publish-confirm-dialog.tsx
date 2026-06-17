'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface PublishConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionId: string
  articleTitle: string
  hasIssue: boolean
  onSuccess: () => void
}

export function PublishConfirmDialog({
  open,
  onOpenChange,
  productionId,
  articleTitle,
  hasIssue,
  onSuccess,
}: PublishConfirmDialogProps) {
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/production/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Xuất bản bài viết thành công!')
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.message || 'Xuất bản thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối khi xuất bản')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!publishing) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#1E3924] dark:text-emerald-300" />
            Xác nhận xuất bản
          </DialogTitle>
          <DialogDescription>
            Thao tác này sẽ xuất bản bài viết ra công khai và không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div className="bg-muted rounded-lg px-4 py-3 text-sm">
            <p className="font-medium">{articleTitle}</p>
          </div>

          {!hasIssue && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Bài viết chưa được gán vào số tạp chí. Bạn vẫn có thể xuất bản nhưng nên gán số trước.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>
            Hủy
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-[#1E3924] text-white hover:bg-[#15281a]"
          >
            {publishing ? 'Đang xuất bản...' : 'Xuất bản ngay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
