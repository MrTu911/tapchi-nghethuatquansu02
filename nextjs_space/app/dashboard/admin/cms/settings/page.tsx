
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save,
  Loader2,
  Globe,
  Phone,
  Share2,
  Search,
  Palette,
  FileText,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Link2,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  label: string;
  labelEn: string | null;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  order: number;
}

interface ExternalLinkItem {
  title: string;
  url: string;
  icon: string;
  order: number;
  isActive: boolean;
}

interface FooterCategoryItem {
  label: string;
  href: string;
}

const ICON_OPTIONS = ['School', 'Shield', 'Globe', 'Newspaper', 'BookOpen', 'Link2'];

// Hàng kéo-thả cho một mục "Chuyên Mục" của footer.
function SortableFooterCategory({
  id,
  cat,
  onChange,
  onRemove,
}: {
  id: string;
  cat: FooterCategoryItem;
  onChange: (field: keyof FooterCategoryItem, value: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-4 rounded-lg border bg-muted/30 ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tên hiển thị</Label>
          <Input
            value={cat.label}
            onChange={(e) => onChange('label', e.target.value)}
            placeholder="VD: Nghệ thuật quân sự"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Đường dẫn</Label>
          <Input
            value={cat.href}
            onChange={(e) => onChange('href', e.target.value)}
            placeholder="/categories/..."
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [externalLinks, setExternalLinks] = useState<ExternalLinkItem[]>([]);
  const [footerCategories, setFooterCategories] = useState<FooterCategoryItem[]>([]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Mở đúng tab khi điều hướng từ Trung tâm CMS (?tab=footer ...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/site-settings');
      const data = await response.json();

      if (data.success && data.data?.settings) {
        setSettings(data.data.settings);

        // Initialize form data
        const initialData: Record<string, string> = {};
        data.data.settings.forEach((setting: SiteSetting) => {
          initialData[setting.key] = setting.value || '';
        });
        setFormData(initialData);

        // Parse external links
        const extLinksRaw = data.data.settings.find((s: SiteSetting) => s.key === 'external_links')?.value;
        if (extLinksRaw) {
          try {
            setExternalLinks(JSON.parse(extLinksRaw));
          } catch {
            setExternalLinks([]);
          }
        }

        // Parse footer categories
        const footerCatRaw = data.data.settings.find((s: SiteSetting) => s.key === 'footer_categories')?.value;
        if (footerCatRaw) {
          try {
            setFooterCategories(JSON.parse(footerCatRaw));
          } catch {
            setFooterCategories([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const addExternalLink = () => {
    const newLink: ExternalLinkItem = {
      title: '',
      url: '',
      icon: 'Globe',
      order: externalLinks.length + 1,
      isActive: true,
    };
    const updated = [...externalLinks, newLink];
    setExternalLinks(updated);
    setFormData((prev) => ({ ...prev, external_links: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const updateExternalLink = (idx: number, field: keyof ExternalLinkItem, value: string | boolean | number) => {
    const updated = externalLinks.map((link, i) => (i === idx ? { ...link, [field]: value } : link));
    setExternalLinks(updated);
    setFormData((prev) => ({ ...prev, external_links: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const removeExternalLink = (idx: number) => {
    const updated = externalLinks.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order: i + 1 }));
    setExternalLinks(updated);
    setFormData((prev) => ({ ...prev, external_links: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const addFooterCategory = () => {
    const updated = [...footerCategories, { label: '', href: '' }];
    setFooterCategories(updated);
    setFormData((prev) => ({ ...prev, footer_categories: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const updateFooterCategory = (idx: number, field: keyof FooterCategoryItem, value: string) => {
    const updated = footerCategories.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    setFooterCategories(updated);
    setFormData((prev) => ({ ...prev, footer_categories: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const removeFooterCategory = (idx: number) => {
    const updated = footerCategories.filter((_, i) => i !== idx);
    setFooterCategories(updated);
    setFormData((prev) => ({ ...prev, footer_categories: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const handleFooterCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    const updated = arrayMove(footerCategories, oldIndex, newIndex);
    setFooterCategories(updated);
    setFormData((prev) => ({ ...prev, footer_categories: JSON.stringify(updated) }));
    setHasChanges(true);
  };

  const footerDndSensors = useSensors(useSensor(PointerSensor));

  const handleSave = async () => {
    try {
      setSaving(true);

      // Ensure external_links is synced before saving
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
      }));

      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Đã lưu cài đặt thành công!');
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(data.message || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form to original values
    const resetData: Record<string, string> = {};
    settings.forEach((setting) => {
      resetData[setting.key] = setting.value || '';
    });
    setFormData(resetData);
    setHasChanges(false);
    toast.info('Đã khôi phục giá trị ban đầu');
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  // Render input based on type
  const renderInput = (setting: SiteSetting) => {
    const value = formData[setting.key] || '';

    switch (setting.type) {
      case 'textarea':
        return (
          <Textarea
            id={setting.key}
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
            rows={4}
            className="font-mono text-sm"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <Input
              id={setting.key}
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono"
            />
          </div>
        );

      case 'image':
      case 'url':
      case 'email':
        return (
          <Input
            id={setting.key}
            type={setting.type === 'email' ? 'email' : 'url'}
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
          />
        );

      default:
        return (
          <Input
            id={setting.key}
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
          />
        );
    }
  };

  // Render settings form for a category
  const renderCategorySettings = (category: string) => {
    // Field JSON (footer_categories) có editor cấu trúc riêng — bỏ khỏi form generic.
    const categorySettings = (groupedSettings[category] || []).filter(
      (s) => s.type !== 'json'
    );

    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có cài đặt nào trong danh mục này</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {categorySettings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <Label htmlFor={setting.key} className="text-base font-semibold">
              {setting.label}
              {setting.labelEn && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({setting.labelEn})
                </span>
              )}
            </Label>
            {setting.helpText && (
              <p className="text-sm text-muted-foreground">{setting.helpText}</p>
            )}
            {renderInput(setting)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Cài đặt Website
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý các thiết lập chung cho toàn bộ website
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Có thay đổi chưa lưu
              </Badge>
            )}
            {!hasChanges && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Đã lưu
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges}
            variant="outline"
          >
            Khôi phục
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Chung</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Liên hệ</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mạng xã hội</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Giao diện</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Footer</span>
          </TabsTrigger>
          <TabsTrigger value="external_links" className="gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Liên kết ngoài</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Cài đặt chung
              </CardTitle>
              <CardDescription>
                Thông tin cơ bản về tạp chí và website
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('general')}</CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                Thông tin liên hệ
              </CardTitle>
              <CardDescription>
                Email, số điện thoại, địa chỉ và thông tin liên hệ khác
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('contact')}</CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Mạng xã hội
              </CardTitle>
              <CardDescription>
                Liên kết tới các trang mạng xã hội của tạp chí
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('social')}</CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                Cài đặt SEO
              </CardTitle>
              <CardDescription>
                Tối ưu hóa công cụ tìm kiếm và meta tags
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('seo')}</CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                Giao diện
              </CardTitle>
              <CardDescription>
                Màu sắc, font chữ và kiểu hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('appearance')}</CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Footer
              </CardTitle>
              <CardDescription>
                Nội dung và thông tin hiển thị ở footer
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('footer')}</CardContent>
          </Card>

          {/* Cột chuyên mục (footer) — editor cấu trúc cho footer_categories */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                    Cột chuyên mục (Footer)
                  </CardTitle>
                  <CardDescription>
                    Danh sách liên kết ở cột &quot;Chuyên Mục&quot; trong footer
                  </CardDescription>
                </div>
                <Button onClick={addFooterCategory} size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm mục
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {footerCategories.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="mb-3">Chưa có mục nào</p>
                  <Button onClick={addFooterCategory} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Thêm mục đầu tiên
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={footerDndSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFooterCategoryDragEnd}
                >
                  <SortableContext
                    items={footerCategories.map((_, idx) => String(idx))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {footerCategories.map((cat, idx) => (
                        <SortableFooterCategory
                          key={idx}
                          id={String(idx)}
                          cat={cat}
                          onChange={(field, value) => updateFooterCategory(idx, field, value)}
                          onRemove={() => removeFooterCategory(idx)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Kéo biểu tượng <GripVertical className="inline w-3 h-3" /> để sắp xếp thứ tự
                    hiển thị. Nhớ bấm <b>Lưu</b> để áp dụng.
                  </p>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* External Links Settings */}
        <TabsContent value="external_links">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                    Liên kết trang
                  </CardTitle>
                  <CardDescription>
                    Danh sách liên kết trang đối tác hiển thị trên website và dashboard
                  </CardDescription>
                </div>
                <Button onClick={addExternalLink} size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm liên kết
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {externalLinks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="mb-3">Chưa có liên kết nào</p>
                  <Button onClick={addExternalLink} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Thêm liên kết đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {externalLinks.map((link, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                      <GripVertical className="w-4 h-4 mt-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Tên hiển thị</Label>
                          <Input
                            value={link.title}
                            onChange={(e) => updateExternalLink(idx, 'title', e.target.value)}
                            placeholder="VD: Học viện Quốc phòng"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">URL</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => updateExternalLink(idx, 'url', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Icon</Label>
                          <select
                            value={link.icon}
                            onChange={(e) => updateExternalLink(idx, 'icon', e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            {ICON_OPTIONS.map((icon) => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={link.isActive}
                              onChange={(e) => updateExternalLink(idx, 'isActive', e.target.checked)}
                              className="rounded"
                            />
                            Hiển thị
                          </label>
                          {link.url && (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Kiểm tra
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExternalLink(idx)}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    {externalLinks.filter((l) => l.isActive).length} / {externalLinks.length} liên kết đang hiển thị
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Reminder */}
      {hasChanges && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-900 font-medium">
                Bạn có thay đổi chưa được lưu. Nhớ nhấn &quot;Lưu thay đổi&quot; để áp dụng.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu ngay
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
