
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Upload,
  Globe,
  Star,
  ImageIcon,
  Tag,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/rich-text-editor';

const categories = [
  { value: 'announcement', label: 'Thông báo', color: 'bg-blue-100 text-blue-700' },
  { value: 'event', label: 'Sự kiện', color: 'bg-purple-100 text-purple-700' },
  { value: 'call_for_paper', label: 'Call for Paper', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'policy', label: 'Chính sách', color: 'bg-orange-100 text-orange-700' },
  { value: 'news', label: 'Tin tức', color: 'bg-slate-100 text-slate-700' },
];

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    coverImage: '',
    category: 'announcement',
    tags: '',
    isPublished: false,
    isFeatured: false,
  });

  useEffect(() => {
    fetchNews();
  }, [slug]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`/api/news/${slug}`);
      const data = await response.json();

      if (data.success) {
        const news = data.data;
        setFormData({
          title: news.title || '',
          titleEn: news.titleEn || '',
          summary: news.summary || '',
          summaryEn: news.summaryEn || '',
          content: news.content || '',
          contentEn: news.contentEn || '',
          coverImage: news.coverImage || '',
          category: news.category || 'announcement',
          tags: news.tags?.join(', ') || '',
          isPublished: news.isPublished || false,
          isFeatured: news.isFeatured || false,
        });
      } else {
        toast.error(data.message || 'Không tìm thấy tin tức');
        router.push('/dashboard/admin/cms/news');
      }
    } catch {
      toast.error('Lỗi khi tải tin tức');
    } finally {
      setPageLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, coverImage: data.url }));
        toast.success('Upload ảnh thành công');
      } else {
        toast.error(data.error || data.message || 'Lỗi khi upload ảnh');
      }
    } catch {
      toast.error('Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setSaving(true);

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const response = await fetch(`/api/news/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tags: tagsArray }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật tin tức thành công');
        router.push('/dashboard/admin/cms/news');
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật tin tức');
      }
    } catch {
      toast.error('Lỗi khi cập nhật tin tức');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.value === formData.category);
  const tagList = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b mb-6">
        <div className="flex items-center justify-between px-1 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <h1 className="text-base font-semibold">Chỉnh sửa tin tức</h1>
              {formData.title && (
                <p className="text-xs text-muted-foreground line-clamp-1">{formData.title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {formData.isPublished && (
              <a
                href={`/news/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Xem bài
              </a>
            )}
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="mb-4">
                <div className="flex border rounded-lg overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => setLang('vi')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      lang === 'vi'
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      lang === 'en'
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {lang === 'vi' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Tiêu đề <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tiêu đề tin tức..."
                      className="text-base font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="summary" className="text-sm font-medium">Tóm tắt</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Tóm tắt ngắn gọn về nội dung tin..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Nội dung <span className="text-red-500">*</span>
                    </Label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(v) => setFormData({ ...formData, content: v })}
                      placeholder="Nhập nội dung chi tiết..."
                      height="420px"
                    />
                  </div>
                </div>
              )}

              {lang === 'en' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="titleEn" className="text-sm font-medium">Title</Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      placeholder="Enter news title..."
                      className="text-base font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="summaryEn" className="text-sm font-medium">Summary</Label>
                    <Textarea
                      id="summaryEn"
                      value={formData.summaryEn}
                      onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
                      placeholder="Brief summary..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Content</Label>
                    <RichTextEditor
                      value={formData.contentEn}
                      onChange={(v) => setFormData({ ...formData, contentEn: v })}
                      placeholder="Enter detailed content..."
                      height="420px"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Xuất bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Công khai</p>
                  <p className="text-xs text-muted-foreground">Hiển thị trên website</p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(v) => setFormData({ ...formData, isPublished: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    Nổi bật
                  </p>
                  <p className="text-xs text-muted-foreground">Hiển thị trên trang chủ</p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${cat.color}`}>
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedCategory.color}`}>
                    {selectedCategory.label}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-sm flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tagList.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                Ảnh bìa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border group">
                  <Image
                    src={formData.coverImage}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                    onError={() => {}}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed rounded-lg p-5 text-center hover:bg-muted/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {uploading ? 'Đang upload...' : 'Click để chọn ảnh'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hoặc nhập URL ảnh</Label>
                <Input
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
