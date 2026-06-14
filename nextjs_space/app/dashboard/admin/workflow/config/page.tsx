"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw, Loader2, Info } from 'lucide-react';

interface StepConfig {
  stepType: string;
  label: string;
  deadlineDays: number;
  reminderDays: number;
  maxReminders: number;
  isActive: boolean;
}

interface EditState {
  deadlineDays: string;
  reminderDays: string;
  maxReminders: string;
  isActive: boolean;
  dirty: boolean;
  saving: boolean;
}

const STEP_ORDER = [
  'INITIAL_REVIEW',
  'REVISION_SUBMIT',
  'RE_REVIEW',
  'EDITOR_DECISION',
  'PRODUCTION',
  'PUBLICATION',
];

function buildEditState(config: StepConfig): EditState {
  return {
    deadlineDays: String(config.deadlineDays),
    reminderDays: String(config.reminderDays),
    maxReminders: String(config.maxReminders),
    isActive: config.isActive,
    dirty: false,
    saving: false,
  };
}

export default function WorkflowConfigPage() {
  const session = useDashboardSession();
  const router = useRouter();

  const [configs, setConfigs] = useState<StepConfig[]>([]);
  const [editMap, setEditMap] = useState<Record<string, EditState>>({});
  const [loading, setLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflow/config');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const sorted: StepConfig[] = STEP_ORDER.map(
        (s) => json.data.find((c: StepConfig) => c.stepType === s)!
      ).filter(Boolean);

      setConfigs(sorted);
      const map: Record<string, EditState> = {};
      sorted.forEach((c) => { map[c.stepType] = buildEditState(c); });
      setEditMap(map);
    } catch {
      toast.error('Không thể tải cấu hình workflow');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!['SYSADMIN', 'EIC'].includes(session.role)) {
      router.push('/dashboard');
      return;
    }
    loadConfigs();
  }, [session, router, loadConfigs]);

  function updateField(
    stepType: string,
    field: keyof Omit<EditState, 'dirty' | 'saving'>,
    value: string | boolean
  ) {
    setEditMap((prev) => ({
      ...prev,
      [stepType]: { ...prev[stepType], [field]: value, dirty: true },
    }));
  }

  function resetStep(stepType: string) {
    const original = configs.find((c) => c.stepType === stepType);
    if (!original) return;
    setEditMap((prev) => ({
      ...prev,
      [stepType]: buildEditState(original),
    }));
  }

  async function saveStep(stepType: string) {
    const edit = editMap[stepType];
    if (!edit) return;

    const deadlineDays = parseInt(edit.deadlineDays, 10);
    const reminderDays = parseInt(edit.reminderDays, 10);
    const maxReminders = parseInt(edit.maxReminders, 10);

    if (isNaN(deadlineDays) || deadlineDays < 1 || deadlineDays > 365) {
      toast.error('Số ngày deadline phải từ 1 đến 365');
      return;
    }
    if (isNaN(reminderDays) || reminderDays < 1 || reminderDays > 30) {
      toast.error('Số ngày nhắc nhở phải từ 1 đến 30');
      return;
    }
    if (isNaN(maxReminders) || maxReminders < 0 || maxReminders > 10) {
      toast.error('Số lần nhắc tối đa phải từ 0 đến 10');
      return;
    }

    setEditMap((prev) => ({
      ...prev,
      [stepType]: { ...prev[stepType], saving: true },
    }));

    try {
      const res = await fetch('/api/admin/workflow/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepType,
          deadlineDays,
          reminderDays,
          maxReminders,
          isActive: edit.isActive,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setConfigs((prev) =>
        prev.map((c) =>
          c.stepType === stepType
            ? { ...c, deadlineDays, reminderDays, maxReminders, isActive: edit.isActive }
            : c
        )
      );
      setEditMap((prev) => ({
        ...prev,
        [stepType]: { ...prev[stepType], dirty: false, saving: false },
      }));
      toast.success(`Đã lưu cấu hình "${configs.find((c) => c.stepType === stepType)?.label}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(msg);
      setEditMap((prev) => ({
        ...prev,
        [stepType]: { ...prev[stepType], saving: false },
      }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const anyDirty = Object.values(editMap).some((e) => e.dirty);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Cấu hình quy trình &amp; deadline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chỉnh số ngày deadline, số ngày nhắc nhở và số lần nhắc cho từng bước.
            Thay đổi có hiệu lực với các submission mới sau khi lưu.
          </p>
        </div>
        {anyDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400">
            Có thay đổi chưa lưu
          </Badge>
        )}
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Các submission đang xử lý <strong>không bị ảnh hưởng</strong> bởi thay đổi này.
              Cấu hình mới chỉ áp dụng cho deadline được tạo <strong>sau khi lưu</strong>.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Config table */}
      <Card>
        <CardHeader>
          <CardTitle>Các bước quy trình</CardTitle>
          <CardDescription>
            6 bước từ phản biện đến xuất bản. Mỗi bước có thể cấu hình độc lập.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Bước</TableHead>
                <TableHead className="w-[140px] text-center">
                  Số ngày deadline
                </TableHead>
                <TableHead className="w-[140px] text-center">
                  Nhắc trước (ngày)
                </TableHead>
                <TableHead className="w-[120px] text-center">
                  Số lần nhắc
                </TableHead>
                <TableHead className="w-[90px] text-center">Bật</TableHead>
                <TableHead className="w-[120px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => {
                const edit = editMap[config.stepType];
                if (!edit) return null;

                return (
                  <TableRow key={config.stepType} className={edit.dirty ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                    {/* Label */}
                    <TableCell>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {config.stepType}
                      </div>
                    </TableCell>

                    {/* Deadline days */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={edit.deadlineDays}
                          onChange={(e) => updateField(config.stepType, 'deadlineDays', e.target.value)}
                          className="w-20 text-center h-8"
                          disabled={!edit.isActive}
                        />
                        <span className="text-xs text-muted-foreground">ngày</span>
                      </div>
                    </TableCell>

                    {/* Reminder days */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={edit.reminderDays}
                          onChange={(e) => updateField(config.stepType, 'reminderDays', e.target.value)}
                          className="w-16 text-center h-8"
                          disabled={!edit.isActive}
                        />
                        <span className="text-xs text-muted-foreground">ngày</span>
                      </div>
                    </TableCell>

                    {/* Max reminders */}
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={edit.maxReminders}
                        onChange={(e) => updateField(config.stepType, 'maxReminders', e.target.value)}
                        className="w-16 mx-auto text-center h-8"
                        disabled={!edit.isActive}
                      />
                    </TableCell>

                    {/* Active toggle */}
                    <TableCell className="text-center">
                      <Switch
                        checked={edit.isActive}
                        onCheckedChange={(checked) => updateField(config.stepType, 'isActive', checked)}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {edit.dirty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => resetStep(config.stepType)}
                            disabled={edit.saving}
                            title="Hoàn tác"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => saveStep(config.stepType)}
                          disabled={!edit.dirty || edit.saving}
                        >
                          {edit.saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1.5">Lưu</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-muted/40">
        <CardContent className="pt-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Số ngày deadline</span>
            <p className="mt-0.5">Tính từ thời điểm bước bắt đầu đến hết hạn.</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Nhắc trước (ngày)</span>
            <p className="mt-0.5">Gửi email nhắc nhở khi còn N ngày trước hạn.</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Số lần nhắc</span>
            <p className="mt-0.5">Giới hạn tổng số email nhắc gửi mỗi deadline.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
