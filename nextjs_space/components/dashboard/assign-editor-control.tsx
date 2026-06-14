'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserCheck } from 'lucide-react'
import { getRoleLabelShort } from '@/lib/role-labels'

interface EditorOption {
  id: string
  fullName: string
  role: string
  currentWorkload: number
}

interface AssignEditorControlProps {
  submissionId: string
  editors: EditorOption[]
  currentEditorId?: string | null
}

// Nhãn vai trò dùng SSOT lib/role-labels.ts
const ROLE_LABEL = (role: string) => getRoleLabelShort(role)

export default function AssignEditorControl({
  submissionId,
  editors,
  currentEditorId,
}: AssignEditorControlProps) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentEditorId || '')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selected) {
      toast.error('Vui lòng chọn biên tập viên')
      return
    }
    if (selected === currentEditorId) {
      toast.info('Bài đã được phân công cho biên tập viên này')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/managing-editor/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, editorId: selected }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Không thể phân công')
      }
      toast.success('Đã phân công biên tập viên')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-9 w-[210px]">
          <SelectValue placeholder="Chọn biên tập viên…" />
        </SelectTrigger>
        <SelectContent>
          {editors.map((ed) => (
            <SelectItem key={ed.id} value={ed.id}>
              {ed.fullName} · {ROLE_LABEL(ed.role)} ({ed.currentWorkload})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleAssign} disabled={loading || !selected || selected === currentEditorId}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
        <span className="ml-1.5 hidden sm:inline">Phân công</span>
      </Button>
    </div>
  )
}
