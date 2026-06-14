'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'

interface Issue {
  id: string
  number: number
  year: number
  title?: string
  status: string
  volume: { volumeNo: number }
}

interface AssignIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionId: string
  articleTitle: string
  currentIssueId?: string
  onSuccess: () => void
}

export function AssignIssueDialog({
  open,
  onOpenChange,
  productionId,
  articleTitle,
  currentIssueId,
  onSuccess,
}: AssignIssueDialogProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssueId, setSelectedIssueId] = useState(currentIssueId ?? '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedIssueId(currentIssueId ?? '')
    fetchIssues()
  }, [open, currentIssueId])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/issues')
      const data = await res.json()
      if (data.success) setIssues(data.data ?? data.issues ?? [])
    } catch {
      toast.error('Không thể tải danh sách số tạp chí')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedIssueId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/production/${productionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: selectedIssueId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã gán số tạp chí thành công')
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch {
      toast.error('Lỗi khi gán số tạp chí')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Gán số tạp chí
          </DialogTitle>
          <DialogDescription className="text-sm">
            Bài viết: <span className="font-medium text-foreground">{articleTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <Label htmlFor="issue-select">Chọn số tạp chí</Label>
          <Select
            value={selectedIssueId}
            onValueChange={setSelectedIssueId}
            disabled={loading}
          >
            <SelectTrigger id="issue-select">
              <SelectValue placeholder={loading ? 'Đang tải...' : 'Chọn số tạp chí...'} />
            </SelectTrigger>
            <SelectContent>
              {issues.map(issue => (
                <SelectItem key={issue.id} value={issue.id}>
                  Tập {issue.volume?.volumeNo}, Số {issue.number}/{issue.year}
                  {issue.title ? ` — ${issue.title}` : ''}
                  {issue.status === 'PUBLISHED' ? ' (Đã xuất bản)' : ' (Bản thảo)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!selectedIssueId || saving}>
            {saving ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
