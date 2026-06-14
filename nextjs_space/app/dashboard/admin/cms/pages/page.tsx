"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  FileText,
  RefreshCw,
  Globe,
  LayoutTemplate,
  CheckCircle2,
  Clock,
  Files,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface PublicPage {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  content: string;
  contentEn?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  ogImage?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  template: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  default: "Mặc định",
  about: "Giới thiệu",
  contact: "Liên hệ",
  team: "Đội ngũ",
};

const TEMPLATE_OPTIONS = [
  { value: "all", label: "Tất cả template" },
  { value: "default", label: "Mặc định" },
  { value: "about", label: "Giới thiệu" },
  { value: "contact", label: "Liên hệ" },
  { value: "team", label: "Đội ngũ" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "published", label: "Đã xuất bản" },
  { value: "draft", label: "Nháp" },
];

export default function PublicPagesManagement() {
  const router = useRouter();
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    titleEn: "",
    template: "default",
    isPublished: false,
    order: 0,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/public-pages");
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      } else {
        toast.error("Không thể tải danh sách trang");
      }
    } catch {
      toast.error("Lỗi khi tải danh sách trang");
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        !searchQuery ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.titleEn || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && page.isPublished) ||
        (statusFilter === "draft" && !page.isPublished);

      const matchesTemplate =
        templateFilter === "all" || page.template === templateFilter;

      return matchesSearch && matchesStatus && matchesTemplate;
    });
  }, [pages, searchQuery, statusFilter, templateFilter]);

  const stats = useMemo(() => ({
    total: pages.length,
    published: pages.filter((p) => p.isPublished).length,
    draft: pages.filter((p) => !p.isPublished).length,
  }), [pages]);

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || templateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTemplateFilter("all");
  };

  const handleCreate = async () => {
    if (!formData.slug || !formData.title) {
      toast.error("Vui lòng điền Slug và Tiêu đề");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/public-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, content: "" }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Tạo trang thành công! Đang mở trang chỉnh sửa...");
        setCreateDialogOpen(false);
        resetForm();
        router.push(`/dashboard/admin/cms/pages/${data.data.id}`);
      } else {
        toast.error(data.message || "Không thể tạo trang");
      }
    } catch {
      toast.error("Lỗi khi tạo trang");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      const res = await fetch(`/api/public-pages/${pageToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Xóa trang thành công");
        setDeleteDialogOpen(false);
        setPageToDelete(null);
        fetchPages();
      } else {
        toast.error(data.message || "Không thể xóa trang");
      }
    } catch {
      toast.error("Lỗi khi xóa trang");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/public-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(currentStatus ? "Đã chuyển sang Nháp" : "Đã xuất bản trang");
        setPages((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isPublished: !currentStatus } : p
          )
        );
      } else {
        toast.error(data.message || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleRevalidateCache = async () => {
    setRevalidating(true);
    try {
      const res = await fetch("/api/cache/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paths: ["/", ...pages.map((p) => `/pages/${p.slug}`)],
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã làm mới cache thành công");
      } else {
        toast.error(data.message || "Không thể làm mới cache");
      }
    } catch {
      toast.error("Lỗi khi làm mới cache");
    } finally {
      setRevalidating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      titleEn: "",
      template: "default",
      isPublished: false,
      order: 0,
    });
  };

  const confirmDelete = (id: string) => {
    setPageToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-700 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Đang tải danh sách trang...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <FileText className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                CMS / Trang tĩnh
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quản lý Trang Tĩnh
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quản lý các trang nội dung công khai: Giới thiệu, Liên hệ, Đội ngũ...
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevalidateCache}
                  disabled={revalidating}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${revalidating ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Làm mới Cache</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Làm mới cache tất cả trang</TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tạo trang mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Tổng trang
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Files className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Đã xuất bản
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {stats.published}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Nháp
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {stats.draft}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground mt-2">
                Hiển thị <span className="font-semibold text-foreground">{filteredPages.length}</span> / {stats.total} trang
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pages Table */}
        <Card className="overflow-hidden">
          {filteredPages.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {hasActiveFilters ? "Không tìm thấy trang nào" : "Chưa có trang nào"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Thử thay đổi từ khóa hoặc bộ lọc"
                  : "Tạo trang đầu tiên để bắt đầu quản lý nội dung"}
              </p>
              {!hasActiveFilters && (
                <Button
                  size="sm"
                  className="mt-4 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Tạo trang mới
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      Trang
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Template
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Thứ tự
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-muted-foreground">
                      Trạng thái
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                      Cập nhật
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPages.map((page) => (
                    <tr
                      key={page.id}
                      className={`group transition-colors hover:bg-muted/30 ${
                        page.isPublished
                          ? "border-l-2 border-l-emerald-500"
                          : "border-l-2 border-l-amber-400"
                      }`}
                    >
                      {/* Title + Slug */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 p-1 rounded shrink-0 ${
                              page.isPublished
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-amber-100 dark:bg-amber-900/30"
                            }`}
                          >
                            <FileText
                              className={`h-3.5 w-3.5 ${
                                page.isPublished
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/admin/cms/pages/${page.id}`)
                              }
                              className="font-semibold text-gray-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-left leading-tight"
                            >
                              {page.title}
                            </button>
                            {page.titleEn && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {page.titleEn}
                              </div>
                            )}
                            <div className="mt-1">
                              <code className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                                /pages/{page.slug}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Template */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            {TEMPLATE_LABELS[page.template] || page.template}
                          </span>
                        </div>
                      </td>

                      {/* Order */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-muted-foreground text-xs tabular-nums">
                          #{page.order}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {page.isPublished ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-xs gap-1 font-normal">
                            <CheckCircle2 className="h-3 w-3" />
                            Xuất bản
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 text-xs gap-1 font-normal"
                          >
                            <Clock className="h-3 w-3" />
                            Nháp
                          </Badge>
                        )}
                      </td>

                      {/* Updated at */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(page.updatedAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {page.isPublished && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-emerald-700"
                                  onClick={() =>
                                    window.open(`/pages/${page.slug}`, "_blank")
                                  }
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem trang công khai</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 ${
                                  page.isPublished
                                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                                onClick={() =>
                                  handleTogglePublish(page.id, page.isPublished)
                                }
                              >
                                {page.isPublished ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {page.isPublished ? "Chuyển sang Nháp" : "Xuất bản trang"}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() =>
                                  router.push(`/dashboard/admin/cms/pages/${page.id}`)
                                }
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Chỉnh sửa nội dung</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => confirmDelete(page.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xóa trang</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <Plus className="h-4 w-4 text-emerald-700" />
                </div>
                Tạo trang mới
              </DialogTitle>
              <DialogDescription>
                Điền thông tin cơ bản. Sau khi tạo, bạn sẽ được chuyển đến trang chỉnh sửa để nhập nội dung đầy đủ.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="create-slug" className="text-sm font-medium">
                  Slug (URL) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-2 rounded-l border border-r-0 font-mono shrink-0">
                    /pages/
                  </span>
                  <Input
                    id="create-slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                    }
                    placeholder="gioi-thieu"
                    className="rounded-l-none font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dùng dấu gạch ngang, không dùng khoảng trắng hay ký tự đặc biệt
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="create-title" className="text-sm font-medium">
                  Tiêu đề tiếng Việt <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Giới thiệu về tạp chí"
                />
              </div>

              {/* Title EN */}
              <div className="space-y-1.5">
                <Label htmlFor="create-titleEn" className="text-sm font-medium">
                  Tiêu đề tiếng Anh
                </Label>
                <Input
                  id="create-titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="About the journal"
                />
              </div>

              {/* Template + Order row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Template</Label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) => setFormData({ ...formData, template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Mặc định</SelectItem>
                      <SelectItem value="about">Giới thiệu</SelectItem>
                      <SelectItem value="contact">Liên hệ</SelectItem>
                      <SelectItem value="team">Đội ngũ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-order" className="text-sm font-medium">
                    Thứ tự
                  </Label>
                  <Input
                    id="create-order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Publish toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-sm font-medium">Xuất bản ngay</p>
                  <p className="text-xs text-muted-foreground">
                    Trang sẽ hiển thị công khai ngay sau khi tạo
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Tạo và chỉnh sửa
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Xác nhận xóa trang
              </AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Trang sẽ bị xóa vĩnh viễn khỏi hệ thống và không còn hiển thị trên website.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPageToDelete(null)}>
                Hủy bỏ
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa trang
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
