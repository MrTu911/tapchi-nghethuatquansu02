'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  contactEmail: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactForm({ contactEmail }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return

    setStatus('sending')
    await new Promise(r => setTimeout(r, 800))

    // Open mailto as fallback – no backend email service configured yet
    const body = encodeURIComponent(
      `Họ tên: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )
    const subject = encodeURIComponent(form.subject || 'Liên hệ từ website tạp chí')
    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`)

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2">Cảm ơn bạn đã liên hệ!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Ứng dụng email đã mở. Vui lòng gửi email để hoàn tất.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-xs text-[#295232] hover:underline dark:text-emerald-400"
        >
          Gửi thêm thư khác
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm">
            Họ và tên <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">
            Email <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@gmail.com"
            required
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-sm">Tiêu đề</Label>
        <Input
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="Hỏi về quy trình nộp bài..."
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-sm">
          Nội dung <span className="text-rose-500">*</span>
        </Label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={5}
          placeholder="Nội dung câu hỏi hoặc phản hồi của bạn..."
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Trường có dấu <span className="text-rose-500">*</span> là bắt buộc
        </p>
        <Button
          type="submit"
          disabled={status === 'sending' || !form.name || !form.email || !form.message}
          className="bg-[#295232] hover:bg-[#1e3d25] text-white h-10 px-5"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang mở email...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Gửi liên hệ
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-400">
        Hoặc gửi email trực tiếp tới:{' '}
        <a href={`mailto:${contactEmail}`} className="text-[#295232] dark:text-emerald-400 hover:underline font-medium">
          {contactEmail}
        </a>
      </p>
    </form>
  )
}
