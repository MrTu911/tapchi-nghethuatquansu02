'use client';

import { useState, useEffect } from 'react';
import { useDashboardSession } from '@/components/dashboard/session-context';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Edit3,
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  History,
} from 'lucide-react';
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Copyedit {
  id: string;
  articleId: string;
  version: number;
  notes: string | null;
  fileUrl: string | null;
  status: string;
  tags: string[];
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  article: {
    id: string;
    submission: {
      title: string;
      author: {
        fullName: string;
        org: string;
      };
    };
  };
  editor: {
    id: string;
    fullName: string;
    email: string;
  };
}

const statusConfig = {
  editing: { label: 'Đang biên tập', color: 'bg-blue-100 text-blue-800', icon: Edit3 },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  revision_needed: { label: 'Cần chỉnh sửa', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
};

export default function CopyeditingPage() {
  const router = useRouter();
  const session = useDashboardSession();
  const [copyedits, setCopyedits] = useState<Copyedit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCopyedit, setSelectedCopyedit] = useState<Copyedit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    notes: '',
    fileUrl: '',
    status: '',
    tags: [] as string[],
    deadline: '',
  });
  const [newTag, setNewTag] = useState('');
  const [history, setHistory] = useState<Copyedit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch copyedits
  useEffect(() => {
    fetchCopyedits();
  }, [statusFilter]);

  const fetchCopyedits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/copyediting?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCopyedits(data.data);
      } else {
        toast.error(data.message || 'Không thể tải danh sách biên tập');
      }
    } catch (error) {
      console.error('Fetch copyedits error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (copyedit: Copyedit) => {
    setSelectedCopyedit(copyedit);
    setEditForm({
      notes: copyedit.notes || '',
      fileUrl: copyedit.fileUrl || '',
      status: copyedit.status,
      tags: copyedit.tags || [],
      deadline: copyedit.deadline ? format(new Date(copyedit.deadline), 'yyyy-MM-dd') : '',
    });
    setNewTag('');
    setIsEditDialogOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm({ ...editForm, tags: [...editForm.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tagToRemove) });
  };

  const handleUpdate = async () => {
    if (!selectedCopyedit) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/copyediting/${selectedCopyedit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Cập nhật biên tập thành công');
        setIsEditDialogOpen(false);
        fetchCopyedits();
      } else {
        toast.error(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update copyedit error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (articleId: string) => {
    try {
      const res = await fetch(`/api/copyediting/history/${articleId}`);
      const data = await res.json();

      if (data.success) {
        setHistory(data.data.history);
        setIsHistoryDialogOpen(true);
      } else {
        toast.error(data.message || 'Không thể tải lịch sử');
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Lỗi kết nối server');
    }
  };

  const filteredCopyedits = copyedits.filter((item) => {
    const matchSearch = item.article.submission.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý Biên tập Nội dung
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý quá trình biên tập bài viết
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">
                Tìm kiếm bài viết
              </Label>
              <Input
                id="search"
                placeholder="Nhập tiêu đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">
                Trạng thái
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="editing">Đang biên tập</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="revision_needed">Cần chỉnh sửa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copyedits Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách Biên tập ({filteredCopyedits.length})
          </CardTitle>
          <CardDescription>
            Quản lý các phiên biên tập đang tiến hành
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCopyedits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Không có bài viết nào đang biên tập</p>
            </div>
          ) : (
            <TableScrollWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Phiên bản</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCopyedits.map((item) => {
                    const config = statusConfig[item.status as keyof typeof statusConfig];
                    const StatusIcon = config?.icon || FileText;
                    
                    // Check deadline status
                    const now = new Date();
                    const deadline = item.deadline ? new Date(item.deadline) : null;
                    const isOverdue = deadline && deadline < now && item.status !== 'completed';
                    const daysRemaining = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isNearDeadline = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && item.status !== 'completed';

                    return (
                      <TableRow key={item.id} className={isOverdue ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="font-medium">
                            {item.article.submission.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.article.submission.author.fullName} - {item.article.submission.author.org}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{item.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config?.label || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.tags && item.tags.length > 0 ? (
                              item.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Chưa có tag</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deadline ? (
                            <div className="space-y-1">
                              <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : isNearDeadline ? 'text-amber-600 font-medium' : 'text-gray-700'}`}>
                                {format(deadline, 'dd/MM/yyyy', { locale: vi })}
                              </div>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Quá hạn {Math.abs(daysRemaining || 0)} ngày
                                </Badge>
                              )}
                              {isNearDeadline && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Còn {daysRemaining} ngày
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Chưa có deadline</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(item.articleId)}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Cập nhật
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableScrollWrapper>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật Biên tập</DialogTitle>
            <DialogDescription>
              {selectedCopyedit?.article.submission.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Ghi chú biên tập</Label>
              <Textarea
                id="notes"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Nhập các thay đổi đã thực hiện..."
              />
            </div>

            <div>
              <Label htmlFor="fileUrl">File biên tập (URL)</Label>
              <Input
                id="fileUrl"
                type="url"
                value={editForm.fileUrl}
                onChange={(e) => setEditForm({ ...editForm, fileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editing">Đang biên tập</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="revision_needed">Cần chỉnh sửa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🆕 Tags Section */}
            <div>
              <Label>Tags thay đổi</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Thêm tag (VD: sửa chính tả, thêm hình...)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editForm.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {editForm.tags.length === 0 && (
                  <span className="text-sm text-gray-400">Chưa có tag nào</span>
                )}
              </div>
            </div>

            {/* 🆕 Deadline Section */}
            <div>
              <Label htmlFor="deadline">Deadline hoàn thành</Label>
              <Input
                id="deadline"
                type="date"
                value={editForm.deadline}
                onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              />
              {editForm.deadline && (
                <p className="text-xs text-gray-500 mt-1">
                  Ngày hết hạn: {format(new Date(editForm.deadline), 'dd/MM/yyyy', { locale: vi })}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử Biên tập</DialogTitle>
            <DialogDescription>
              Theo dõi các phiên biên tập trước đây
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Chưa có lịch sử biên tập
              </p>
            ) : (
              history.map((item) => {
                const config = statusConfig[item.status as keyof typeof statusConfig];
                const StatusIcon = config?.icon || FileText;
                return (
                  <Card key={item.id} className="border-l-4" style={{ borderLeftColor: config?.color.includes('blue') ? '#3b82f6' : config?.color.includes('green') ? '#10b981' : '#f59e0b' }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="outline">v{item.version}</Badge>
                            <Badge className={config?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config?.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Biên tập viên: {item.editor.fullName}
                          </CardDescription>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </div>
                    </CardHeader>
                    {(item.notes || item.fileUrl) && (
                      <CardContent>
                        {item.notes && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</p>
                            <p className="text-sm text-gray-600">{item.notes}</p>
                          </div>
                        )}
                        {item.fileUrl && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">File:</p>
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Tải file biên tập
                            </a>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
