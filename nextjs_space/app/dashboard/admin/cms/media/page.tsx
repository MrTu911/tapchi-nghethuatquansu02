'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Upload, Trash2, Search, X, Eye, Copy,
  FileText, Image as ImageIcon, Loader2,
  Edit3, RefreshCw, Database, Video, FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getImageUrl } from '@/lib/image-utils-client';

interface MediaFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudStoragePath: string;
  altText: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  uploadedBy: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface LibraryStats {
  imageCount: number;
  videoCount: number;
  totalSize: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

export default function MediaLibraryPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1, limit: 20, totalCount: 0, totalPages: 0,
  });
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({ imageCount: 0, videoCount: 0, totalSize: 0 });
  const [brokenMedia, setBrokenMedia] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);

  const [editAltText, setEditAltText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(fileTypeFilter !== 'all' && { fileType: fileTypeFilter }),
      });

      const response = await fetch(`/api/media?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setMediaFiles(data.data);
        setPagination(data.pagination);
        if (data.stats) setLibraryStats(data.stats);
      } else {
        toast.error(data.message || 'Lỗi tải media');
      }
    } catch {
      toast.error('Lỗi tải media');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, categoryFilter, fileTypeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async () => {
    if (!uploadFile) { toast.error('Vui lòng chọn file'); return; }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('category', uploadCategory);
      fd.append('altText', uploadAltText || uploadFile.name);
      fd.append('title', uploadTitle);
      fd.append('description', uploadDescription);
      fd.append('isPublic', uploadIsPublic.toString());

      const response = await fetch('/api/media', {
        method: 'POST', body: fd, credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Tải lên thành công');
        setShowUploadDialog(false);
        resetUploadForm();
        fetchMedia();
      } else {
        toast.error(data.message || 'Lỗi tải lên');
      }
    } catch {
      toast.error('Lỗi tải lên');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMedia) return;
    try {
      const response = await fetch(`/api/media/${selectedMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: editAltText, title: editTitle, description: editDescription, category: editCategory }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Đã cập nhật');
        setShowEditDialog(false);
        fetchMedia();
      } else {
        toast.error(data.message || 'Lỗi cập nhật');
      }
    } catch {
      toast.error('Lỗi cập nhật');
    }
  };

  const handleDelete = async () => {
    if (!selectedMedia) return;
    try {
      const response = await fetch(`/api/media/${selectedMedia.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Đã xóa');
        setShowDeleteDialog(false);
        setSelectedMedia(null);
        fetchMedia();
      } else {
        toast.error(data.message || 'Lỗi xóa');
      }
    } catch {
      toast.error('Lỗi xóa');
    }
  };

  const copyUrl = async (cloudStoragePath: string) => {
    try {
      await navigator.clipboard.writeText(getImageUrl(cloudStoragePath));
      toast.success('Đã copy URL');
    } catch {
      toast.error('Lỗi copy URL');
    }
  };

  const markBroken = (id: string) =>
    setBrokenMedia(prev => new Set([...prev, id]));

  const resetUploadForm = () => {
    setUploadFile(null); setUploadCategory('general');
    setUploadAltText(''); setUploadTitle('');
    setUploadDescription(''); setUploadIsPublic(false);
  };

  const openEditDialog = (media: MediaFile) => {
    setSelectedMedia(media);
    setEditAltText(media.altText || '');
    setEditTitle(media.title || '');
    setEditDescription(media.description || '');
    setEditCategory(media.category || 'general');
    setShowEditDialog(true);
  };

  const { imageCount, videoCount, totalSize } = libraryStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/30">
            <FolderOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thư viện Media</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý hình ảnh, video và tài liệu của hệ thống
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchMedia} title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Tải lên
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-200 dark:bg-teal-800">
              <FileText className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng file</p>
              <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{pagination.totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
              <ImageIcon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hình ảnh</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{imageCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
              <Video className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Video</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{videoCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
              <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dung lượng</p>
              <p className="text-xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, tiêu đề, alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="news">Tin tức</SelectItem>
            <SelectItem value="article">Bài báo</SelectItem>
            <SelectItem value="profile">Hồ sơ</SelectItem>
            <SelectItem value="general">Tổng quát</SelectItem>
          </SelectContent>
        </Select>

        <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Loại file" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="image/">Hình ảnh</SelectItem>
            <SelectItem value="video/">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">Chưa có file nào</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Tải lên" để thêm file đầu tiên</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mediaFiles.map((media) => {
            const isVideo = media.fileType.startsWith('video/');
            return (
              <Card key={media.id} className="group hover:shadow-md transition-shadow shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative bg-muted overflow-hidden" style={{ aspectRatio: isVideo ? '16/9' : '1' }}>
                    {brokenMedia.has(media.id) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40">
                        {isVideo
                          ? <Video className="h-9 w-9" />
                          : <ImageIcon className="h-9 w-9" />}
                        <span className="text-[10px] px-2 text-center leading-tight line-clamp-2">{media.fileName}</span>
                      </div>
                    ) : isVideo ? (
                      <video
                        src={getImageUrl(media.cloudStoragePath)}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const v = e.target as HTMLVideoElement;
                          if (v.duration > 1) v.currentTime = 1;
                        }}
                        onError={() => markBroken(media.id)}
                      />
                    ) : (
                      <Image
                        src={getImageUrl(media.cloudStoragePath)}
                        alt={media.altText || media.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        onError={() => markBroken(media.id)}
                      />
                    )}

                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => { setSelectedMedia(media); setShowPreviewDialog(true); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => copyUrl(media.cloudStoragePath)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1.5">
                    <p className="text-xs font-medium truncate" title={media.fileName}>
                      {media.title || media.fileName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatFileSize(media.fileSize)}</span>
                      {media.category && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {media.category}
                        </span>
                      )}
                    </div>
                    {media.width && media.height && (
                      <p className="text-xs text-muted-foreground">{media.width}×{media.height}</p>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => openEditDialog(media)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setSelectedMedia(media); setShowDeleteDialog(true); }}
                        disabled={media.usageCount > 0}
                        title={media.usageCount > 0 ? 'Đang được sử dụng' : 'Xóa'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
          >
            ← Trước
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
          >
            Sau →
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải lên Media</DialogTitle>
            <DialogDescription>Tải lên hình ảnh, video hoặc tài liệu</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-sm">Chọn file <span className="text-red-500">*</span></Label>
              <Input
                id="file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    if (!uploadAltText) setUploadAltText(file.name);
                  }
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hình ảnh (JPG, PNG, GIF, WebP) hoặc Video (MP4, WebM). Tối đa 10MB
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upload-category" className="text-sm">Danh mục <span className="text-red-500">*</span></Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger id="upload-category" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Tổng quát</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="news">Tin tức</SelectItem>
                    <SelectItem value="article">Bài báo</SelectItem>
                    <SelectItem value="profile">Hồ sơ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="alt-text" className="text-sm">Alt Text <span className="text-red-500">*</span></Label>
                <Input
                  id="alt-text"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="Mô tả ảnh..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upload-title" className="text-sm">Tiêu đề</Label>
              <Input
                id="upload-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Tiêu đề hiển thị"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="upload-desc" className="text-sm">Mô tả</Label>
              <Textarea
                id="upload-desc"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Mô tả chi tiết..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowUploadDialog(false); resetUploadForm(); }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tải...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Tải lên</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{selectedMedia?.fileName}</DialogTitle>
            <DialogDescription>{selectedMedia?.description || 'Chi tiết file'}</DialogDescription>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedMedia.fileType.startsWith('video/') ? (
                  <video
                    src={getImageUrl(selectedMedia.cloudStoragePath)}
                    controls
                    className="w-full h-full object-contain"
                  >
                    <source src={getImageUrl(selectedMedia.cloudStoragePath)} type={selectedMedia.fileType} />
                  </video>
                ) : (
                  <Image
                    src={getImageUrl(selectedMedia.cloudStoragePath)}
                    alt={selectedMedia.altText || selectedMedia.fileName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'Loại file', value: selectedMedia.fileType },
                  { label: 'Kích thước', value: formatFileSize(selectedMedia.fileSize) },
                  { label: 'Danh mục', value: selectedMedia.category || '—' },
                  ...(selectedMedia.width && selectedMedia.height ? [{ label: 'Kích thước ảnh', value: `${selectedMedia.width}×${selectedMedia.height}px` }] : []),
                  { label: 'Lượt dùng', value: `${selectedMedia.usageCount} lần` },
                  { label: 'Ngày tải', value: formatDate(selectedMedia.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-xs mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedMedia && copyUrl(selectedMedia.cloudStoragePath)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button onClick={() => setShowPreviewDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
            <DialogDescription>Cập nhật metadata file media</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category" className="text-sm">Danh mục</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger id="edit-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Tổng quát</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="news">Tin tức</SelectItem>
                  <SelectItem value="article">Bài báo</SelectItem>
                  <SelectItem value="profile">Hồ sơ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-alt" className="text-sm">Alt Text</Label>
              <Input id="edit-alt" value={editAltText} onChange={(e) => setEditAltText(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-title" className="text-sm">Tiêu đề</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-desc" className="text-sm">Mô tả</Label>
              <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1 resize-none" rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Hủy</Button>
            <Button onClick={handleEdit} className="bg-teal-600 hover:bg-teal-700">Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa file "{selectedMedia?.fileName}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
