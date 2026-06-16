"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { NewsForm } from '@/components/dashboard/news-form'

function CreateNewsInner() {
  const searchParams = useSearchParams()
  const defaultCategory = searchParams.get('category') ?? undefined
  return <NewsForm mode="create" defaultCategory={defaultCategory} />
}

export default function CreateNewsPage() {
  return (
    <Suspense fallback={null}>
      <CreateNewsInner />
    </Suspense>
  )
}
