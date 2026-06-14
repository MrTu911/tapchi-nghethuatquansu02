import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ShieldAlert, Activity, FileLock, Lock, AlertTriangle, ArrowRight, CheckCircle, Clock,
} from 'lucide-react'

/**
 * Dashboard KIỂM ĐỊNH BẢO MẬT (SECURITY_AUDITOR).
 *
 * Nghiệp vụ: giám sát an toàn hệ thống (cảnh báo, phiên đăng nhập, nhật ký kiểm toán)
 * và ĐỒNG KÝ các bài mật (SECRET/TOP_SECRET) theo quy tắc hai người cùng Tổng biên tập.
 */
export default async function SecurityDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    pendingAlerts,
    activeSessions,
    auditToday,
    classifiedActive,
    classifiedList,
    recentAlerts,
    recentAudit,
  ] = await Promise.all([
    prisma.securityAlert.count({ where: { status: 'PENDING' } }),
    prisma.userSession.count({ where: { expiresAt: { gt: now } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: startToday } } }),
    prisma.submission.count({
      where: { securityLevel: { in: ['SECRET', 'TOP_SECRET'] }, status: { in: ['UNDER_REVIEW', 'ACCEPTED'] } },
    }),
    prisma.submission.findMany({
      where: { securityLevel: { in: ['SECRET', 'TOP_SECRET'] }, status: { in: ['UNDER_REVIEW', 'ACCEPTED'] } },
      select: { id: true, title: true, code: true, securityLevel: true, status: true },
      orderBy: { lastStatusChangeAt: 'asc' },
      take: 6,
    }),
    prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' }, take: 6,
      select: { id: true, type: true, severity: true, status: true, description: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { action: true, object: true, createdAt: true, actor: { select: { fullName: true } } },
    }),
  ])

  const severityColor: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-slate-100 text-slate-700',
  }

  const kpis = [
    { label: 'Cảnh báo chờ xử lý', value: pendingAlerts, icon: ShieldAlert, tone: 'text-red-600', bg: 'from-red-50 to-white dark:from-red-950/30 dark:to-slate-800 border-red-100 dark:border-red-800' },
    { label: 'Phiên đang hoạt động', value: activeSessions, icon: Activity, tone: 'text-blue-600', bg: 'from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-800 border-blue-100 dark:border-blue-800' },
    { label: 'Sự kiện kiểm toán hôm nay', value: auditToday, icon: FileLock, tone: 'text-violet-600', bg: 'from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-800 border-violet-100 dark:border-violet-800' },
    { label: 'Bài mật đang xử lý', value: classifiedActive, icon: Lock, tone: 'text-amber-600', bg: 'from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800 border-amber-200 dark:border-amber-800' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-700 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-rose-700" />
          Kiểm định Bảo mật
        </h1>
        <p className="text-muted-foreground mt-1">
          Xin chào, {session.fullName} · Giám sát an toàn hệ thống và đồng ký bài mật
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone, bg }) => (
          <Card key={label} className={`bg-gradient-to-br ${bg}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${tone}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${tone}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bài mật chờ đồng ký */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Lock className="h-5 w-5" />
              Bài mật chờ đồng ký ({classifiedActive})
            </CardTitle>
            <CardDescription>
              Bài SECRET/TOP_SECRET cần Kiểm định bảo mật đồng ký (quy tắc hai người cùng Tổng biên tập)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classifiedList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có bài mật nào đang chờ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classifiedList.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{s.code}</span>
                        <Badge className="text-[10px] py-0 bg-red-100 text-red-700">{s.securityLevel}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/editor/submissions/${s.id}`}>
                        Xem & đồng ký <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cảnh báo bảo mật gần đây */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
              Cảnh báo bảo mật gần đây
            </CardTitle>
            <CardDescription>{pendingAlerts} cảnh báo đang chờ xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có cảnh báo nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map(a => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] py-0 ${severityColor[a.severity] || 'bg-slate-100 text-slate-700'}`}>{a.severity}</Badge>
                      <span className="text-xs font-medium">{a.type}</span>
                      {a.status === 'PENDING' && <Clock className="h-3 w-3 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nhật ký kiểm toán gần đây */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileLock className="h-5 w-5 text-violet-600" />
            Nhật ký kiểm toán gần đây
          </CardTitle>
          <CardDescription>Các thao tác nhạy cảm gần nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có sự kiện kiểm toán</p>
          ) : (
            <div className="divide-y">
              {recentAudit.map((log, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="text-[10px] py-0 shrink-0">{log.action}</Badge>
                    <span className="text-muted-foreground truncate">{log.object}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {log.actor?.fullName ?? 'Hệ thống'} · {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
