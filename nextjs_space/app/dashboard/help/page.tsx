import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion'
import { getRoleLabelVi } from '@/lib/role-labels'
import { getGuideForRole, type RoleGuide } from '@/lib/help/role-guides'
import {
  BookOpen, Crown, ShieldHalf, ClipboardList, ArrowRight, CheckCircle2,
  PenLine, FileText, Layers, ShieldAlert, Monitor, Settings, UserCheck,
  Target, ListOrdered, KeyRound, AlertTriangle, ExternalLink, Home,
} from 'lucide-react'

/**
 * Trung tâm Hướng dẫn sử dụng trong dashboard — Tạp chí NTQS.
 *
 * Cô lập theo vai trò: chỉ render hướng dẫn của vai trò ĐANG ĐĂNG NHẬP
 * (getGuideForRole(session.role) ở server) — mỗi tài khoản chỉ thấy guide của
 * mình, không thấy vai trò khác. Nội dung từng-bước nằm ở lib/help/role-guides.ts.
 */

const ICONS: Record<string, React.ElementType> = {
  Crown, ShieldHalf, ClipboardList, FileText, Layers,
  ShieldAlert, Monitor, Settings, UserCheck, PenLine,
}

export default async function HelpCenterPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const guide = getGuideForRole(session.role)
  const roleLabel = getRoleLabelVi(session.role)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-emerald-700" />
          Trung tâm Hướng dẫn
        </h1>
        <p className="text-muted-foreground mt-1">
          Hướng dẫn sử dụng hệ thống theo vai trò của bạn. Xin chào, {session.fullName} ({roleLabel}).
        </p>
      </div>

      {guide ? <RoleGuideView guide={guide} /> : <NoGuideFallback roleLabel={roleLabel} />}
    </div>
  )
}

function RoleGuideView({ guide }: { guide: RoleGuide }) {
  const Icon = ICONS[guide.iconKey] ?? BookOpen
  const title = getRoleLabelVi(guide.role)
  const defaultOpen = guide.sections.map(s => s.id)

  return (
    <>
      {/* Giới thiệu vai trò: ảnh + trách nhiệm + mục lục */}
      <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="h-5 w-5 text-emerald-700" />
            <CardTitle>Hướng dẫn cho bạn — {title}</CardTitle>
            <Badge className="bg-emerald-700">Vai trò của bạn</Badge>
          </div>
          <CardDescription className="mt-1">{guide.summary}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          {guide.screenshot ? (
            <div className="rounded-lg border overflow-hidden self-start">
              <Image
                src={guide.screenshot}
                alt={`Bảng điều khiển ${title}`}
                width={1440}
                height={900}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 flex items-center justify-center p-8 text-center self-start">
              <p className="text-sm text-muted-foreground">
                Mở bảng điều khiển để xem giao diện trực tiếp.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" /> Trách nhiệm chính
              </p>
              <ul className="space-y-1.5">
                {guide.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Nội dung hướng dẫn:</p>
              <div className="flex flex-wrap gap-2">
                {guide.sections.map(s => (
                  <Button key={s.id} asChild variant="secondary" size="sm">
                    <Link href={`#${s.id}`}>{s.title}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
              <Link href={guide.dashboard}>
                Mở bảng điều khiển của tôi <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Giới hạn quyền hạn */}
      {guide.notes && guide.notes.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" /> Giới hạn quyền hạn cần lưu ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {guide.notes.map((n, i) => (
                <li key={i} className="text-sm text-amber-800 dark:text-amber-300">• {n}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Chi tiết từng nhóm chức năng */}
      <div className="space-y-4">
        {guide.sections.map(section => (
          <Card key={section.id} id={section.id} className="scroll-mt-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
                <AccordionItem value={section.id} className="border-none">
                  <AccordionTrigger className="py-2 text-sm text-muted-foreground">
                    {section.functions.length} chức năng
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {section.functions.map((fn, i) => (
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                              {fn.title}
                            </h3>
                            {fn.href && (
                              <Button asChild variant="outline" size="sm">
                                <Link href={fn.href}>
                                  Mở chức năng <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                            <Target className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                            <span>{fn.purpose}</span>
                          </p>

                          <div className="mt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1">
                              <ListOrdered className="h-3.5 w-3.5" /> Các bước thực hiện
                            </p>
                            <ol className="list-decimal pl-5 space-y-1 text-sm marker:text-emerald-600">
                              {fn.steps.map((step, si) => (
                                <li key={si}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          {fn.permission && (
                            <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                              <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>{fn.permission}</span>
                            </p>
                          )}
                          {fn.limit && (
                            <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>{fn.limit}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tài liệu đầy đủ (.docx) — giữ tham chiếu */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tài liệu đầy đủ (để in / phát hành)</CardTitle>
          <CardDescription>
            {guide.docx ? (
              <>
                Bản chi tiết từng bước (kèm ảnh minh họa) của vai trò {title} được phát hành dạng
                Word (.docx) tại
                <code className="mx-1 px-1 rounded bg-muted">docs/huong-dan/{guide.docx}</code>.
              </>
            ) : (
              <>
                Các bản tài liệu đầy đủ dạng Word (.docx) cho từng vai trò được phát hành trong thư mục
                <code className="mx-1 px-1 rounded bg-muted">docs/huong-dan/</code> (vd:
                <code className="mx-1">tong-bien-tap.docx</code>,
                <code className="mx-1">pho-tong-bien-tap.docx</code>,
                <code className="mx-1">thu-ky-toa-soan.docx</code>).
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}

function NoGuideFallback({ roleLabel }: { roleLabel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-700" />
          Chưa có hướng dẫn riêng cho vai trò {roleLabel}
        </CardTitle>
        <CardDescription>
          Vai trò hiện tại của bạn chưa có bộ hướng dẫn dashboard riêng. Bạn có thể về trang chính hoặc
          xem website công khai của Tạp chí.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard"><Home className="h-4 w-4 mr-1" /> Về Bảng điều khiển</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/"><ExternalLink className="h-4 w-4 mr-1" /> Mở trang công khai</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
