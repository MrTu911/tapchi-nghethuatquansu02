'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface Issue {
  id: string
  number: number
  year: number
  volume?: { volumeNo: number }
}

export default function NewRepositoryArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    authorOrg: '',
    categoryId: '',
    issueId: '',
    abstractVn: '',
    abstractEn: '',
    keywords: '',
    doi: '',
    pages: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data || [])
      })
    
    // Fetch issues
    fetch('/api/issues?status=PUBLISHED')
      .then(res => res.json())
      .then(data => {
        if (data.success) setIssues(data.data || [])
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.authorName) {
      toast.error('Vui lòng nhập tiêu đề và tên tác giả')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) fd.append(key, value)
      })
      if (pdfFile) fd.append('pdf', pdfFile)

      const res = await fetch('/api/repository/create', {
        method: 'POST',
        body: fd,
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Thêm bài báo thành công')
        router.push('/dashboard/repository')
      } else {
        toast.error(data.error || 'Lỗi thêm bài báo')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/repository">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Thêm bài báo mới</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông tin bài báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề bài báo"
                required
              />
            </div>

            {/* Author */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorName">Tác giả *</Label>
                <Input
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Tên tác giả"
                  required
                />
              </div>
              <div>
                <Label htmlFor="authorOrg">Đơn vị</Label>
                <Input
                  id="authorOrg"
                  value={formData.authorOrg}
                  onChange={(e) => setFormData({ ...formData, authorOrg: e.target.value })}
                  placeholder="Đơn vị công tác"
                />
              </div>
            </div>

            {/* Category & Issue */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chuyên mục</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số xuất bản</Label>
                <Select value={formData.issueId} onValueChange={(v) => setFormData({ ...formData, issueId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        Tập {issue.volume?.volumeNo}, Số {issue.number}/{issue.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Abstract VN */}
            <div>
              <Label htmlFor="abstractVn">Tóm tắt (Tiếng Việt)</Label>
              <Textarea
                id="abstractVn"
                value={formData.abstractVn}
                onChange={(e) => setFormData({ ...formData, abstractVn: e.target.value })}
                placeholder="Nhập tóm tắt bài báo"
                rows={4}
              />
            </div>

            {/* Abstract EN */}
            <div>
              <Label htmlFor="abstractEn">Abstract (English)</Label>
              <Textarea
                id="abstractEn"
                value={formData.abstractEn}
                onChange={(e) => setFormData({ ...formData, abstractEn: e.target.value })}
                placeholder="Enter abstract in English"
                rows={4}
              />
            </div>

            {/* Keywords */}
            <div>
              <Label htmlFor="keywords">Từ khóa (phân cách bằng dấu phẩy)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="từ khóa 1, từ khóa 2, ..."
              />
            </div>

            {/* DOI & Pages */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="10.xxxx/xxxxx"
                />
              </div>
              <div>
                <Label htmlFor="pages">Số trang</Label>
                <Input
                  id="pages"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="1-10"
                />
              </div>
            </div>

            {/* PDF Upload */}
            <div>
              <Label>File PDF</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {pdfFile ? pdfFile.name : 'Nhấn để chọn file PDF'}
                  </p>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard/repository">Hủy</Link>
              </Button>
              <Button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu bài báo
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
