'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, FileText } from 'lucide-react'

type FileType = 'COPYEDIT' | 'PROOF' | 'FINAL_VERSION'

interface UploadFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionId: string
  articleId: string
  articleCode: string
  onSuccess: () => void
}

export function UploadFileDialog({
  open,
  onOpenChange,
  productionId,
  articleId,
  articleCode,
  onSuccess,
}: UploadFileDialogProps) {
  const [fileType, setFileType] = useState<FileType>('COPYEDIT')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const reset = () => {
    setFileType('COPYEDIT')
    setDescription('')
    setFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      // Step 1: Upload file lên storage
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', 'production')

      const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        toast.error(uploadData.error || 'Lỗi tải file lên storage')
        return
      }

      const fileUrl = uploadData.url

      // Step 2a: Nếu là bản cuối → cập nhật layoutUrl trên Production
      if (fileType === 'FINAL_VERSION') {
        const patchRes = await fetch(`/api/production/${productionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layoutUrl: fileUrl }),
        })
        const patchData = await patchRes.json()
        if (!patchData.success) {
          toast.error(patchData.message || 'Lỗi cập nhật bản layout')
          return
        }
        toast.success('Đã tải lên phiên bản cuối thành công')
      } else {
        // Step 2b: COPYEDIT / PROOF → tạo Copyedit record
        const copyRes = await fetch('/api/copyediting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId, fileUrl, notes: description }),
        })
        const copyData = await copyRes.json()
        if (!copyData.success) {
          toast.error(copyData.message || 'Lỗi ghi nhận file biên tập')
          return
        }
        toast.success('Đã tải lên file biên tập thành công')
      }

      reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Lỗi khi tải file')
    } finally {
      setUploading(false)
    }
  }

  const fileTypeLabels: Record<FileType, string> = {
    COPYEDIT: 'Bản biên tập',
    PROOF: 'Bản in thử',
    FINAL_VERSION: 'Phiên bản cuối',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Tải file biên tập
          </DialogTitle>
          <DialogDescription>
            Bài: <span className="font-medium text-foreground">{articleCode}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fileType">Loại file *</Label>
            <Select value={fileType} onValueChange={(v: FileType) => setFileType(v)}>
              <SelectTrigger id="fileType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(fileTypeLabels) as FileType[]).map(ft => (
                  <SelectItem key={ft} value={ft}>{fileTypeLabels[ft]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fileType === 'FINAL_VERSION' && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                Phiên bản cuối sẽ được dùng làm file layout chính thức của bài viết.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Ghi chú</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú về file này..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Chọn file *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                required
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset() }} disabled={uploading}>
              Hủy
            </Button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
