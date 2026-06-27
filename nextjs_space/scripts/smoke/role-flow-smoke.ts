/**
 * Smoke harness — kiểm tra RBAC theo vai trò trên APP THẬT (HTTP), Tạp chí NTQS.
 *
 * Khác với `verify:roles` (chỉ kiểm tra đăng nhập ở tầng DB), script này gọi HTTP
 * thật vào server đang chạy để xác nhận:
 *   1. Cả 11 vai trò đăng nhập được qua /api/auth/login và nhận cookie phiên.
 *   2. Ma trận RBAC ở tầng API khớp SSOT (lib/rbac.ts, lib/api-guards.ts):
 *      - vai trò KHÔNG có quyền → 401/403
 *      - vai trò CÓ quyền → KHÔNG bị 401/403 (qua cổng RBAC; 400/404 do thiếu body
 *        hoặc resource không tồn tại được coi là "qua cổng").
 *   3. Middleware chặn truy cập dashboard chéo vai trò (redirect ?error=access_denied).
 *   4. Bảo mật danh sách bài nộp: READER không được xem bài chưa xuất bản.
 *
 * Lưu ý môi trường:
 *   - Build production (pm2) bật rate-limit đăng nhập 5 lần/15 phút/IP. Server lấy IP
 *     từ `request.ip ?? x-forwarded-for`. Harness đặt X-Forwarded-For riêng cho mỗi
 *     vai trò để mỗi lần đăng nhập rơi vào bucket khác nhau (kỹ thuật test localhost,
 *     KHÔNG ảnh hưởng production thật vốn đứng sau proxy đặt XFF theo IP client thật).
 *   - Tài khoản demo không bật 2FA → login trả phiên đầy đủ ngay.
 *
 * Chạy: npm run smoke:roles   (cần app chạy ở SMOKE_BASE_URL, mặc định http://localhost:3001)
 */

import { PrismaClient } from '@prisma/client'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demo-accounts'
import { REVIEWER_ELIGIBLE_ROLES, type Role } from '@/lib/rbac'

const BASE_URL = (process.env.SMOKE_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
const FAKE_SUBMISSION_ID = 'smoke-nonexistent-submission-id'
const SMOKE_CODE_PREFIX = 'SMOKE-NTQS-'

// Prisma chỉ dùng cho khâu 5 (vòng đời): seed fixture + đọc trạng thái + dọn dữ liệu.
const prisma = new PrismaClient()

const ALL_ROLES: Role[] = [
  'READER', 'AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'LAYOUT_EDITOR',
  'MANAGING_EDITOR', 'SECURITY_AUDITOR', 'DEPUTY_EIC', 'EIC', 'COMMANDER', 'SYSADMIN',
]

// ── Kiểu dữ liệu ────────────────────────────────────────────────────────────
type RoleSession = { role: Role; email: string; cookie: string; userId: string }

type RbacProbe = {
  name: string
  method: 'GET' | 'POST'
  path: string
  body?: unknown
  /** Vai trò mà cổng RBAC PHẢI cho qua (không 401/403). Suy ra từ guard thực tế. */
  allow: Role[]
}

type CheckResult = { label: string; ok: boolean; detail: string }

// ── Ma trận RBAC (suy ra trực tiếp từ guard trong code) ─────────────────────
// requireAuthor → [AUTHOR, MANAGING_EDITOR, DEPUTY_EIC, EIC, SYSADMIN]
// can.assignReview / can.decide → [SECTION_EDITOR, MANAGING_EDITOR, DEPUTY_EIC, EIC, SYSADMIN]
// managing-editor/assign → [MANAGING_EDITOR, DEPUTY_EIC, EIC, SYSADMIN]
// production/publish → [EIC, SYSADMIN]
const RBAC_PROBES: RbacProbe[] = [
  {
    name: 'Nộp bài  POST /api/submissions',
    method: 'POST',
    path: '/api/submissions',
    body: {},
    allow: ['AUTHOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  },
  {
    name: 'Phân công biên tập  POST /api/managing-editor/assign',
    method: 'POST',
    path: '/api/managing-editor/assign',
    body: {},
    allow: ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  },
  {
    name: 'Gán phản biện  POST /api/submissions/:id/assign-reviewers',
    method: 'POST',
    path: `/api/submissions/${FAKE_SUBMISSION_ID}/assign-reviewers`,
    body: {},
    allow: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  },
  {
    name: 'Xuất bản  POST /api/production/publish',
    method: 'POST',
    path: '/api/production/publish',
    body: {},
    allow: ['EIC', 'SYSADMIN'],
  },
]

// ── Kiểm tra redirect dashboard chéo vai trò (middleware) ────────────────────
// path dashboard + danh sách vai trò ĐƯỢC vào (theo dashboardAccessControl).
const DASHBOARD_ACCESS: { path: string; allow: Role[] }[] = [
  { path: '/dashboard/eic', allow: ['EIC', 'DEPUTY_EIC', 'SYSADMIN'] },
  { path: '/dashboard/admin', allow: ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'] },
  { path: '/dashboard/security', allow: ['SECURITY_AUDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'] },
  { path: '/dashboard/commander', allow: ['COMMANDER', 'SYSADMIN'] },
]

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function forwardedFor(roleIndex: number): string {
  // IP giả lập riêng cho mỗi vai trò → tránh chung bucket rate-limit login.
  return `10.77.${roleIndex}.${(roleIndex * 7 + 11) % 250}`
}

async function login(role: Role, roleIndex: number): Promise<RoleSession | null> {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role)
  if (!account) return null

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': forwardedFor(roleIndex) },
    body: JSON.stringify({ email: account.email, password: DEMO_PASSWORD }),
    redirect: 'manual',
  })

  const json = await res.json().catch(() => null) as any
  if (json?.data?.requires2FA) {
    console.log(`  ⚠️  ${role}: tài khoản demo đang bật 2FA — smoke không thể tự qua lớp 2.`)
    return null
  }

  const setCookies = res.headers.getSetCookie?.() ?? []
  const authCookie = setCookies.map((c) => c.split(';')[0]).find((c) => c.startsWith('auth-token='))
  if (res.status !== 200 || !authCookie) {
    console.log(`  ❌ ${role}: login thất bại (HTTP ${res.status}) ${json?.error ?? json?.message ?? ''}`)
    return null
  }

  return { role, email: account.email, cookie: authCookie, userId: json?.data?.user?.id ?? '' }
}

async function callApi(
  session: RoleSession,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<number> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Cookie: session.cookie,
      'X-Forwarded-For': forwardedFor(ALL_ROLES.indexOf(session.role)),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  return res.status
}

const isBlocked = (status: number) => status === 401 || status === 403

// ── Các nhóm kiểm tra ────────────────────────────────────────────────────────
async function runRbacMatrix(sessions: RoleSession[]): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  for (const probe of RBAC_PROBES) {
    const offenders: string[] = []
    for (const session of sessions) {
      const status = await callApi(session, probe.method, probe.path, probe.body)
      const shouldPass = probe.allow.includes(session.role)
      const gatePassed = !isBlocked(status)
      if (gatePassed !== shouldPass) {
        offenders.push(`${session.role}→${status}(kỳ vọng ${shouldPass ? 'qua' : 'chặn'})`)
      }
    }
    results.push({
      label: `RBAC · ${probe.name}`,
      ok: offenders.length === 0,
      detail: offenders.length === 0 ? 'khớp ma trận quyền' : offenders.join(', '),
    })
  }

  return results
}

async function runDashboardRedirects(sessions: RoleSession[]): Promise<CheckResult[]> {
  const byRole = new Map(sessions.map((s) => [s.role, s]))
  const results: CheckResult[] = []

  for (const entry of DASHBOARD_ACCESS) {
    const offenders: string[] = []
    // Chỉ thử vài vai trò đại diện (1 được phép + 2 bị chặn) để gọn.
    const sampleRoles: Role[] = [entry.allow[0], ...ALL_ROLES.filter((r) => !entry.allow.includes(r)).slice(0, 2)]
    for (const role of sampleRoles) {
      const session = byRole.get(role)
      if (!session) continue
      const res = await fetch(`${BASE_URL}${entry.path}`, {
        method: 'GET',
        headers: { Cookie: session.cookie, 'X-Forwarded-For': forwardedFor(ALL_ROLES.indexOf(role)) },
        redirect: 'manual',
      })
      const location = res.headers.get('location') || ''
      const redirectedDenied = res.status >= 300 && res.status < 400 && location.includes('access_denied')
      const allowed = entry.allow.includes(role)
      // Được phép → KHÔNG bị redirect access_denied. Bị chặn → PHẢI redirect access_denied.
      const ok = allowed ? !redirectedDenied : redirectedDenied
      if (!ok) offenders.push(`${role}→HTTP ${res.status}`)
    }
    results.push({
      label: `Dashboard guard · ${entry.path}`,
      ok: offenders.length === 0,
      detail: offenders.length === 0 ? 'middleware chặn/cho đúng vai trò' : offenders.join(', '),
    })
  }

  return results
}

async function runReaderConfidentiality(sessions: RoleSession[]): Promise<CheckResult[]> {
  const reader = sessions.find((s) => s.role === 'READER')
  if (!reader) return [{ label: 'Bảo mật · READER liệt kê bài nộp', ok: false, detail: 'không có phiên READER' }]

  const res = await fetch(`${BASE_URL}/api/submissions?limit=100`, {
    method: 'GET',
    headers: { Cookie: reader.cookie, 'X-Forwarded-For': forwardedFor(ALL_ROLES.indexOf('READER')) },
    redirect: 'manual',
  })
  const json = await res.json().catch(() => null) as any
  const items: any[] = json?.submissions ?? []
  const nonPublished = items.filter((s) => s?.status && s.status !== 'PUBLISHED')
  const leaksAuthorPii = nonPublished.some((s) => s?.author?.email)

  return [{
    label: 'Bảo mật · READER liệt kê bài nộp (GET /api/submissions)',
    ok: nonPublished.length === 0,
    detail: nonPublished.length === 0
      ? `chỉ thấy ${items.length} bài đã xuất bản (hoặc rỗng)`
      : `RÒ RỈ: thấy ${nonPublished.length}/${items.length} bài CHƯA xuất bản` +
        (leaksAuthorPii ? ' kèm danh tính tác giả' : ''),
  }]
}

async function runReviewerConfidentiality(sessions: RoleSession[]): Promise<CheckResult[]> {
  // AUTHOR/READER không được liệt kê phản biện (giữ phản biện kín). Endpoint trả mảng.
  const results: CheckResult[] = []
  for (const role of ['AUTHOR', 'READER'] as Role[]) {
    const sess = sessions.find((s) => s.role === role)
    if (!sess) { results.push({ label: `Bảo mật · ${role} liệt kê phản biện`, ok: false, detail: 'không có phiên' }); continue }
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'GET',
      headers: { Cookie: sess.cookie, 'X-Forwarded-For': forwardedFor(ALL_ROLES.indexOf(role)) },
      redirect: 'manual',
    })
    const json = await res.json().catch(() => null) as any
    const items: any[] = Array.isArray(json) ? json : (json?.reviews ?? [])
    results.push({
      label: `Bảo mật · ${role} liệt kê phản biện (GET /api/reviews)`,
      ok: items.length === 0,
      detail: items.length === 0 ? 'không thấy phản biện nào (đúng)' : `RÒ RỈ: thấy ${items.length} phản biện`,
    })
  }
  return results
}

// ── Vòng đời bản thảo: NEW → UNDER_REVIEW → REVISION → (guard) → ACCEPTED ─────
async function postJson(session: RoleSession, path: string, body: unknown): Promise<number> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Cookie: session.cookie,
      'Content-Type': 'application/json',
      'X-Forwarded-For': forwardedFor(ALL_ROLES.indexOf(session.role)),
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  })
  return res.status
}

async function runLifecycleWalk(sessions: RoleSession[]): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const byRole = new Map(sessions.map((s) => [s.role, s]))
  const author = byRole.get('AUTHOR')
  const sectionEditor = byRole.get('SECTION_EDITOR')
  const managing = byRole.get('MANAGING_EDITOR')
  if (!author?.userId || !sectionEditor?.userId || !managing) {
    return [{ label: 'Vòng đời · chuẩn bị phiên', ok: false, detail: 'thiếu phiên AUTHOR/SECTION_EDITOR/MANAGING' }]
  }

  const reviewers = await prisma.user.findMany({
    where: { role: { in: REVIEWER_ELIGIBLE_ROLES }, isActive: true, id: { notIn: [author.userId, sectionEditor.userId] } },
    select: { id: true },
    take: 2,
  })
  if (reviewers.length < 2) {
    return [{ label: 'Vòng đời · chuẩn bị phản biện', ok: false, detail: 'không đủ 2 phản biện hợp lệ trong DB' }]
  }

  const category = await prisma.category.findFirst({ select: { id: true } })
  const code = `${SMOKE_CODE_PREFIX}${Date.now()}`
  const sub = await prisma.submission.create({
    data: {
      code,
      title: `${SMOKE_CODE_PREFIX}Bản thảo kiểm thử vòng đời`,
      abstractVn: 'Bản thảo tạm cho smoke — sẽ bị xóa.',
      keywords: ['smoke', 'ntqs'],
      status: 'NEW',
      securityLevel: 'PUBLIC',
      categoryId: category?.id ?? null,
      createdBy: author.userId,
    },
    select: { id: true },
  })
  const sid = sub.id
  const statusOf = async () => (await prisma.submission.findUnique({ where: { id: sid }, select: { status: true } }))?.status

  try {
    const h1 = await postJson(managing, '/api/managing-editor/assign', { submissionId: sid, editorId: sectionEditor.userId })
    const a1 = (await prisma.submission.findUnique({ where: { id: sid }, select: { assignedEditorId: true } }))?.assignedEditorId
    results.push({ label: '1. MANAGING phân công BTV', ok: a1 === sectionEditor.userId, detail: `http=${h1}, assignedEditorId ${a1 === sectionEditor.userId ? 'đúng' : 'sai'}` })

    const h2 = await postJson(sectionEditor, `/api/submissions/${sid}/assign-reviewers`, { reviewerIds: reviewers.map((r) => r.id) })
    const s2 = await statusOf()
    results.push({ label: '2. SECTION_EDITOR gán phản biện → UNDER_REVIEW', ok: s2 === 'UNDER_REVIEW', detail: `http=${h2}, status=${s2}` })

    const h3 = await postJson(sectionEditor, `/api/submissions/${sid}/decision`, { decision: 'MINOR', roundNo: 1, note: 'smoke: sửa nhỏ' })
    const s3 = await statusOf()
    results.push({ label: '3. SECTION_EDITOR quyết định MINOR → REVISION', ok: s3 === 'REVISION', detail: `http=${h3}, status=${s3}` })

    const h4 = await postJson(sectionEditor, `/api/submissions/${sid}/decision`, { decision: 'ACCEPT', roundNo: 1 })
    const s4 = await statusOf()
    results.push({ label: '4. Guard: ACCEPT từ REVISION bị chặn (409)', ok: h4 === 409 && s4 === 'REVISION', detail: `http=${h4}, status=${s4}` })

    // Mô phỏng tác giả nộp bản sửa (đường nộp lại được phủ ở revision-resubmit test).
    await prisma.submission.update({ where: { id: sid }, data: { status: 'UNDER_REVIEW', revisionRound: { increment: 1 }, lastStatusChangeAt: new Date() } })

    const h6 = await postJson(sectionEditor, `/api/submissions/${sid}/decision`, { decision: 'ACCEPT', roundNo: 2 })
    const s6 = await statusOf()
    results.push({ label: '6. SECTION_EDITOR quyết định ACCEPT → ACCEPTED', ok: s6 === 'ACCEPTED', detail: `http=${h6}, status=${s6}` })
  } finally {
    await cleanupSmokeData()
  }
  return results
}

async function cleanupSmokeData(): Promise<void> {
  const subs = await prisma.submission.findMany({ where: { code: { startsWith: SMOKE_CODE_PREFIX } }, select: { id: true } })
  if (subs.length === 0) return
  const ids = subs.map((s) => s.id)
  await prisma.review.deleteMany({ where: { submissionId: { in: ids } } })
  await prisma.editorDecision.deleteMany({ where: { submissionId: { in: ids } } })
  await prisma.deadline.deleteMany({ where: { submissionId: { in: ids } } })
  await prisma.submissionVersion.deleteMany({ where: { submissionId: { in: ids } } })
  await prisma.uploadedFile.deleteMany({ where: { submissionId: { in: ids } } })
  for (const id of ids) await prisma.auditLog.deleteMany({ where: { object: { contains: id } } })
  await prisma.notification.deleteMany({ where: { message: { contains: SMOKE_CODE_PREFIX } } })
  await prisma.submission.deleteMany({ where: { id: { in: ids } } })
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n▶ Smoke RBAC theo vai trò — ${BASE_URL} (Tạp chí NTQS)\n`)

  // 1. Đăng nhập 11 vai trò
  console.log('[1] Đăng nhập 11 vai trò qua HTTP')
  const sessions: RoleSession[] = []
  for (let i = 0; i < ALL_ROLES.length; i++) {
    const role = ALL_ROLES[i]
    const session = await login(role, i)
    if (session) {
      sessions.push(session)
      console.log(`  ✅ ${role.padEnd(16)} ${session.email}`)
    }
  }
  console.log(`  → ${sessions.length}/${ALL_ROLES.length} đăng nhập thành công\n`)

  // 2-4. Các nhóm kiểm tra
  const allResults: CheckResult[] = []
  console.log('[2] Ma trận RBAC ở tầng API')
  allResults.push(...(await runRbacMatrix(sessions)))
  console.log('[3] Guard truy cập dashboard chéo vai trò')
  allResults.push(...(await runDashboardRedirects(sessions)))
  console.log('[4] Bảo mật danh sách bài nộp & phản biện')
  allResults.push(...(await runReaderConfidentiality(sessions)))
  allResults.push(...(await runReviewerConfidentiality(sessions)))
  console.log('[5] Vòng đời bản thảo qua HTTP (NEW → ACCEPTED)')
  allResults.push(...(await runLifecycleWalk(sessions)))

  // In kết quả
  console.log('\n── Kết quả ──────────────────────────────────────────────')
  for (const r of allResults) {
    console.log(`  ${r.ok ? '✅ PASS' : '❌ FAIL'}  ${r.label}`)
    console.log(`           ${r.detail}`)
  }

  const loginOk = sessions.length === ALL_ROLES.length
  const checksFailed = allResults.filter((r) => !r.ok).length
  console.log('\n── Tổng kết ─────────────────────────────────────────────')
  console.log(`  Đăng nhập: ${sessions.length}/${ALL_ROLES.length}`)
  console.log(`  Kiểm tra : ${allResults.length - checksFailed}/${allResults.length} PASS`)

  if (!loginOk || checksFailed > 0) {
    console.log('\n❌ Smoke có lỗi/finding — xem chi tiết phía trên.\n')
    process.exitCode = 1
    return
  }
  console.log('\n✅ Smoke toàn bộ PASS.\n')
}

main()
  .catch((err) => {
    console.error('Smoke harness lỗi runtime:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await cleanupSmokeData().catch(() => {})
    await prisma.$disconnect().catch(() => {})
  })
