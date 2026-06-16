"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { NewsForm, type NewsFormInitialData } from '@/components/dashboard/news-form'

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [initialData, setInitialData] = useState<NewsFormInitialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/news/${id}`)
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setInitialData(data.data.news as NewsFormInitialData)
        } else {
          toast.error('Không tìm thấy tin tức')
          router.push('/dashboard/admin/news')
        }
      } catch {
        if (!cancelled) {
          toast.error('Lỗi khi tải tin tức')
          router.push('/dashboard/admin/news')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center gap-3 p-12 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#1E3924]" />
        Đang tải dữ liệu...
      </div>
    )
  }

  return <NewsForm mode="edit" newsId={id} initialData={initialData} />
}
