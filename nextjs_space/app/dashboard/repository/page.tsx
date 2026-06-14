'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDashboardSession } from '@/components/dashboard/session-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, Search, Plus, Edit, Eye, Download, FileText, Loader2, Filter, RefreshCw, Archive, GitMerge, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'

interface Article {
  id: string
  title: string
  authorName: string
  categoryName: string
  publishedAt: string
  views: number
  downloads: number
  issueInfo: string
  isPublic: boolean
  isDownloadable: boolean
}

export default function RepositoryDashboardPage() {
  const session = useDashboardSession()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [total, setTotal] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('keyword', searchTerm)
      params.set('limit', '100')
      
      const res = await fetch(`/api/repository/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.articles || [])
        setTotal(data.data.total || 0)
      }
    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/repository/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đồng bộ thành công: ${data.data.synced} bài báo`)
        fetchArticles()
      } else {
        toast.error(data.error || 'Lỗi đồng bộ')
      }
    } catch (error) {
      toast.error('Lỗi đồng bộ dữ liệu')
    } finally {
      setSyncing(false)
    }
  }

  const canManage = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session?.role ?? '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-sky-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý CSDL Bài báo</h1>
            <p className="text-gray-500">Tổng cộng: {total} bài báo trong hệ thống</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/dashboard/repository/press-archive">
              <Archive className="h-4 w-4 mr-2" />
              Bài báo lịch sử
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/repository/duplicate-check">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Kiểm tra trùng lặp
            </Link>
          </Button>
          {canManage && (
            <>
              <Button variant="outline" onClick={handleSync} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Đồng bộ Workflow
              </Button>
              <Button asChild className="bg-sky-600 hover:bg-sky-700">
                <Link href="/dashboard/repository/new">
                  <Plus className="h-4 w-4 mr-2" /> Thêm bài báo
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo tiêu đề, tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
              />
            </div>
            <Button onClick={fetchArticles}>
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Danh sách bài báo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : (
            <TableScrollWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Tiêu đề</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Chuyên mục</TableHead>
                  <TableHead>Số/Năm</TableHead>
                  <TableHead className="text-center">Xem</TableHead>
                  <TableHead className="text-center">Tải</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Chưa có bài báo nào trong CSDL
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Link href={`/repository/${article.id}`} className="font-medium text-gray-900 dark:text-white hover:text-sky-600 line-clamp-2">
                          {article.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-600">{article.authorName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{article.categoryName}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{article.issueInfo}</TableCell>
                      <TableCell className="text-center">{article.views}</TableCell>
                      <TableCell className="text-center">{article.downloads}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/repository/${article.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canManage && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/repository/${article.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </TableScrollWrapper>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
