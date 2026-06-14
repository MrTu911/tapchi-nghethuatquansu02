'use client'

import { useQuery } from '@tanstack/react-query'

interface ArticleListParams {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: string
  issueId?: string
  year?: string
  sortBy?: 'newest' | 'views' | 'downloads' | 'relevance'
}

interface Article {
  id: string
  title: string
  authors: string
  category?: { name: string; slug: string }
  publishedAt: string | null
  views: number
  downloads: number
  abstract?: string
  keywords?: string[]
  pages?: string
  doi?: string
}

interface ArticleListResponse {
  articles: Article[]
  total: number
  page: number
  pageSize: number
}

async function fetchArticles(params: ArticleListParams): Promise<ArticleListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.categoryId) searchParams.set('categoryId', params.categoryId)
  if (params.issueId) searchParams.set('issueId', params.issueId)
  if (params.year) searchParams.set('year', params.year)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)

  const res = await fetch(`/api/articles?${searchParams.toString()}`)
  if (!res.ok) throw new Error('Không thể tải danh sách bài báo')
  const json = await res.json()
  return json.data ?? json
}

async function fetchArticleById(id: string): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`)
  if (!res.ok) throw new Error('Không tìm thấy bài báo')
  const json = await res.json()
  return json.data ?? json
}

export function useArticles(params: ArticleListParams = {}) {
  return useQuery({
    // JSON.stringify ensures a stable cache key regardless of object reference identity
    queryKey: ['articles', JSON.stringify(params)],
    queryFn: () => fetchArticles(params),
  })
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticleById(id),
    enabled: Boolean(id),
  })
}
