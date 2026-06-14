'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { FilePreview } from '@/components/dashboard/file-preview'

interface RevisionSubmissionFormProps {
  submissionId: string
  /** Số phiên bản hiện có — chỉ để hiển thị (versionNo do server tự tính). */
  currentVersionNo: number
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function RevisionSubmissionForm({ submissionId }: RevisionSubmissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null)
  const [responseFile, setResponseFile] = useState<File | null>(null)
  const [changelog, setChangelog] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const pickFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Vui lòng tải lên file PDF, DOC hoặc DOCX')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 10MB')
      return
    }
    setter(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manuscriptFile) {
      toast.error('Vui lòng tải lên file bản thảo đã chỉnh sửa')
      return
    }
    if (!changelog.trim()) {
      toast.error('Vui lòng mô tả những thay đổi chính')
      return
    }

    setIsSubmitting(true)
    try {
      // versionNo KHÔNG gửi từ client — server tự tính để tránh va chạm @@unique.
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('manuscript', manuscriptFile)
      if (responseFile) formData.append('responseToReviewers', responseFile)
      formData.append('changelog', changelog)
      formData.append('coverLetter', coverLetter)

      const response = await fetch('/api/submissions/revise', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Không thể nộp bản chỉnh sửa')
      }

      toast.success('Nộp bản chỉnh sửa thành công!')
      router.push(`/dashboard/author/submissions/${submissionId}`)
      router.refresh()
    } catch (error: any) {
      console.error('Revision submission error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi nộp bản chỉnh sửa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FilePicker = ({
    id,
    label,
    required,
    file,
    hint,
    onChange,
  }: {
    id: string
    label: string
    required?: boolean
    file: File | null
    hint: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-brand" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 transition-colors ${
          file ? 'border-brand/50 bg-brand/5' : 'border-border hover:border-brand/40 hover:bg-muted/40'
        }`}
      >
        {file ? (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-brand" />
        ) : (
          <Upload className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        )}
        <span className={`truncate text-sm ${file ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {file ? file.name : 'Chọn file PDF, DOC hoặc DOCX (tối đa 10MB)'}
        </span>
      </label>
      <Input id={id} type="file" accept=".pdf,.doc,.docx" onChange={onChange} disabled={isSubmitting} className="hidden" />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker
        id="manuscript"
        label="Bản thảo đã chỉnh sửa"
        required
        file={manuscriptFile}
        hint="Bản thảo cập nhật theo yêu cầu phản biện"
        onChange={(e) => pickFile(e, setManuscriptFile)}
      />

      {/* Xem trước bản thảo TRƯỚC khi gửi lại */}
      {manuscriptFile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Xem trước bản chỉnh sửa</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
            </Button>
          </div>
          {showPreview && (
            <FilePreview file={manuscriptFile} title="Xem trước bản chỉnh sửa (chưa nộp)" height="520px" />
          )}
        </div>
      )}

      <FilePicker
        id="response"
        label="Thư trả lời phản biện (tùy chọn)"
        file={responseFile}
        hint="File giải trình các thay đổi theo từng nhận xét của phản biện viên"
        onChange={(e) => pickFile(e, setResponseFile)}
      />

      <div className="space-y-1.5">
        <Label htmlFor="changelog" className="text-sm">
          Mô tả những thay đổi chính <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="changelog"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          disabled={isSubmitting}
          placeholder="Tóm tắt ngắn gọn các nội dung đã sửa đổi theo yêu cầu..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coverLetter" className="text-sm">Thư ngỏ gửi biên tập viên (tùy chọn)</Label>
        <Textarea
          id="coverLetter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          disabled={isSubmitting}
          placeholder="Lời nhắn gửi biên tập viên..."
          rows={3}
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Sau khi nộp, bài viết sẽ chuyển sang trạng thái <strong>Đang phản biện</strong> và gửi lại cho biên tập viên.
          Bạn có thể theo dõi trong mục &quot;Bài nộp của tôi&quot;.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || !manuscriptFile || !changelog.trim()} className="flex-1">
          {isSubmitting ? (
            <><Upload className="mr-2 h-4 w-4 animate-spin" /> Đang nộp...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" /> Nộp bản chỉnh sửa</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Hủy
        </Button>
      </div>
    </form>
  )
}
