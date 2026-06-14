'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDashboardSession } from '@/components/dashboard/session-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Eye, FileSearch, BookMarked } from 'lucide-react'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'

import { ProductionKpiCards } from './_components/production-kpi-cards'
import { ProductionFilters } from './_components/production-filters'
import { ProductionTableSkeleton } from './_components/production-table-skeleton'
import { AssignIssueDialog } from './_components/assign-issue-dialog'
import { UploadFileDialog } from './_components/upload-file-dialog'
import { PublishConfirmDialog } from './_components/publish-confirm-dialog'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductionItem {
  productionId: string
  articleId: string
  submissionId: string
  code: string
  title: string
  author: { fullName: string; email: string; org?: string }
  category?: { name: string }
  pages?: string
  doiLocal?: string
  issue?: { id?: string; number: number; volume: { volumeNo: number } }
  issueId?: string
  files: Array<{ id: string; originalName: string; fileType: string; createdAt: string }>
  published: boolean
  publishedAt?: string
  daysInProduction: number
}

// ── Data mapping ─────────────────────────────────────────────────────────────

function mapProductionItems(raw: any[]): ProductionItem[] {
  return raw.map(p => ({
    productionId: p.id,
    articleId: p.article?.id ?? '',
    submissionId: p.article?.submission?.id ?? '',
    code: p.article?.submission?.code ?? '',
    title: p.article?.submission?.title ?? '',
    author: p.article?.submission?.author ?? { fullName: '—', email: '' },
    category: p.article?.submission?.category,
    pages: p.article?.pages,
    doiLocal: p.article?.doiLocal ?? p.doi,
    issue: p.issue
      ? { id: p.issue.id, number: p.issue.number, volume: p.issue.volume }
      : undefined,
    issueId: p.issueId,
    files: p.article?.submission?.files ?? [],
    published: p.published,
    publishedAt: p.publishedAt,
    daysInProduction: p.article?.submission?.lastStatusChangeAt
      ? Math.floor(
          (Date.now() - new Date(p.article.submission.lastStatusChangeAt).getTime()) /
          86_400_000
        )
      : 0,
  }))
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProductionQueuePage() {
  const session = useDashboardSession()
  const [items, setItems] = useState<ProductionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Dialog state
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; item: ProductionItem | null }>({ open: false, item: null })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item: ProductionItem | null }>({ open: false, item: null })
  const [publishDialog, setPublishDialog] = useState<{ open: boolean; item: ProductionItem | null }>({ open: false, item: null })

  const canPublish = session?.role === 'EIC' || session?.role === 'SYSADMIN'

  useEffect(() => {
    fetchProduction()
  }, [])

  const fetchProduction = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/production')
      const data = await res.json()
      if (data.success) {
        setItems(mapProductionItems(data.data))
      } else {
        toast.error('Không thể tải danh sách sản xuất')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Derived lists
  const inProduction = useMemo(() => items.filter(p => !p.published), [items])
  const published = useMemo(() => items.filter(p => p.published), [items])
  const categories = useMemo(
    () => [...new Set(items.map(p => p.category?.name).filter(Boolean) as string[])],
    [items]
  )

  const filterItems = (list: ProductionItem[]) =>
    list.filter(p => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.author.fullName.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      const matchCat = categoryFilter === 'ALL' || p.category?.name === categoryFilter
      return matchSearch && matchCat
    })

  const filteredInProduction = filterItems(inProduction)
  const filteredPublished = filterItems(published)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-2xl font-bold tracking-tight">Hàng đợi Sản xuất</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý bài viết trong giai đoạn biên tập, dàn trang và xuất bản
        </p>
      </div>

      {/* KPI */}
      <ProductionKpiCards items={items} loading={loading} />

      {/* Filters */}
      <ProductionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      {/* Tabs */}
      <Tabs defaultValue="in_production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="in_production">
            Đang sản xuất
            <Badge variant="secondary" className="ml-2 text-xs">{inProduction.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published">
            Đã xuất bản
            <Badge variant="secondary" className="ml-2 text-xs">{published.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Đang sản xuất */}
        <TabsContent value="in_production">
          <Card>
            <CardHeader>
              <CardTitle>Bài viết đang sản xuất</CardTitle>
              <CardDescription>Các bài đang trong quá trình biên tập và dàn trang</CardDescription>
            </CardHeader>
            <CardContent>
              <TableScrollWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Mã bài</TableHead>
                      <TableHead>Tiêu đề / Tác giả</TableHead>
                      <TableHead className="w-36">Số tạp chí</TableHead>
                      <TableHead className="w-20">Trang</TableHead>
                      <TableHead className="w-24">Thời gian</TableHead>
                      <TableHead className="w-20">Files</TableHead>
                      <TableHead className="text-right w-60">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  {loading ? (
                    <ProductionTableSkeleton rows={5} />
                  ) : filteredInProduction.length === 0 ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={7}>
                          <EmptyState
                            icon={FileSearch}
                            title={searchQuery ? 'Không tìm thấy kết quả' : 'Không có bài viết nào đang sản xuất'}
                            desc={searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Các bài được chấp nhận sẽ xuất hiện ở đây'}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>
                      {filteredInProduction.map(item => (
                        <TableRow key={item.productionId}>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">{item.code}</span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm line-clamp-1 max-w-xs">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.author.fullName}</p>
                          </TableCell>
                          <TableCell>
                            {item.issue ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Tập {item.issue.volume.volumeNo}, Số {item.issue.number}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Chưa gán số
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.pages ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${item.daysInProduction > 30 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {item.daysInProduction} ngày
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {item.files.length} files
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => setAssignDialog({ open: true, item })}
                              >
                                <BookMarked className="h-3.5 w-3.5 mr-1" />
                                Gán số
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => setUploadDialog({ open: true, item })}
                              >
                                Tải file
                              </Button>
                              {canPublish && (
                                <Button
                                  size="sm"
                                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => setPublishDialog({ open: true, item })}
                                >
                                  Xuất bản
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  )}
                </Table>
              </TableScrollWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Đã xuất bản */}
        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Bài viết đã xuất bản</CardTitle>
              <CardDescription>Các bài viết đã được xuất bản công khai</CardDescription>
            </CardHeader>
            <CardContent>
              <TableScrollWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Mã bài</TableHead>
                      <TableHead>Tiêu đề / Tác giả</TableHead>
                      <TableHead className="w-36">Số tạp chí</TableHead>
                      <TableHead className="w-48">DOI</TableHead>
                      <TableHead className="w-32">Ngày xuất bản</TableHead>
                      <TableHead className="text-right w-24">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  {loading ? (
                    <ProductionTableSkeleton rows={3} />
                  ) : filteredPublished.length === 0 ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6}>
                          <EmptyState
                            icon={FileSearch}
                            title={searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có bài viết nào được xuất bản'}
                            desc={searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Các bài xuất bản sẽ xuất hiện ở đây'}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>
                      {filteredPublished.map(item => (
                        <TableRow key={item.productionId}>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">{item.code}</span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm line-clamp-1 max-w-xs">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.author.fullName}</p>
                          </TableCell>
                          <TableCell>
                            {item.issue ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Tập {item.issue.volume.volumeNo}, Số {item.issue.number}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {item.doiLocal ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.publishedAt
                              ? new Date(item.publishedAt).toLocaleDateString('vi-VN')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => window.open(`/articles/${item.articleId}`, '_blank')}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  )}
                </Table>
              </TableScrollWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {assignDialog.item && (
        <AssignIssueDialog
          open={assignDialog.open}
          onOpenChange={open => setAssignDialog(prev => ({ ...prev, open }))}
          productionId={assignDialog.item.productionId}
          articleTitle={assignDialog.item.title}
          currentIssueId={assignDialog.item.issueId}
          onSuccess={fetchProduction}
        />
      )}

      {uploadDialog.item && (
        <UploadFileDialog
          open={uploadDialog.open}
          onOpenChange={open => setUploadDialog(prev => ({ ...prev, open }))}
          productionId={uploadDialog.item.productionId}
          articleId={uploadDialog.item.articleId}
          articleCode={uploadDialog.item.code}
          onSuccess={fetchProduction}
        />
      )}

      {publishDialog.item && (
        <PublishConfirmDialog
          open={publishDialog.open}
          onOpenChange={open => setPublishDialog(prev => ({ ...prev, open }))}
          productionId={publishDialog.item.productionId}
          articleTitle={publishDialog.item.title}
          hasIssue={!!publishDialog.item.issue}
          onSuccess={fetchProduction}
        />
      )}
    </div>
  )
}

// ── Empty state helper ────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
      <Icon className="h-12 w-12 opacity-25" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm">{desc}</p>
    </div>
  )
}
