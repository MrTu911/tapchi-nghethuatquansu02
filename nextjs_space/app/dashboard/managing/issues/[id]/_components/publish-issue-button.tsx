'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Send, CheckCircle } from 'lucide-react'

interface PublishIssueButtonProps {
  issueId: string
  issueLabel: string
  articleCount: number
}

/**
 * Nút xuất bản toàn bộ số tạp chí — chỉ hiển thị cho EIC/SYSADMIN (đã gác ở
 * trang cha). Backend /api/issues/publish vẫn enforce quyền + điều kiện.
 */
export function PublishIssueButton({ issueId, issueLabel, articleCount }: PublishIssueButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/issues/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Đã xuất bản số tạp chí thành công!')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(data.error || data.message || 'Không thể xuất bản số tạp chí')
      }
    } catch {
      toast.error('Lỗi kết nối khi xuất bản')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={articleCount === 0}
        className="bg-[#1E3924] text-white hover:bg-[#15281a] disabled:opacity-50"
        title={articleCount === 0 ? 'Cần thêm bài viết trước khi xuất bản' : undefined}
      >
        <Send className="mr-1.5 h-4 w-4" />
        Xuất bản số
      </Button>

      <AlertDialog open={open} onOpenChange={o => { if (!publishing) setOpen(o) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#1E3924] dark:text-emerald-300" />
              Xác nhận xuất bản số tạp chí
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Xuất bản <strong className="text-foreground">{issueLabel}</strong> với{' '}
                  <strong className="text-foreground">{articleCount} bài viết</strong>?
                </p>
                <p>Sau khi xuất bản, toàn bộ bài viết trong số sẽ hiển thị công khai trên website.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handlePublish() }}
              disabled={publishing}
              className="bg-[#1E3924] text-white hover:bg-[#15281a]"
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {publishing ? 'Đang xuất bản...' : 'Xuất bản ngay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
