'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  CheckCircle2,
  ExternalLink,
  Link2Off,
  RefreshCw,
  Loader2,
  BookOpen,
  Building2,
  User,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface OrcidProfileData {
  orcidId: string
  fullName: string | null
  biography: string | null
  affiliations: string[]
  works: unknown
  lastSyncAt: string | null
  createdAt: string
}

// Số lượng công trình đã đồng bộ (works là mảng trong ORCID response)
function countWorks(works: unknown): number {
  if (Array.isArray(works)) return works.length
  return 0
}

export function OrcidPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<OrcidProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users/orcid-profile')
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setProfile(json.data)
    } catch {
      // silent — profile just won't show
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle flash messages from OAuth redirect query params
  useEffect(() => {
    const orcid = searchParams.get('orcid')
    const error = searchParams.get('error')

    if (orcid === 'connected') {
      setFlashMessage({ type: 'success', text: 'Kết nối ORCID thành công!' })
      fetchProfile()
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('orcid')
      url.searchParams.delete('tab')
      window.history.replaceState({}, '', url.toString())
    } else if (error === 'orcid_invalid_state') {
      setFlashMessage({ type: 'error', text: 'Xác thực thất bại do lỗi bảo mật. Vui lòng thử lại.' })
    } else if (error === 'orcid_failed') {
      setFlashMessage({ type: 'error', text: 'Không thể kết nối với ORCID. Vui lòng thử lại.' })
    } else if (error === 'orcid_not_configured') {
      setFlashMessage({ type: 'error', text: 'Tính năng ORCID chưa được cấu hình trên hệ thống.' })
    }
  }, [searchParams, fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleConnect = () => {
    setConnecting(true)
    // Server-side redirect — initiation route sets CSRF cookie then redirects to ORCID
    window.location.href = '/api/auth/orcid'
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/users/orcid-profile', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Disconnect failed')
      }
      setProfile(null)
      setShowDisconnectDialog(false)
      toast.success('Đã ngắt kết nối ORCID')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể ngắt kết nối')
    } finally {
      setDisconnecting(false)
    }
  }

  // ---- Render states ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Flash message from redirect */}
      {flashMessage && (
        <Alert variant={flashMessage.type === 'error' ? 'destructive' : 'default'}
          className={flashMessage.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
          {flashMessage.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
            : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{flashMessage.text}</AlertDescription>
        </Alert>
      )}

      {profile ? (
        /* ---- Connected state ---- */
        <div className="space-y-5">
          {/* Status header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A6CE39]/20">
                <OrcidLogo className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-800 dark:text-green-300">Đã kết nối ORCID</span>
                  <Badge className="bg-green-500 text-white text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <a
                  href={`https://orcid.org/${profile.orcidId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 dark:text-green-400 hover:underline flex items-center gap-1"
                >
                  orcid.org/{profile.orcidId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 shrink-0"
              onClick={() => setShowDisconnectDialog(true)}
            >
              <Link2Off className="h-4 w-4 mr-2" />
              Ngắt kết nối
            </Button>
          </div>

          {/* Profile data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Công trình đã đồng bộ</p>
                <p className="text-2xl font-bold">{countWorks(profile.works)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Building2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đơn vị công tác</p>
                <p className="text-sm font-semibold">
                  {profile.affiliations.length > 0
                    ? profile.affiliations[0]
                    : <span className="text-muted-foreground italic">Chưa có</span>}
                </p>
                {profile.affiliations.length > 1 && (
                  <p className="text-xs text-muted-foreground">+{profile.affiliations.length - 1} đơn vị khác</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <RefreshCw className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đồng bộ lần cuối</p>
                <p className="text-sm font-semibold">
                  {profile.lastSyncAt
                    ? new Date(profile.lastSyncAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })
                    : <span className="text-muted-foreground italic">Chưa đồng bộ</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Biography */}
          {profile.biography && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Tiểu sử (từ ORCID)
              </div>
              <p className="text-sm leading-relaxed border rounded-lg p-4 bg-muted/30">
                {profile.biography}
              </p>
            </div>
          )}

          {/* All affiliations */}
          {profile.affiliations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Tất cả đơn vị công tác
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.affiliations.map((aff, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {aff}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
              Dữ liệu được lấy từ ORCID khi bạn kết nối. Để cập nhật, ngắt kết nối rồi kết nối lại.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        /* ---- Not connected state ---- */
        <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <OrcidLogo className="h-12 w-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-semibold">Kết nối hồ sơ ORCID</h3>
            <p className="text-sm text-muted-foreground">
              ORCID là hệ thống định danh nhà nghiên cứu quốc tế. Kết nối để tự động nhập
              tiểu sử, đơn vị công tác và danh mục công trình khoa học của bạn.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md text-left">
            {[
              { icon: User, text: 'Tiểu sử & thông tin cá nhân' },
              { icon: Building2, text: 'Đơn vị và lịch sử công tác' },
              { icon: BookOpen, text: 'Danh mục công trình khoa học' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {text}
              </div>
            ))}
          </div>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="lg"
            className="bg-[#A6CE39] hover:bg-[#8fb52e] text-white font-semibold px-8"
          >
            {connecting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <OrcidLogo className="h-5 w-5 mr-2" />
            )}
            {connecting ? 'Đang chuyển hướng...' : 'Kết nối với ORCID'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Bạn sẽ được chuyển đến trang đăng nhập ORCID để cấp quyền.
          </p>
        </div>
      )}

      {/* Disconnect confirm dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Ngắt kết nối ORCID?
            </DialogTitle>
            <DialogDescription>
              Dữ liệu tiểu sử, đơn vị và công trình đã đồng bộ từ ORCID sẽ bị xóa khỏi hệ thống.
              Bạn có thể kết nối lại bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={disconnecting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận ngắt kết nối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrcidLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fill="#A6CE39" d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z" />
      <path
        fill="#FFF"
        d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 111.2 178 93 148 93h-23.7v79.4zM88.7 56.8c0 5.5-4.5 10.1-10.1 10.1s-10.1-4.6-10.1-10.1c0-5.6 4.5-10.1 10.1-10.1s10.1 4.6 10.1 10.1z"
      />
    </svg>
  )
}
