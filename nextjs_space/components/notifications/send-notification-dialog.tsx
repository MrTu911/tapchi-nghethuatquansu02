'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Send, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

const NOTIFICATION_TYPES = [
  { value: 'SUBMISSION_RECEIVED', label: 'Bài viết mới' },
  { value: 'REVIEW_INVITED', label: 'Mời phản biện' },
  { value: 'REVIEW_REMINDER', label: 'Nhắc phản biện' },
  { value: 'REVIEW_COMPLETED', label: 'Phản biện xong' },
  { value: 'DECISION_MADE', label: 'Quyết định' },
  { value: 'REVISION_REQUESTED', label: 'Yêu cầu sửa' },
  { value: 'ARTICLE_PUBLISHED', label: 'Đã xuất bản' },
  { value: 'DEADLINE_APPROACHING', label: 'Sắp hết hạn' },
  { value: 'DEADLINE_OVERDUE', label: 'Quá hạn' },
]

const ROLES = [
  { value: 'all', label: 'Tất cả vai trò' },
  { value: 'AUTHOR', label: 'Tác giả' },
  { value: 'REVIEWER', label: 'Phản biện' },
  { value: 'SECTION_EDITOR', label: 'Biên tập viên chuyên mục' },
  { value: 'MANAGING_EDITOR', label: 'Thư ký tòa soạn' },
  { value: 'DEPUTY_EIC', label: 'Phó Tổng biên tập' },
  { value: 'EIC', label: 'Tổng biên tập' },
  { value: 'LAYOUT_EDITOR', label: 'Biên tập layout' },
]

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

interface SendNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendNotificationDialog({ open, onOpenChange }: SendNotificationDialogProps) {
  const [type, setType] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sendEmail, setSendEmail] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const [sending, setSending] = useState(false)

  // Fetch users when search/role changes
  useEffect(() => {
    if (!open) return
    setLoadingUsers(true)
    const params = new URLSearchParams({ limit: '30', page: '1' })
    if (userSearch) params.set('search', userSearch)
    if (roleFilter !== 'all') params.set('role', roleFilter)

    fetch(`/api/users?${params.toString()}`)
      .then(r => r.json())
      .then(json => {
        const list: User[] = (json?.users ?? json?.data?.users ?? []).map((u: Record<string, string>) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
        }))
        setUsers(list)
      })
      .catch(() => toast.error('Không thể tải danh sách người dùng'))
      .finally(() => setLoadingUsers(false))
  }, [open, userSearch, roleFilter])

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedUserIds(new Set(users.map(u => u.id)))
  const clearSelection = () => setSelectedUserIds(new Set())

  const handleSend = async () => {
    if (!type || !title.trim() || !message.trim()) {
      toast.error('Vui lòng điền đầy đủ loại, tiêu đề và nội dung')
      return
    }
    if (selectedUserIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một người nhận')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          type,
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          sendEmail,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message ?? 'Đã gửi thông báo thành công')
        onOpenChange(false)
        resetForm()
      } else {
        toast.error(json.error ?? 'Không thể gửi thông báo')
      }
    } catch {
      toast.error('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setType('')
    setTitle('')
    setMessage('')
    setLink('')
    setSendEmail(false)
    setSelectedUserIds(new Set())
    setUserSearch('')
    setRoleFilter('all')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Gửi thông báo
          </DialogTitle>
          <DialogDescription>
            Soạn và gửi thông báo thủ công đến người dùng hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Loại thông báo */}
          <div className="space-y-1.5">
            <Label>Loại thông báo <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại thông báo..." />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <Label>Tiêu đề <span className="text-destructive">*</span></Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              maxLength={200}
            />
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5">
            <Label>Nội dung <span className="text-destructive">*</span></Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
          </div>

          {/* Link (tùy chọn) */}
          <div className="space-y-1.5">
            <Label>Đường dẫn (tùy chọn)</Label>
            <Input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="/dashboard/submissions/..."
            />
          </div>

          {/* Gửi email */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={v => setSendEmail(v === true)}
            />
            <Label htmlFor="send-email" className="font-normal cursor-pointer">
              Đồng thời gửi email thông báo
            </Label>
          </div>

          {/* Chọn người nhận */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Người nhận <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {selectedUserIds.size > 0 && (
                  <Badge variant="secondary">{selectedUserIds.size} đã chọn</Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>Chọn tất cả</Button>
                {selectedUserIds.size > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>Bỏ chọn</Button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Tìm tên hoặc email..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-44 rounded-md border">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Không tìm thấy người dùng
                </div>
              ) : (
                <div className="p-1">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                      onClick={() => toggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Hủy
          </Button>
          <Button onClick={handleSend} disabled={sending || selectedUserIds.size === 0 || !type || !title || !message}>
            {sending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" />Gửi ({selectedUserIds.size})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
