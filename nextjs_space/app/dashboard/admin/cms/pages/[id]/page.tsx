"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Save,
  Eye,
  ArrowLeft,
  FileText,
  Globe,
  Settings,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor";

interface PublicPage {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  content: string;
  contentEn?: string | null;
  metaTitle?: string | null;
  metaTitleEn?: string | null;
  metaDesc?: string | null;
  metaDescEn?: string | null;
  ogImage?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  template: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function SeoCharCount({
  value,
  max,
  recommended,
}: {
  value: string;
  max: number;
  recommended: string;
}) {
  const len = value.length;
  const isOver = len > max;
  const isGood = len >= parseInt(recommended.split("-")[0]) && len <= max;
  return (
    <p
      className={`text-xs mt-1 ${
        isOver
          ? "text-red-500"
          : isGood
          ? "text-emerald-600"
          : "text-muted-foreground"
      }`}
    >
      {len}/{max} ký tự{" "}
      <span className="text-muted-foreground">(đề xuất: {recommended})</span>
    </p>
  );
}

export default function EditPublicPagePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    titleEn: "",
    content: "",
    contentEn: "",
    metaTitle: "",
    metaTitleEn: "",
    metaDesc: "",
    metaDescEn: "",
    ogImage: "",
    isPublished: false,
    template: "default",
    order: 0,
  });

  useEffect(() => {
    fetchPage();
  }, [params.id]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => handleSave(true), 30000);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, formData]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/public-pages/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setPage(data.data);
        setFormData({
          slug: data.data.slug,
          title: data.data.title,
          titleEn: data.data.titleEn || "",
          content: data.data.content,
          contentEn: data.data.contentEn || "",
          metaTitle: data.data.metaTitle || "",
          metaTitleEn: data.data.metaTitleEn || "",
          metaDesc: data.data.metaDesc || "",
          metaDescEn: data.data.metaDescEn || "",
          ogImage: data.data.ogImage || "",
          isPublished: data.data.isPublished,
          template: data.data.template,
          order: data.data.order || 0,
        });
      } else {
        toast.error("Không thể tải trang");
        router.push("/dashboard/admin/cms/pages");
      }
    } catch {
      toast.error("Lỗi khi tải trang");
      router.push("/dashboard/admin/cms/pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (silent = false) => {
    if (!formData.slug || !formData.title || !formData.content) {
      if (!silent) toast.error("Vui lòng điền đầy đủ Slug, Tiêu đề và Nội dung");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/public-pages/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setPage(data.data);
        setHasUnsavedChanges(false);
        if (!silent) toast.success("Đã lưu trang thành công");
      } else {
        if (!silent) toast.error(data.message || "Không thể lưu trang");
      }
    } catch {
      if (!silent) toast.error("Lỗi khi lưu trang");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setNextRoute("/dashboard/admin/cms/pages");
      setShowExitDialog(true);
    } else {
      router.push("/dashboard/admin/cms/pages");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-700" />
        <p className="text-sm text-muted-foreground">Đang tải trang...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-base font-medium">Không tìm thấy trang</p>
        <Button
          onClick={() => router.push("/dashboard/admin/cms/pages")}
          variant="outline"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0 mt-0.5"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quay lại danh sách</TooltipContent>
            </Tooltip>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {formData.title || "Chỉnh sửa trang"}
                </h1>
                {hasUnsavedChanges ? (
                  <Badge
                    variant="outline"
                    className="border-amber-400 text-amber-700 dark:text-amber-400 text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Chưa lưu
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-400 text-emerald-700 dark:text-emerald-400 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Đã lưu
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                  /pages/{formData.slug}
                </code>
                {formData.isPublished && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border-0">
                    <Eye className="h-3 w-3 mr-1" />
                    Công khai
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {formData.isPublished && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`/pages/${formData.slug}`, "_blank")
                    }
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Xem công khai</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mở trang trên website</TooltipContent>
              </Tooltip>
            )}
            <Button
              onClick={() => handleSave(false)}
              disabled={saving || !hasUnsavedChanges}
              size="sm"
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content area */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="content" className="gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Tiếng Việt
                </TabsTrigger>
                <TabsTrigger value="english" className="gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5" />
                  English
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2 text-sm">
                  <Settings className="h-3.5 w-3.5" />
                  SEO
                </TabsTrigger>
              </TabsList>

              {/* Vietnamese Content */}
              <TabsContent value="content" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-700" />
                      Nội dung tiếng Việt
                    </CardTitle>
                    <CardDescription>
                      Nội dung chính hiển thị cho người đọc tiếng Việt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title">
                        Tiêu đề <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          handleFieldChange("title", e.target.value)
                        }
                        placeholder="Nhập tiêu đề trang..."
                        className="text-base font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="content">
                        Nội dung <span className="text-red-500">*</span>
                      </Label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(value) => handleFieldChange("content", value)}
                        placeholder="Nhập nội dung trang..."
                        height="480px"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sử dụng thanh công cụ để định dạng, thêm hình ảnh, bảng, video...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* English Content */}
              <TabsContent value="english" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      English Content
                    </CardTitle>
                    <CardDescription>
                      Optional English version — leave empty to disable bilingual mode
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="titleEn">Title (English)</Label>
                      <Input
                        id="titleEn"
                        value={formData.titleEn}
                        onChange={(e) =>
                          handleFieldChange("titleEn", e.target.value)
                        }
                        placeholder="Enter English title..."
                        className="text-base font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contentEn">Content (English)</Label>
                      <RichTextEditor
                        value={formData.contentEn}
                        onChange={(value) =>
                          handleFieldChange("contentEn", value)
                        }
                        placeholder="Enter page content in English..."
                        height="480px"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="mt-4 space-y-4">
                {/* Vietnamese SEO */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SEO — Tiếng Việt</CardTitle>
                    <CardDescription>
                      Thông tin hiển thị trên kết quả tìm kiếm Google (tiếng Việt)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          handleFieldChange("metaTitle", e.target.value)
                        }
                        placeholder="Tự động dùng tiêu đề trang nếu để trống"
                      />
                      <SeoCharCount
                        value={formData.metaTitle}
                        max={60}
                        recommended="50-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="metaDesc">Meta Description</Label>
                      <Textarea
                        id="metaDesc"
                        value={formData.metaDesc}
                        onChange={(e) =>
                          handleFieldChange("metaDesc", e.target.value)
                        }
                        placeholder="Mô tả ngắn gọn về nội dung trang (hiển thị dưới tên trang trên Google)"
                        rows={3}
                        className="resize-none"
                      />
                      <SeoCharCount
                        value={formData.metaDesc}
                        max={160}
                        recommended="150-160"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* English SEO */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SEO — English</CardTitle>
                    <CardDescription>
                      SEO metadata for English version
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="metaTitleEn">Meta Title (EN)</Label>
                      <Input
                        id="metaTitleEn"
                        value={formData.metaTitleEn}
                        onChange={(e) =>
                          handleFieldChange("metaTitleEn", e.target.value)
                        }
                        placeholder="Auto-use title if empty"
                      />
                      <SeoCharCount
                        value={formData.metaTitleEn}
                        max={60}
                        recommended="50-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="metaDescEn">Meta Description (EN)</Label>
                      <Textarea
                        id="metaDescEn"
                        value={formData.metaDescEn}
                        onChange={(e) =>
                          handleFieldChange("metaDescEn", e.target.value)
                        }
                        placeholder="Brief description of the page for English readers"
                        rows={3}
                        className="resize-none"
                      />
                      <SeoCharCount
                        value={formData.metaDescEn}
                        max={160}
                        recommended="150-160"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* OG Image */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-purple-600" />
                      Open Graph Image
                    </CardTitle>
                    <CardDescription>
                      Ảnh hiển thị khi chia sẻ trang trên mạng xã hội (Facebook, Twitter...)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ogImage">URL ảnh</Label>
                      <Input
                        id="ogImage"
                        value={formData.ogImage}
                        onChange={(e) =>
                          handleFieldChange("ogImage", e.target.value)
                        }
                        placeholder="https://example.com/og-image.jpg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Kích thước đề xuất: 1200×630px. Định dạng: JPG, PNG, WebP
                      </p>
                    </div>
                    {formData.ogImage && (
                      <div className="border rounded-lg overflow-hidden bg-muted/30">
                        <div className="text-xs text-muted-foreground px-3 py-2 border-b">
                          Preview
                        </div>
                        <div className="p-2">
                          <img
                            src={formData.ogImage}
                            alt="OG preview"
                            className="w-full h-auto rounded max-h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Publish */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {formData.isPublished ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                  Trạng thái xuất bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">
                      {formData.isPublished ? "Đang xuất bản" : "Đang là Nháp"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formData.isPublished
                        ? "Tất cả mọi người có thể xem"
                        : "Chỉ quản trị viên xem được"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isPublished", checked)
                    }
                  />
                </div>

                {page.publishedAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Xuất bản lần đầu:{" "}
                    {new Date(page.publishedAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Page Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                  Cài đặt trang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Slug (URL) *
                  </Label>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-2 border border-r-0 rounded-l font-mono shrink-0">
                      /pages/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        handleFieldChange("slug", e.target.value)
                      }
                      placeholder="gioi-thieu"
                      className="rounded-l-none font-mono text-sm"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Template
                  </Label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) =>
                      handleFieldChange("template", value)
                    }
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

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="order" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Thứ tự hiển thị
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      handleFieldChange("order", parseInt(e.target.value) || 0)
                    }
                    min={0}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Số nhỏ hơn hiển thị trước trong navigation
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() =>
                    formData.isPublished &&
                    window.open(`/pages/${formData.slug}`, "_blank")
                  }
                  disabled={!formData.isPublished}
                >
                  <ExternalLink className="h-4 w-4" />
                  Xem trang công khai
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={fetchPage}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tải lại từ server
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Tạo lúc</span>
                  <span className="text-right">
                    {new Date(page.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Cập nhật</span>
                  <span className="text-right">
                    {new Date(page.updatedAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">ID</span>
                  <code className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                    {page.id.slice(0, 8)}...
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exit Confirmation */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <Clock className="h-5 w-5" />
                Có thay đổi chưa lưu
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có thay đổi chưa được lưu. Nếu thoát ngay, các thay đổi này sẽ bị mất.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  if (nextRoute) router.push(nextRoute);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Thoát không lưu
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await handleSave(false);
                  if (nextRoute) router.push(nextRoute);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu và thoát
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
