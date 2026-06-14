'use client'

/**
 * ✅ Bảo mật 2 lớp — Dialog thiết lập / quản lý 2FA từ trang cài đặt.
 * Hỗ trợ 2 phương thức: Email OTP và Ứng dụng xác thực (TOTP / Google Authenticator).
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Mail, Smartphone, Copy, Check, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'status' | 'verifyEmail' | 'setupTotp' | 'backup'
type Method = 'EMAIL_OTP' | 'TOTP'

interface TwoFactorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const methodLabel = (method: string | null) => {
  if (method === 'EMAIL_OTP') return 'Email OTP'
  if (method === 'TOTP') return 'Ứng dụng xác thực'
  return method ?? '—'
}

export function TwoFactorDialog({ open, onOpenChange, onSuccess }: TwoFactorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [enabledMethod, setEnabledMethod] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('status')
  const [selectedMethod, setSelectedMethod] = useState<Method>('EMAIL_OTP')
  const [code, setCode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  useEffect(() => {
    if (open) {
      fetchStatus()
    }
  }, [open])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa')
      const data = await res.json()
      setEnabled(data.enabled)
      setEnabledMethod(data.method)
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  // ── Bắt đầu thiết lập theo phương thức đã chọn ──────────────────────────────
  const handleStart = async () => {
    if (selectedMethod === 'EMAIL_OTP') {
      await startEmailSetup()
    } else {
      await startTotpSetup()
    }
  }

  const startEmailSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/send-otp', { method: 'POST' })
      if (!res.ok) throw new Error('Không thể gửi mã OTP')
      toast.success('Mã OTP đã được gửi đến email của bạn')
      setStep('verifyEmail')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const startTotpSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/totp/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể tạo mã thiết lập')
      setQrDataUrl(data.data?.qrDataUrl || '')
      setTotpSecret(data.data?.secret || '')
      setStep('setupTotp')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Xác nhận để kích hoạt ───────────────────────────────────────────────────
  const handleConfirmEmail = async () => {
    if (code.length !== 6) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số')
      return
    }
    setLoading(true)
    try {
      const verifyRes = await fetch('/api/auth/2fa/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.valid) {
        toast.error(verifyData.error || 'Mã OTP không hợp lệ')
        return
      }

      const enableRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', method: 'EMAIL_OTP' }),
      })
      const enableData = await enableRes.json()
      if (!enableRes.ok) throw new Error(enableData.error)

      finishEnable(enableData.backupCodes || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmTotp = async () => {
    if (code.length !== 6) {
      toast.error('Vui lòng nhập mã 6 chữ số từ ứng dụng')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/totp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mã không đúng')
      finishEnable(data.data?.backupCodes || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const finishEnable = (codes: string[]) => {
    setBackupCodes(codes)
    setEnabled(true)
    setStep('backup')
    setCode('')
    toast.success('2FA đã được kích hoạt thành công')
    onSuccess?.()
  }

  const handleDisable = async () => {
    if (!confirm('Bạn có chắc muốn tắt 2FA? Tài khoản sẽ kém an toàn hơn.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      })
      if (!res.ok) throw new Error('Không thể tắt 2FA')
      setEnabled(false)
      toast.success('2FA đã được tắt')
      handleClose()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedCodes(true)
    toast.success('Đã copy mã dự phòng')
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret)
    toast.success('Đã copy khóa bí mật')
  }

  const handleClose = () => {
    setStep('status')
    setSelectedMethod('EMAIL_OTP')
    setCode('')
    setQrDataUrl('')
    setTotpSecret('')
    setBackupCodes([])
    setCopiedCodes(false)
    onOpenChange(false)
  }

  const MethodCard = ({ value, icon, title, desc }: { value: Method; icon: React.ReactNode; title: string; desc: string }) => (
    <div
      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
        selectedMethod === value ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300'
      }`}
      onClick={() => setSelectedMethod(value)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">{icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        {selectedMethod === value && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Xác thực hai lớp (2FA)
          </DialogTitle>
          <DialogDescription>Tăng cường bảo mật tài khoản với xác thực 2 lớp khi đăng nhập</DialogDescription>
        </DialogHeader>

        {/* STATUS */}
        {step === 'status' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Trạng thái 2FA</p>
                <p className="text-sm text-muted-foreground">{enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}</p>
              </div>
              <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Bật' : 'Tắt'}</Badge>
            </div>

            {enabled && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Phương thức:</strong> {methodLabel(enabledMethod)}
                </p>
              </div>
            )}

            {!enabled && (
              <div className="space-y-2">
                <Label>Chọn phương thức xác thực</Label>
                <MethodCard
                  value="EMAIL_OTP"
                  icon={<Mail className="h-5 w-5" />}
                  title="Email OTP"
                  desc="Nhận mã 6 số qua email mỗi khi đăng nhập."
                />
                <MethodCard
                  value="TOTP"
                  icon={<Smartphone className="h-5 w-5" />}
                  title="Ứng dụng xác thực"
                  desc="Dùng Google Authenticator / Authy. Bảo mật cao hơn, không phụ thuộc email."
                />
              </div>
            )}
          </div>
        )}

        {/* VERIFY EMAIL OTP */}
        {step === 'verifyEmail' && (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Mã OTP 6 chữ số đã được gửi đến email của bạn. Mã có hiệu lực trong 10 phút.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
        )}

        {/* SETUP TOTP */}
        {step === 'setupTotp' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Quét mã QR bằng ứng dụng xác thực, sau đó nhập mã 6 số hiển thị trong ứng dụng để xác nhận.
              </AlertDescription>
            </Alert>

            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Mã QR thiết lập 2FA" className="w-44 h-44 border rounded-lg" />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Không quét được? Nhập khóa thủ công:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">{totpSecret}</code>
                <Button variant="ghost" size="sm" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totp">Mã từ ứng dụng</Label>
              <Input
                id="totp"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
        )}

        {/* BACKUP CODES */}
        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Quan trọng:</strong> Lưu các mã dự phòng này ở nơi an toàn. Mỗi mã chỉ dùng được một lần để
                đăng nhập khi bạn không có mã xác thực chính.
              </AlertDescription>
            </Alert>
            <div className="relative p-4 bg-muted rounded-lg font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c, idx) => (
                  <div key={idx} className="text-center">{c}</div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={copyBackupCodes}>
                {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'status' && !enabled && (
            <Button onClick={handleStart} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tiếp tục
            </Button>
          )}

          {step === 'status' && enabled && (
            <Button onClick={handleDisable} variant="destructive" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tắt 2FA
            </Button>
          )}

          {step === 'verifyEmail' && (
            <>
              <Button variant="outline" onClick={() => { setStep('status'); setCode('') }}>
                Hủy
              </Button>
              <Button onClick={handleConfirmEmail} disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </>
          )}

          {step === 'setupTotp' && (
            <>
              <Button variant="outline" onClick={() => { setStep('status'); setCode('') }}>
                Hủy
              </Button>
              <Button onClick={handleConfirmTotp} disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </>
          )}

          {step === 'backup' && <Button onClick={handleClose}>Hoàn tất</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
