
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Search,
  FileText,
  Globe,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getImageUrl } from '@/lib/image-utils-client';

interface News {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  category?: string;
  coverImage?: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  views: number;
  createdAt: string;
  author?: {
    fullName: string;
  };
}

interface NewsStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}

const categories = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Paper' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'news', label: 'Tin tức' },
];

const categoryColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-700 border-blue-200',
  event: 'bg-purple-100 text-purple-700 border-purple-200',
  call_for_paper: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  policy: 'bg-orange-100 text-orange-700 border-orange-200',
  news: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function NewsManagementPage() {
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [stats, setStats] = useState<NewsStats>({ total: 0, published: 0, drafts: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNews();
  }, [page, category]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [totalRes, publishedRes, draftRes, featuredRes] = await Promise.all([
        fetch('/api/news?limit=1'),
        fetch('/api/news?limit=1&isPublished=true'),
        fetch('/api/news?limit=1&isPublished=false'),
        fetch('/api/news?limit=1&isFeatured=true'),
      ]);
      const [totalData, publishedData, draftData, featuredData] = await Promise.all([
        totalRes.json(),
        publishedRes.json(),
        draftRes.json(),
        featuredRes.json(),
      ]);
      setStats({
        total: totalData.pagination?.totalCount ?? 0,
        published: publishedData.pagination?.totalCount ?? 0,
        drafts: draftData.pagination?.totalCount ?? 0,
        featured: featuredData.pagination?.totalCount ?? 0,
      });
    } catch {
      // stats are non-critical
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (category !== 'all') params.append('category', category);
      if (keyword) params.append('keyword', keyword);

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message || 'Lỗi khi tải tin tức');
      }
    } catch {
      toast.error('Lỗi khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchNews();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const newsItem = news.find(n => n.id === deleteId);
      if (!newsItem) return;

      const response = await fetch(`/api/news/${newsItem.slug}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        toast.success('Xóa tin tức thành công');
        fetchNews();
        fetchStats();
      } else {
        toast.error(data.message || 'Lỗi khi xóa tin tức');
      }
    } catch {
      toast.error('Lỗi khi xóa tin tức');
    } finally {
      setDeleteId(null);
    }
  };

  const togglePublish = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !newsItem.isPublished }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(newsItem.isPublished ? 'Đã ẩn tin tức' : 'Đã công khai tin tức');
        fetchNews();
        fetchStats();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const toggleFeatured = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !newsItem.isFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(newsItem.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật');
        fetchNews();
        fetchStats();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật');
      }
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const getCategoryLabel = (value?: string) =>
    categories.find(c => c.value === value)?.label || value || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Newspaper className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Tin tức</h1>
            <p className="text-sm text-muted-foreground">Tin tức, thông báo và sự kiện của tạp chí</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/cms/news/create')}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo tin mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng tin</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800">
              <Globe className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Công khai</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-200 dark:bg-orange-800">
              <BookOpen className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nháp</p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{stats.drafts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-200 dark:bg-yellow-800">
              <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nổi bật</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.featured}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tin tức..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            Tìm
          </Button>
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12" />
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-36">Danh mục</TableHead>
              <TableHead className="w-32">Tác giả</TableHead>
              <TableHead className="w-24">Lượt xem</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-28">Ngày đăng</TableHead>
              <TableHead className="w-36 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Newspaper className="h-8 w-8 opacity-30" />
                    <p>Chưa có tin tức nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  {/* Thumbnail */}
                  <TableCell className="p-2">
                    <div className="w-12 h-9 rounded overflow-hidden bg-muted flex-shrink-0 relative">
                      {item.coverImage ? (
                        <Image
                          src={getImageUrl(item.coverImage)}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                          onError={() => {}}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {/* Title */}
                  <TableCell className="font-medium max-w-xs">
                    <div className="flex items-start gap-1.5">
                      {item.isFeatured && (
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="line-clamp-2 text-sm leading-snug">{item.title}</span>
                    </div>
                  </TableCell>
                  {/* Category */}
                  <TableCell>
                    {item.category && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          categoryColors[item.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {getCategoryLabel(item.category)}
                      </span>
                    )}
                  </TableCell>
                  {/* Author */}
                  <TableCell className="text-sm text-muted-foreground">
                    {item.author?.fullName || '—'}
                  </TableCell>
                  {/* Views */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {item.views.toLocaleString()}
                    </div>
                  </TableCell>
                  {/* Status */}
                  <TableCell>
                    {item.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Công khai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Nháp
                      </span>
                    )}
                  </TableCell>
                  {/* Date */}
                  <TableCell className="text-sm text-muted-foreground">
                    {item.publishedAt
                      ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                      : '—'}
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFeatured(item)}
                        title={item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.isFeatured ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePublish(item)}
                        title={item.isPublished ? 'Ẩn tin' : 'Công khai'}
                      >
                        {item.isPublished ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/dashboard/admin/cms/news/${item.slug}`)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(item.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            ← Trước
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau →
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
