'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, FileText, User, Calendar, Tag, Download, Eye, X, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Article {
  id: string
  title: string
  abstractVn: string
  authorName: string
  authorOrg: string
  categoryName: string
  keywords: string[]
  publishedAt: string
  views: number
  downloads: number
  issueInfo: string
}

export default function RepositorySearch({ 
  categories, 
  years 
}: { 
  categories: Category[]
  years: number[] 
}) {
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [year, setYear] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [results, setResults] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (categoryId) params.set('categoryId', categoryId)
      if (year) params.set('year', year)
      if (authorName) params.set('author', authorName)
      params.set('limit', '50')

      const res = await fetch(`/api/repository/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setResults(data.data.articles || [])
        setTotal(data.data.total || 0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setKeyword('')
    setCategoryId('')
    setYear('')
    setAuthorName('')
    setResults([])
    setSearched(false)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm bài báo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Từ khóa</label>
              <Input
                placeholder="Tiêu đề, tóm tắt..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
              <Input
                placeholder="Tên tác giả..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chuyên mục</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Năm</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSearch} disabled={loading} className="bg-sky-600 hover:bg-sky-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Tìm kiếm
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" /> Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kết quả: {total} bài báo
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Không tìm thấy bài báo phù hợp</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((article) => (
                <Card key={article.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <Link href={`/repository/${article.id}`} className="block group">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-sky-600 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {article.authorName}
                      </span>
                      {article.authorOrg && (
                        <span className="text-gray-400">• {article.authorOrg}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                      </span>
                      <Badge variant="secondary">{article.categoryName}</Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-3">
                      {article.abstractVn}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.keywords?.slice(0, 5).map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />{kw}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{article.issueInfo}</span>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" /> {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-4 w-4" /> {article.downloads}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
