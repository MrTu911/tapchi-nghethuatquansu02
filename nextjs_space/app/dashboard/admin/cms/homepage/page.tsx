'use client';

import { useState, useEffect } from 'react';
import {
  Star, Plus, Trash2, LayoutDashboard, FileText, Search,
  Eye, Edit, GripVertical, Layout, Type, BarChart, Mail, Box,
  CheckCircle2, XCircle, Globe, AlignLeft, Link2, RefreshCw,
  ChevronUp, ChevronDown, ToggleLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeaturedArticle {
  id: string;
  articleId: string;
  position: number;
  reason?: string;
  isActive: boolean;
  article: {
    id: string;
    submission: {
      title: string;
      titleEn?: string;
      author: { fullName: string };
    };
    issue?: { volumeNo: string; issueNo: string; year: string };
  };
}

interface Article {
  id: string;
  submission: {
    title: string;
    titleEn?: string;
    author: { fullName: string };
  };
  issue?: { volumeNo: string; issueNo: string; year: string };
}

interface HomepageSection {
  id: string;
  key: string;
  type: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  content?: string;
  contentEn?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  linkTextEn?: string;
  settings?: Record<string, unknown>;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SectionFormData = {
  key: string;
  type: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  content: string;
  contentEn: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  linkTextEn: string;
  isActive: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTION_TYPES = [
  { value: 'hero',       label: 'Hero Banner',   icon: Layout,   color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',  description: 'Banner chính với hình ảnh lớn' },
  { value: 'articles',   label: 'Bài viết',       icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',          description: 'Hiển thị danh sách bài viết' },
  { value: 'issues',     label: 'Số tạp chí',     icon: Box,      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', description: 'Hiển thị các số tạp chí' },
  { value: 'text',       label: 'Văn bản',        icon: Type,     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',       description: 'Nội dung văn bản tùy chỉnh' },
  { value: 'stats',      label: 'Thống kê',       icon: BarChart, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',           description: 'Hiển thị số liệu thống kê' },
  { value: 'cards',      label: 'Cards',          icon: Layout,   color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',               description: 'Các card thông tin' },
  { value: 'newsletter', label: 'Newsletter',     icon: Mail,     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',   description: 'Form đăng ký nhận tin' },
] as const;

type SectionTypeValue = (typeof SECTION_TYPES)[number]['value'];

const EMPTY_FORM: SectionFormData = {
  key: '', type: 'hero', title: '', titleEn: '',
  subtitle: '', subtitleEn: '', content: '', contentEn: '',
  imageUrl: '', linkUrl: '', linkText: '', linkTextEn: '', isActive: true,
};

// ─── Helper components ────────────────────────────────────────────────────────

function SectionTypePill({ type }: { type: string }) {
  const def = SECTION_TYPES.find(t => t.value === type);
  const Icon = def?.icon ?? Layout;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${def?.color ?? 'bg-muted text-muted-foreground'}`}>
      <Icon className="h-3 w-3" />
      {def?.label ?? type}
    </span>
  );
}

function SortableSectionItem({
  section,
  onEdit,
  onDelete,
  onPreview,
  onToggleActive,
}: {
  section: HomepageSection;
  onEdit: (s: HomepageSection) => void;
  onDelete: (s: HomepageSection) => void;
  onPreview: (s: HomepageSection) => void;
  onToggleActive: (s: HomepageSection) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        section.isActive
          ? 'bg-card hover:bg-muted/40'
          : 'bg-muted/30 hover:bg-muted/50 border-dashed opacity-70'
      }`}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Order badge */}
      <span className="w-6 text-center text-xs font-bold text-muted-foreground shrink-0">
        {section.order + 1}
      </span>

      {/* Section info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{section.title || section.key}</span>
          <SectionTypePill type={section.type} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{section.key}</p>
      </div>

      {/* Inline active toggle */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Switch
          checked={section.isActive}
          onCheckedChange={() => onToggleActive(section)}
          className="data-[state=checked]:bg-emerald-500"
        />
        <span className={`text-xs font-medium w-12 ${section.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {section.isActive ? 'Hiện' : 'Ẩn'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(section)} title="Xem trước">
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(section)} title="Chỉnh sửa">
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(section)}
          title="Xóa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Section Edit Dialog ──────────────────────────────────────────────────────

function SectionEditDialog({
  open,
  onOpenChange,
  currentSection,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSection: HomepageSection | null;
  onSave: (data: SectionFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<SectionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState<'basic' | 'vi' | 'en'>('basic');

  useEffect(() => {
    if (open) {
      setFormTab('basic');
      setForm(
        currentSection
          ? {
              key: currentSection.key,
              type: currentSection.type,
              title: currentSection.title ?? '',
              titleEn: currentSection.titleEn ?? '',
              subtitle: currentSection.subtitle ?? '',
              subtitleEn: currentSection.subtitleEn ?? '',
              content: currentSection.content ?? '',
              contentEn: currentSection.contentEn ?? '',
              imageUrl: currentSection.imageUrl ?? '',
              linkUrl: currentSection.linkUrl ?? '',
              linkText: currentSection.linkText ?? '',
              linkTextEn: currentSection.linkTextEn ?? '',
              isActive: currentSection.isActive,
            }
          : EMPTY_FORM
      );
    }
  }, [open, currentSection]);

  const set = (field: keyof SectionFormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.key.trim() || !form.type) {
      toast.error('Key và Loại section là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = SECTION_TYPES.find(t => t.value === form.type);
  const showContentFields = !['articles', 'issues', 'newsletter'].includes(form.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentSection ? (
              <><Edit className="h-4 w-4" /> Chỉnh sửa Section</>
            ) : (
              <><Plus className="h-4 w-4" /> Tạo Section mới</>
            )}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin section. Key phải duy nhất và không chứa khoảng trắng.
          </DialogDescription>
        </DialogHeader>

        {/* In-dialog tabs */}
        <div className="flex border-b gap-0 shrink-0">
          {(
            [
              { id: 'basic', label: 'Cơ bản' },
              { id: 'vi',    label: 'Nội dung VI' },
              { id: 'en',    label: 'Nội dung EN' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFormTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                formTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {/* Tab: Cơ bản */}
          {formTab === 'basic' && (
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="key">
                    Key <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground ml-1">(không sửa được sau khi tạo)</span>
                  </Label>
                  <Input
                    id="key"
                    value={form.key}
                    onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="hero_banner"
                    disabled={!!currentSection}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type">
                    Loại section <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.type} onValueChange={v => set('type', v)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedType && (
                    <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl">URL Hình ảnh</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={e => set('imageUrl', e.target.value)}
                  placeholder="/images/hero.jpg hoặc https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="linkUrl">URL Liên kết</Label>
                  <Input
                    id="linkUrl"
                    value={form.linkUrl}
                    onChange={e => set('linkUrl', e.target.value)}
                    placeholder="/about"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkText">Text nút liên kết (VI)</Label>
                  <Input
                    id="linkText"
                    value={form.linkText}
                    onChange={e => set('linkText', e.target.value)}
                    placeholder="Xem thêm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkTextEn">Text nút liên kết (EN)</Label>
                <Input
                  id="linkTextEn"
                  value={form.linkTextEn}
                  onChange={e => set('linkTextEn', e.target.value)}
                  placeholder="Read more"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Hiển thị trên trang chủ</p>
                  <p className="text-xs text-muted-foreground">Bật để section xuất hiện trên trang chủ</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => set('isActive', v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Tab: Nội dung VI */}
          {formTab === 'vi' && (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Globe className="h-4 w-4" />
                Nội dung tiếng Việt
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subtitle">Phụ đề</Label>
                <Textarea
                  id="subtitle"
                  value={form.subtitle}
                  onChange={e => set('subtitle', e.target.value)}
                  rows={3}
                  placeholder="Nhập phụ đề..."
                />
              </div>

              {showContentFields && (
                <div className="space-y-1.5">
                  <Label htmlFor="content">
                    Nội dung
                    <span className="text-xs text-muted-foreground ml-1">(HTML hoặc JSON)</span>
                  </Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    rows={8}
                    placeholder="<p>Nội dung...</p>"
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Nội dung EN */}
          {formTab === 'en' && (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Globe className="h-4 w-4" />
                English content
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="titleEn">Title</Label>
                <Input
                  id="titleEn"
                  value={form.titleEn}
                  onChange={e => set('titleEn', e.target.value)}
                  placeholder="Enter title..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subtitleEn">Subtitle</Label>
                <Textarea
                  id="subtitleEn"
                  value={form.subtitleEn}
                  onChange={e => set('subtitleEn', e.target.value)}
                  rows={3}
                  placeholder="Enter subtitle..."
                />
              </div>

              {showContentFields && (
                <div className="space-y-1.5">
                  <Label htmlFor="contentEn">
                    Content
                    <span className="text-xs text-muted-foreground ml-1">(HTML or JSON)</span>
                  </Label>
                  <Textarea
                    id="contentEn"
                    value={form.contentEn}
                    onChange={e => set('contentEn', e.target.value)}
                    rows={8}
                    placeholder="<p>Content...</p>"
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...</>
            ) : currentSection ? (
              'Cập nhật'
            ) : (
              'Tạo mới'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Preview Dialog ───────────────────────────────────────────────────────────

function SectionPreviewDialog({
  section,
  open,
  onOpenChange,
}: {
  section: HomepageSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!section) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview: {section.title || section.key}
          </DialogTitle>
        </DialogHeader>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm pb-3 border-b">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="font-medium text-foreground">Key:</span>
            <code className="bg-muted px-1.5 rounded font-mono text-xs">{section.key}</code>
          </span>
          <SectionTypePill type={section.type} />
          <Badge variant={section.isActive ? 'default' : 'secondary'} className={section.isActive ? 'bg-emerald-500' : ''}>
            {section.isActive ? 'Đang hiện' : 'Đang ẩn'}
          </Badge>
          <span className="text-muted-foreground">Thứ tự: {section.order + 1}</span>
        </div>

        {/* Preview content */}
        <div className="rounded-xl border bg-muted/20 p-6 space-y-4">
          {section.imageUrl && (
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.imageUrl} alt={section.title ?? ''} className="w-full h-full object-cover" />
            </div>
          )}
          {section.title && <h2 className="text-2xl font-bold">{section.title}</h2>}
          {section.subtitle && <p className="text-muted-foreground">{section.subtitle}</p>}
          {section.content && (
            <div className="prose dark:prose-invert max-w-none text-sm">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          )}
          {section.linkUrl && section.linkText && (
            <Button asChild variant="default" size="sm">
              <a href={section.linkUrl}>{section.linkText}</a>
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="pt-4 pb-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomepageManagementPage() {
  // Featured articles state
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Sections state
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteArticleDialog, setDeleteArticleDialog] = useState(false);
  const [deleteSectionDialog, setDeleteSectionDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState<HomepageSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<HomepageSection | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<FeaturedArticle | null>(null);

  const [activeTab, setActiveTab] = useState('featured');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchFeaturedArticles = async () => {
    setLoadingFeatured(true);
    try {
      const res = await fetch('/api/featured-articles');
      const data = await res.json();
      if (data.success) setFeaturedArticles(data.data);
      else toast.error('Lỗi khi tải bài viết nổi bật');
    } catch {
      toast.error('Lỗi khi tải bài viết nổi bật');
    } finally {
      setLoadingFeatured(false);
    }
  };

  const fetchAvailableArticles = async () => {
    try {
      const res = await fetch('/api/articles?status=PUBLISHED&limit=100');
      const data = await res.json();
      if (data.success && data.data?.articles) setAvailableArticles(data.data.articles);
    } catch {
      // silently ignore — available articles list is secondary
    }
  };

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const res = await fetch('/api/homepage-sections');
      const data = await res.json();
      if (data.success) setSections(data.data);
      else toast.error('Lỗi khi tải sections');
    } catch {
      toast.error('Lỗi khi tải sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedArticles();
    fetchAvailableArticles();
    fetchSections();
  }, []);

  // ── Section actions ───────────────────────────────────────────────────────

  const handleSaveSection = async (formData: SectionFormData) => {
    const url = currentSection
      ? `/api/homepage-sections/${currentSection.id}`
      : '/api/homepage-sections';
    const res = await fetch(url, {
      method: currentSection ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(currentSection ? 'Đã cập nhật section' : 'Đã tạo section mới');
      setEditDialogOpen(false);
      fetchSections();
    } else {
      toast.error(data.error || 'Lỗi khi lưu section');
      throw new Error(data.error);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    const res = await fetch(`/api/homepage-sections/${sectionToDelete.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Đã xóa section');
      setDeleteSectionDialog(false);
      setSectionToDelete(null);
      fetchSections();
    } else {
      toast.error('Lỗi khi xóa section');
    }
  };

  const handleToggleSectionActive = async (section: HomepageSection) => {
    const newActive = !section.isActive;
    // Optimistic update
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, isActive: newActive } : s));
    try {
      const res = await fetch(`/api/homepage-sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(newActive ? 'Section đã được hiển thị' : 'Section đã bị ẩn');
    } catch {
      // Revert
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, isActive: !newActive } : s));
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setSections(newSections);

    try {
      await Promise.all(
        newSections.map(s =>
          fetch(`/api/homepage-sections/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: s.order }),
          })
        )
      );
      toast.success('Đã cập nhật thứ tự sections');
    } catch {
      toast.error('Lỗi khi cập nhật thứ tự');
      fetchSections();
    }
  };

  // ── Featured article actions ───────────────────────────────────────────────

  const handleAddFeatured = async (articleId: string) => {
    const res = await fetch('/api/featured-articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Đã thêm vào danh sách nổi bật');
      fetchFeaturedArticles();
    } else {
      toast.error(data.error || 'Lỗi khi thêm bài viết');
    }
  };

  const handleRemoveFeatured = async () => {
    if (!articleToDelete) return;
    const res = await fetch(`/api/featured-articles/${articleToDelete.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Đã xóa khỏi danh sách nổi bật');
      setDeleteArticleDialog(false);
      setArticleToDelete(null);
      fetchFeaturedArticles();
    } else {
      toast.error('Lỗi khi xóa');
    }
  };

  const moveFeatured = async (id: string, dir: 'up' | 'down') => {
    const idx = featuredArticles.findIndex(a => a.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= featuredArticles.length) return;

    const next = [...featuredArticles];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    const withPositions = next.map((a, i) => ({ ...a, position: i }));
    setFeaturedArticles(withPositions);

    try {
      await Promise.all(
        withPositions.map(a =>
          fetch(`/api/featured-articles/${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: a.position }),
          })
        )
      );
    } catch {
      toast.error('Lỗi khi cập nhật thứ tự');
      fetchFeaturedArticles();
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const featuredArticleIds = new Set(featuredArticles.map(fa => fa.articleId));
  const filteredAvailable = availableArticles.filter(a => {
    if (featuredArticleIds.has(a.id)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.submission.title.toLowerCase().includes(q) ||
      (a.submission.titleEn ?? '').toLowerCase().includes(q) ||
      a.submission.author.fullName.toLowerCase().includes(q)
    );
  });

  const activeSectionCount = sections.filter(s => s.isActive).length;
  const activeFeaturedCount = featuredArticles.filter(fa => fa.isActive).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Quản lý Trang chủ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình bài viết nổi bật và các sections hiển thị trên trang chủ
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchFeaturedArticles(); fetchSections(); }}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Bài viết nổi bật"
          value={featuredArticles.length}
          sub={`${activeFeaturedCount} đang hiện`}
          color="border-l-amber-400"
        />
        <StatCard
          label="Sections trang chủ"
          value={sections.length}
          sub={`${activeSectionCount} đang hiện`}
          color="border-l-violet-400"
        />
        <StatCard
          label="Bài có thể thêm"
          value={availableArticles.length - featuredArticles.length}
          sub="bài đã xuất bản"
          color="border-l-blue-400"
        />
        <StatCard
          label="Sections đang ẩn"
          value={sections.length - activeSectionCount}
          sub="chưa hiển thị"
          color="border-l-slate-400"
        />
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="featured" className="gap-2">
            <Star className="h-4 w-4" />
            Bài viết nổi bật
            <Badge variant="secondary" className="ml-1 text-xs">{featuredArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Layout className="h-4 w-4" />
            Homepage Sections
            <Badge variant="secondary" className="ml-1 text-xs">{sections.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Bài viết nổi bật ── */}
        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left: Featured list */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  Đang nổi bật
                  <span className="text-muted-foreground text-sm font-normal">({featuredArticles.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground">Dùng ↑↓ để sắp xếp thứ tự</p>
              </div>

              {loadingFeatured ? (
                <div className="flex items-center justify-center h-48 border rounded-xl">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : featuredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl text-muted-foreground gap-2">
                  <Star className="h-10 w-10 opacity-20" />
                  <p className="font-medium">Chưa có bài viết nổi bật</p>
                  <p className="text-sm">Thêm bài từ danh sách bên phải</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {featuredArticles.map((fa, idx) => (
                    <div
                      key={fa.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Position */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => moveFeatured(fa.id, 'up')}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                          {idx + 1}
                        </span>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => moveFeatured(fa.id, 'down')}
                          disabled={idx === featuredArticles.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Article info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2 leading-snug">
                          {fa.article.submission.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fa.article.submission.author.fullName}
                        </p>
                        {fa.article.issue && (
                          <Badge variant="outline" className="text-xs mt-1.5">
                            Số {fa.article.issue.issueNo}/{fa.article.issue.year}
                          </Badge>
                        )}
                      </div>

                      {/* Remove */}
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setArticleToDelete(fa); setDeleteArticleDialog(true); }}
                        title="Xóa khỏi nổi bật"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Article picker */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Thêm bài viết
                </h2>
                <span className="text-xs text-muted-foreground">{filteredAvailable.length} bài</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tiêu đề, tác giả..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Article list */}
              <div className="border rounded-xl overflow-hidden">
                {filteredAvailable.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <FileText className="h-8 w-8 opacity-20" />
                    <p className="text-sm">
                      {searchQuery ? 'Không tìm thấy bài phù hợp' : 'Tất cả bài đã được thêm'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[480px] overflow-y-auto">
                    {filteredAvailable.map(article => (
                      <div
                        key={article.id}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 leading-snug">
                            {article.submission.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {article.submission.author.fullName}
                          </p>
                          {article.issue && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Số {article.issue.issueNo}/{article.issue.year}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 shrink-0 text-xs"
                          onClick={() => handleAddFeatured(article.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Thêm
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Homepage Sections ── */}
        <TabsContent value="sections" className="mt-6 space-y-4">
          {/* Section header with actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Homepage Sections</h2>
              <p className="text-sm text-muted-foreground">
                Kéo thả để sắp xếp thứ tự • Click toggle để ẩn/hiện nhanh
              </p>
            </div>
            <Button
              onClick={() => { setCurrentSection(null); setEditDialogOpen(true); }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Thêm section
            </Button>
          </div>

          {sectionsLoading ? (
            <div className="flex items-center justify-center h-48 border rounded-xl">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl text-muted-foreground gap-2">
              <Layout className="h-10 w-10 opacity-20" />
              <p className="font-medium">Chưa có section nào</p>
              <Button variant="outline" size="sm" onClick={() => { setCurrentSection(null); setEditDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Tạo section đầu tiên
              </Button>
            </div>
          ) : (
            <>
              {/* Section type legend */}
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map(t => (
                  <span key={t.value} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${t.color}`}>
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </span>
                ))}
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {sections.map(section => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        onEdit={s => { setCurrentSection(s); setEditDialogOpen(true); }}
                        onDelete={s => { setSectionToDelete(s); setDeleteSectionDialog(true); }}
                        onPreview={s => { setCurrentSection(s); setPreviewDialogOpen(true); }}
                        onToggleActive={handleToggleSectionActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <p className="text-xs text-muted-foreground text-center pt-1">
                {activeSectionCount} / {sections.length} sections đang hiển thị
              </p>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}

      <SectionEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentSection={currentSection}
        onSave={handleSaveSection}
      />

      <SectionPreviewDialog
        section={currentSection}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />

      {/* Delete featured article */}
      <AlertDialog open={deleteArticleDialog} onOpenChange={setDeleteArticleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khỏi nổi bật?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài viết{' '}
              <strong>&quot;{articleToDelete?.article.submission.title}&quot;</strong>{' '}
              sẽ bị xóa khỏi danh sách nổi bật trên trang chủ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFeatured}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete section */}
      <AlertDialog open={deleteSectionDialog} onOpenChange={setDeleteSectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa section?</AlertDialogTitle>
            <AlertDialogDescription>
              Section{' '}
              <strong>&quot;{sectionToDelete?.title || sectionToDelete?.key}&quot;</strong>{' '}
              sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
