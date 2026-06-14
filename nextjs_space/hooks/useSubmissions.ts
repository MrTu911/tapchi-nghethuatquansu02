'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Submission {
  id: string
  code: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  category?: { name: string }
  author?: { fullName: string; email: string }
  currentRound?: number
}

interface SubmissionsListResponse {
  submissions: Submission[]
  total: number
  page: number
  pageSize: number
}

interface SubmissionsParams {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
  categoryId?: string
  role?: 'author' | 'editor' | 'reviewer'
}

async function fetchSubmissions(params: SubmissionsParams): Promise<SubmissionsListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.status) searchParams.set('status', params.status)
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.categoryId) searchParams.set('categoryId', params.categoryId)

  // Route khác nhau theo vai trò
  const basePath = params.role === 'author'
    ? '/api/author/articles'
    : '/api/submissions'

  const res = await fetch(`${basePath}?${searchParams.toString()}`)
  if (!res.ok) throw new Error('Không thể tải danh sách bài nộp')
  const json = await res.json()
  return json.data ?? json
}

async function fetchSubmissionById(id: string): Promise<Submission> {
  const res = await fetch(`/api/submissions/${id}`)
  if (!res.ok) throw new Error('Không tìm thấy bài nộp')
  const json = await res.json()
  return json.data ?? json
}

export function useSubmissions(params: SubmissionsParams = {}) {
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: () => fetchSubmissions(params),
  })
}

export function useAuthorSubmissions(params: Omit<SubmissionsParams, 'role'> = {}) {
  return useSubmissions({ ...params, role: 'author' })
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmissionById(id),
    enabled: Boolean(id),
  })
}

export function useAutosaveSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/author/articles/${id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Lỗi tự động lưu')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.id] })
    },
  })
}
