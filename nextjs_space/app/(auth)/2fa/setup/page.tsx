'use client';

/**
 * ✅ Bảo mật 2 lớp — trang thiết lập 2FA (toàn màn hình).
 * Dùng JWT cookie tự quản (KHÔNG phụ thuộc NextAuth). Tái sử dụng TwoFactorDialog
 * để hỗ trợ cả Email OTP và Ứng dụng xác thực (TOTP) — tránh lặp logic.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2 } from 'lucide-react';
import { TwoFactorDialog } from '@/components/dashboard/two-factor-dialog';

const methodLabel = (method: string | null) => {
  if (method === 'EMAIL_OTP') return 'Email OTP';
  if (method === 'TOTP') return 'Ứng dụng xác thực';
  return '—';
};

export default function Setup2FAPage() {
  const [status, setStatus] = useState<{ enabled: boolean; method: string | null } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa');
      const data = await res.json();
      setStatus({ enabled: !!data.enabled, method: data.method ?? null });
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setStatus({ enabled: false, method: null });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-emerald-600" />
          Xác thực hai lớp (2FA)
        </h1>
        <p className="text-muted-foreground mt-2">
          Tăng cường bảo mật cho tài khoản: yêu cầu mã xác thực bổ sung mỗi khi đăng nhập.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trạng thái 2FA</CardTitle>
              <CardDescription>
                {status.enabled
                  ? `Tài khoản đã được bảo vệ với 2FA (${methodLabel(status.method)})`
                  : 'Xác thực hai lớp chưa được kích hoạt'}
              </CardDescription>
            </div>
            <Badge variant={status.enabled ? 'default' : 'secondary'} className={status.enabled ? 'bg-emerald-600' : ''}>
              {status.enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setDialogOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            {status.enabled ? 'Quản lý 2FA' : 'Thiết lập 2FA'}
          </Button>
        </CardContent>
      </Card>

      <TwoFactorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchStatus}
      />
    </div>
  );
}
