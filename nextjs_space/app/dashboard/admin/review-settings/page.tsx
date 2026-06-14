'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Settings,
  Save,
  ShieldCheck,
  Users,
  Clock,
  Zap,
  MessageCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Lock,
} from 'lucide-react'

type BlindReviewMode = 'NONE' | 'SINGLE_BLIND' | 'DOUBLE_BLIND'

interface ReviewSettings {
  blindReviewMode: BlindReviewMode
  hideAuthorFromReviewer: boolean
  hideReviewerFromAuthor: boolean
  allowReviewerCommunication: boolean
  autoAssignReviewers: boolean
  minimumReviewers: number
  reviewDeadlineDays: number
}

const BLIND_MODE_META: Record<BlindReviewMode, {
  label: string
  description: string
  icon: React.ReactNode
  color: string
  badgeVariant: 'default' | 'secondary' | 'outline'
}> = {
  NONE: {
    label: 'Mở hoàn toàn',
    description: 'Cả tác giả và phản biện viên đều biết danh tính nhau. Phù hợp với tạp chí ưu tiên tính minh bạch.',
    icon: <Eye className="h-5 w-5" />,
    color: 'text-emerald-600',
    badgeVariant: 'outline',
  },
  SINGLE_BLIND: {
    label: 'Ẩn danh đơn',
    description: 'Phản biện viên biết tên tác giả, nhưng tác giả không biết ai phản biện mình.',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'text-amber-600',
    badgeVariant: 'secondary',
  },
  DOUBLE_BLIND: {
    label: 'Ẩn danh kép',
    description: 'Cả tác giả và phản biện viên đều không biết danh tính nhau. Tiêu chuẩn học thuật quốc tế.',
    icon: <Lock className="h-5 w-5" />,
    color: 'text-violet-600',
    badgeVariant: 'default',
  },
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary mt-0.5">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-sm">{description}</CardDescription>
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  tooltip,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  tooltip?: string
}) {
  const inner = (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors ${
        disabled ? 'bg-muted/40 opacity-60' : 'bg-background hover:bg-muted/30'
      }`}
    >
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={id} className={`font-medium cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  )

  if (tooltip && disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{inner}</div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return inner
}

export default function ReviewSettingsPage() {
  const [settings, setSettings] = useState<ReviewSettings>({
    blindReviewMode: 'DOUBLE_BLIND',
    hideAuthorFromReviewer: true,
    hideReviewerFromAuthor: true,
    allowReviewerCommunication: false,
    autoAssignReviewers: false,
    minimumReviewers: 2,
    reviewDeadlineDays: 14,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<ReviewSettings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/ui-config?category=review')
      const data = await response.json()

      if (data.success && data.configs && data.configs.length > 0) {
        const configMap = data.configs.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
          acc[item.key] = item.value
          return acc
        }, {})

        const loaded: ReviewSettings = {
          blindReviewMode: (configMap.blindReviewMode || 'DOUBLE_BLIND') as BlindReviewMode,
          hideAuthorFromReviewer: configMap.hideAuthorFromReviewer === 'true',
          hideReviewerFromAuthor: configMap.hideReviewerFromAuthor === 'true',
          allowReviewerCommunication: configMap.allowReviewerCommunication === 'true',
          autoAssignReviewers: configMap.autoAssignReviewers === 'true',
          minimumReviewers: parseInt(configMap.minimumReviewers) || 2,
          reviewDeadlineDays: parseInt(configMap.reviewDeadlineDays) || 14,
        }

        setSettings(loaded)
        setOriginalSettings(loaded)
      } else {
        setOriginalSettings(settings)
      }
    } catch {
      toast.error('Không thể tải cài đặt phản biện')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (patch: Partial<ReviewSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      setHasChanges(JSON.stringify(next) !== JSON.stringify(originalSettings))
      return next
    })
  }

  const handleModeChange = (mode: BlindReviewMode) => {
    const patch: Partial<ReviewSettings> = { blindReviewMode: mode }
    if (mode === 'NONE') {
      patch.hideAuthorFromReviewer = false
      patch.hideReviewerFromAuthor = false
    } else if (mode === 'SINGLE_BLIND') {
      patch.hideAuthorFromReviewer = false
      patch.hideReviewerFromAuthor = true
    } else {
      patch.hideAuthorFromReviewer = true
      patch.hideReviewerFromAuthor = true
    }
    updateSettings(patch)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const SETTING_DESCRIPTIONS: Record<string, string> = {
        blindReviewMode: 'Chế độ phản biện ẩn danh',
        hideAuthorFromReviewer: 'Ẩn thông tin tác giả khỏi phản biện viên',
        hideReviewerFromAuthor: 'Ẩn thông tin phản biện viên khỏi tác giả',
        allowReviewerCommunication: 'Cho phép phản biện viên trao đổi với nhau',
        autoAssignReviewers: 'Tự động gán phản biện viên',
        minimumReviewers: 'Số lượng phản biện viên tối thiểu',
        reviewDeadlineDays: 'Thời hạn phản biện (ngày)',
      }

      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/ui-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value: String(value),
            category: 'review',
            description: SETTING_DESCRIPTIONS[key] || key,
          }),
        })
      )

      await Promise.all(promises)
      setOriginalSettings(settings)
      setHasChanges(false)
      toast.success('Đã lưu cài đặt phản biện thành công')
    } catch {
      toast.error('Lỗi khi lưu cài đặt. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setHasChanges(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  const activeMeta = BLIND_MODE_META[settings.blindReviewMode]

  return (
    <TooltipProvider>
      <div className="space-y-8 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <span>Quản trị</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Cài đặt Phản biện</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Cài đặt Quy trình Phản biện
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Cấu hình chế độ ẩn danh, quy tắc gán phản biện viên và thời hạn xử lý bài
            </p>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Có thay đổi chưa lưu</span>
            </div>
          )}
        </div>

        {/* Current mode summary banner */}
        <div
          className={`rounded-xl border-2 p-5 flex items-center gap-4 transition-colors ${
            settings.blindReviewMode === 'DOUBLE_BLIND'
              ? 'border-violet-200 bg-violet-50/60'
              : settings.blindReviewMode === 'SINGLE_BLIND'
              ? 'border-amber-200 bg-amber-50/60'
              : 'border-emerald-200 bg-emerald-50/60'
          }`}
        >
          <div
            className={`rounded-full p-3 ${
              settings.blindReviewMode === 'DOUBLE_BLIND'
                ? 'bg-violet-100 text-violet-600'
                : settings.blindReviewMode === 'SINGLE_BLIND'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {activeMeta.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Chế độ hiện tại:</span>
              <Badge variant={activeMeta.badgeVariant} className="text-xs">
                {activeMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{activeMeta.description}</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 ${settings.hideAuthorFromReviewer ? 'text-violet-600' : 'text-muted-foreground'}`}>
                  <EyeOff className="h-4 w-4" />
                  <span>Tác giả ẩn</span>
                  {settings.hideAuthorFromReviewer ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : null}
                </div>
              </TooltipTrigger>
              <TooltipContent>Ẩn tên tác giả khỏi phản biện viên</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 ${settings.hideReviewerFromAuthor ? 'text-violet-600' : 'text-muted-foreground'}`}>
                  <EyeOff className="h-4 w-4" />
                  <span>PBV ẩn</span>
                  {settings.hideReviewerFromAuthor ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : null}
                </div>
              </TooltipTrigger>
              <TooltipContent>Ẩn tên phản biện viên khỏi tác giả</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Section 1: Blind Review Mode */}
        <Card className="shadow-sm">
          <CardHeader>
            <SectionHeader
              icon={<EyeOff className="h-4 w-4" />}
              title="Chế độ Phản biện Ẩn danh"
              description="Xác định mức độ bảo mật danh tính giữa tác giả và phản biện viên"
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode selector cards */}
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.keys(BLIND_MODE_META) as BlindReviewMode[]).map((mode) => {
                const meta = BLIND_MODE_META[mode]
                const isActive = settings.blindReviewMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className={`mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {meta.icon}
                    </div>
                    <div className="font-medium text-sm">{meta.label}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {meta.description}
                    </p>
                    {isActive && (
                      <div className="mt-2">
                        <Badge variant="default" className="text-xs">Đang dùng</Badge>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <Separator />

            {/* Fine-grained controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
                <Info className="h-3.5 w-3.5" />
                <span>Điều chỉnh chi tiết (tự động theo chế độ chọn)</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <ToggleRow
                  id="hideAuthor"
                  label="Ẩn tên tác giả"
                  description="Phản biện viên không thấy danh tính tác giả"
                  checked={settings.hideAuthorFromReviewer}
                  onCheckedChange={(v) => updateSettings({ hideAuthorFromReviewer: v })}
                  disabled={settings.blindReviewMode !== 'NONE'}
                  tooltip="Giá trị này được tự động quản lý bởi chế độ phản biện đã chọn"
                />
                <ToggleRow
                  id="hideReviewer"
                  label="Ẩn tên phản biện viên"
                  description="Tác giả không biết ai đang phản biện bài của mình"
                  checked={settings.hideReviewerFromAuthor}
                  onCheckedChange={(v) => updateSettings({ hideReviewerFromAuthor: v })}
                  disabled={settings.blindReviewMode !== 'NONE'}
                  tooltip="Giá trị này được tự động quản lý bởi chế độ phản biện đã chọn"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Process Rules */}
        <Card className="shadow-sm">
          <CardHeader>
            <SectionHeader
              icon={<Users className="h-4 w-4" />}
              title="Quy tắc Gán Phản biện Viên"
              description="Cấu hình số lượng và cách gán phản biện viên cho mỗi bài nộp"
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Min reviewers */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Số phản biện viên tối thiểu
                </Label>
                <Select
                  value={settings.minimumReviewers.toString()}
                  onValueChange={(v) => updateSettings({ minimumReviewers: parseInt(v) })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} phản biện viên{n >= 2 ? '' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Bài nộp cần đủ số này mới có thể ra quyết định
                </p>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Thời hạn phản biện</Label>
                </div>
                <Select
                  value={settings.reviewDeadlineDays.toString()}
                  onValueChange={(v) => updateSettings({ reviewDeadlineDays: parseInt(v) })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 ngày</SelectItem>
                    <SelectItem value="14">14 ngày (mặc định)</SelectItem>
                    <SelectItem value="21">21 ngày</SelectItem>
                    <SelectItem value="30">30 ngày</SelectItem>
                    <SelectItem value="45">45 ngày</SelectItem>
                    <SelectItem value="60">60 ngày</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tính từ ngày mời phản biện viên
                </p>
              </div>
            </div>

            <Separator />

            {/* Auto-assign */}
            <ToggleRow
              id="autoAssign"
              label="Tự động gán phản biện viên"
              description="Hệ thống AI gợi ý và tự động phân công phản biện viên phù hợp theo lĩnh vực chuyên môn"
              checked={settings.autoAssignReviewers}
              onCheckedChange={(v) => updateSettings({ autoAssignReviewers: v })}
            />

            {settings.autoAssignReviewers && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 flex items-start gap-3">
                <Zap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">Tính năng AI Auto-assign đang bật</p>
                  <p className="text-blue-600 mt-0.5">
                    Khi có bài nộp mới qua sơ duyệt, hệ thống sẽ tự động đề xuất và mời{' '}
                    <strong>{settings.minimumReviewers}</strong> phản biện viên phù hợp nhất theo từ khóa và lĩnh vực.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Communication */}
        <Card className="shadow-sm">
          <CardHeader>
            <SectionHeader
              icon={<MessageCircle className="h-4 w-4" />}
              title="Trao đổi trong Quá trình Phản biện"
              description="Kiểm soát khả năng giao tiếp giữa các bên liên quan"
            />
          </CardHeader>
          <CardContent>
            <ToggleRow
              id="communication"
              label="Cho phép phản biện viên trao đổi nội bộ"
              description="Các phản biện viên cùng bài có thể thảo luận với nhau qua kênh nội bộ (không hiển thị với tác giả)"
              checked={settings.allowReviewerCommunication}
              onCheckedChange={(v) => updateSettings({ allowReviewerCommunication: v })}
            />
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="sticky bottom-6 z-10">
          <div className="flex justify-end gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-6 py-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Hoàn tác
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="gap-2 min-w-[140px]"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu cài đặt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
