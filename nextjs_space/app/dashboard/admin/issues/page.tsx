
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  BookOpen,
  FileText,
  ImageOff,
  Newspaper,
} from 'lucide-react'
import Image from 'next/image'
import { IssueForm } from '@/components/dashboard/issue-form'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'

interface Issue {
  id: string
  volumeNo: number
  volume?: {
    volumeNo: number
    year: number
    title?: string
  }
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  pdfUrl?: string
  doi?: string
  publishDate?: string
  status: 'DRAFT' | 'PUBLISHED'
  _count?: {
    articles: number
  }
}

export default function IssuesManagementPage() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues')
      const data = await response.json()
      if (data.success || data.issues) {
        setIssues(data.issues || data.data || [])
      }
    } catch (error) {
      console.error('Fetch issues error:', error)
      toast.error('Lỗi tải danh sách số tạp chí')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingIssue(null)
    fetchIssues()
    router.refresh()
  }

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (issue: Issue) => {
    setIssueToDelete(issue)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/issues/${issueToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Xóa số tạp chí thành công')
        fetchIssues()
        router.refresh()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi xóa số tạp chí')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setIssueToDelete(null)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingIssue(null)
    }
  }

  const publishedCount = issues.filter((i) => i.status === 'PUBLISHED').length
  const draftCount = issues.filter((i) => i.status === 'DRAFT').length
  const withCoverCount = issues.filter((i) => i.coverImage).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-primary" />
            Quản lý Số Tạp chí
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các số phát hành của tạp chí khoa học
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo Số Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIssue ? 'Chỉnh sửa Số Tạp chí' : 'Tạo Số Tạp chí Mới'}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết cho số tạp chí. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <IssueForm
              issue={editingIssue}
              onSuccess={handleFormSuccess}
              onCancel={() => handleDialogClose(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPIs */}
      {!loading && issues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-700">{issues.length}</p>
              <p className="text-xs text-blue-600 mt-0.5">Tổng số tạp chí</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Đã xuất bản</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Bản nháp</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-700">{withCoverCount}</p>
              <p className="text-xs text-purple-600 mt-0.5">Có ảnh bìa</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách các Số Tạp chí</CardTitle>
          <CardDescription>Tổng cộng: {issues.length} số tạp chí</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Đang tải...</span>
            </div>
          ) : (
            <TableScrollWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Ảnh bìa</TableHead>
                    <TableHead>Tập — Số</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="text-center w-20">Bài báo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày phát hành</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Newspaper className="h-14 w-14 opacity-15" />
                          <div>
                            <p className="font-medium">Chưa có số tạp chí nào</p>
                            <p className="text-sm mt-1">Nhấn "Tạo Số Mới" để bắt đầu</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue) => (
                      <TableRow key={issue.id} className="group align-middle">
                        {/* Cover thumbnail */}
                        <TableCell>
                          {issue.coverImage ? (
                            <div className="relative w-10 h-14 rounded overflow-hidden border shadow-sm">
                              <Image
                                src={issue.coverImage}
                                alt={`Bìa Tập ${issue.volume?.volumeNo} Số ${issue.number}`}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 rounded border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800 flex items-center justify-center" title="Chưa có ảnh bìa">
                              <BookOpen className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                        </TableCell>

                        {/* Volume / Issue */}
                        <TableCell className="font-semibold whitespace-nowrap">
                          Tập {issue.volume?.volumeNo || '?'} — Số {issue.number}
                        </TableCell>

                        <TableCell>{issue.year}</TableCell>

                        {/* Title + badges */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="max-w-[200px] truncate text-sm">
                              {issue.title || <span className="text-muted-foreground italic">Chưa có tiêu đề</span>}
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {issue.pdfUrl && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5 border-red-200 text-red-600 bg-red-50">
                                  <FileText className="h-2.5 w-2.5" />
                                  PDF
                                </Badge>
                              )}
                              {!issue.coverImage && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5 border-amber-200 text-amber-600 bg-amber-50">
                                  <ImageOff className="h-2.5 w-2.5" />
                                  Thiếu ảnh
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Article count */}
                        <TableCell className="text-center">
                          <Badge
                            variant={(issue._count?.articles ?? 0) > 0 ? 'default' : 'outline'}
                            className={(issue._count?.articles ?? 0) > 0 ? 'bg-blue-600 hover:bg-blue-600' : ''}
                          >
                            {issue._count?.articles ?? 0}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'}
                            className={
                              issue.status === 'PUBLISHED'
                                ? 'bg-emerald-600 hover:bg-emerald-600'
                                : ''
                            }
                          >
                            {issue.status === 'PUBLISHED' ? '✓ Đã xuất bản' : '✎ Nháp'}
                          </Badge>
                        </TableCell>

                        {/* Publish date */}
                        <TableCell className="whitespace-nowrap text-sm">
                          {issue.publishDate
                            ? new Date(issue.publishDate).toLocaleDateString('vi-VN')
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => router.push(`/dashboard/admin/issues/${issue.id}`)}
                              title="Xem chi tiết"
                              className="bg-blue-600 hover:bg-blue-700 h-8"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Chi tiết
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(issue)}
                              title="Chỉnh sửa"
                              className="h-8 w-8"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(issue)}
                              className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xác nhận xóa số tạp chí
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa số tạp chí{' '}
              <strong>
                Tập {issueToDelete?.volume?.volumeNo || '?'} — Số {issueToDelete?.number} (
                {issueToDelete?.year})
              </strong>
              ?
              {issueToDelete?._count && issueToDelete._count.articles > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Số này có {issueToDelete._count.articles} bài viết. Cần gỡ bài viết trước khi xóa.
                </span>
              )}
              <span className="block mt-2 text-sm">Thao tác này không thể hoàn tác.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
