'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Mail, Smartphone, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * ✅ Bảo mật 2 lớp — bước nhập mã khi đăng nhập.
 * Trang dùng pre-auth token (cookie 2fa-pending) do bước login cấp; KHÔNG phụ thuộc NextAuth.
 */
export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const method = searchParams?.get('method') || 'EMAIL_OTP';
  const from = searchParams?.get('from');
  const isEmailMethod = method === 'EMAIL_OTP';

  const [code, setCode] = useState('');
  const [backupMode, setBackupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // Với Email OTP: bước login đã gửi sẵn 1 mã, nên bắt đầu ở trạng thái cooldown 60s
  // (tránh gửi trùng email); người dùng chỉ gửi lại thủ công sau khi hết cooldown.
  const [countdown, setCountdown] = useState(isEmailMethod ? 60 : 0);

  const redirectTarget = from && from.startsWith('/dashboard') ? from : '/dashboard';

  const handleResend = useCallback(async () => {
    setSending(true);
    try {
      const res = await fetch('/api/auth/2fa/login-resend', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mã OTP đã được gửi đến email của bạn');
        setCountdown(60);
      } else {
        toast.error(data.error || 'Không thể gửi mã');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi gửi mã');
    } finally {
      setSending(false);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (rawCode?: string) => {
    const value = (rawCode ?? code).trim();
    if (!value) {
      toast.error('Vui lòng nhập mã xác thực');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Xác thực thành công!');
        // Dùng full reload để middleware đọc cookie mới và route theo vai trò
        window.location.href = redirectTarget;
      } else {
        toast.error(data.error || 'Mã xác thực không hợp lệ');
        setCode('');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xác thực');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      handleVerify(digits);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a3a2a] via-[#1e4d35] to-[#152e22] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Shield className="h-8 w-8 text-emerald-700" />
            </div>
          </div>
          <CardTitle className="text-2xl">Xác thực hai lớp</CardTitle>
          <CardDescription>
            {backupMode
              ? 'Nhập một mã dự phòng để đăng nhập'
              : isEmailMethod
                ? 'Nhập mã OTP 6 số đã được gửi đến email của bạn'
                : 'Mở ứng dụng xác thực và nhập mã 6 số'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!backupMode ? (
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                {isEmailMethod ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                Mã xác thực
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoFocus
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                maxLength={6}
                onChange={(e) => handleOtpChange(e.target.value)}
                className="text-center text-3xl tracking-[0.5em] font-semibold h-14"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="backup" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Mã dự phòng
              </Label>
              <Input
                id="backup"
                type="text"
                autoFocus
                placeholder="VD: A1B2C3D4"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 16))}
                className="text-center text-xl tracking-widest font-mono h-12"
                disabled={loading}
              />
            </div>
          )}

          <Button onClick={() => handleVerify()} disabled={loading || !code} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xác thực
              </>
            )}
          </Button>

          {/* Gửi lại mã — chỉ cho Email OTP và khi không ở chế độ backup */}
          {isEmailMethod && !backupMode && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Không nhận được mã?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={sending || countdown > 0}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Đang gửi...
                  </>
                ) : countdown > 0 ? (
                  `Gửi lại sau ${countdown}s`
                ) : (
                  <>
                    <Mail className="mr-2 h-3 w-3" />
                    Gửi lại mã
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Chuyển giữa nhập mã chính và mã dự phòng */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setBackupMode((prev) => !prev);
                setCode('');
              }}
              className="text-sm text-emerald-700 hover:underline"
            >
              {backupMode ? 'Quay lại nhập mã xác thực' : 'Dùng mã dự phòng'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
