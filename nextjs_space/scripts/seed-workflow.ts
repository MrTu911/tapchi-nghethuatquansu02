/**
 * Seed VÒNG ĐỜI BIÊN TẬP end-to-end — Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Bổ sung cho `seed:production` (vốn chỉ phủ khúc đuôi IN_PRODUCTION/PUBLISHED).
 * Script này tạo bài ở TẤT CẢ trạng thái đầu–giữa luồng và GẮN vào đúng tài
 * khoản demo của từng vai trò, để mỗi role đăng nhập đều có việc thật để thao tác:
 *
 *   NEW → UNDER_REVIEW → REVISION → ACCEPTED → (DESK_REJECT / REJECTED)
 *
 * Ánh xạ vai trò → việc cần test (đăng nhập bằng tài khoản demo, mật khẩu TapChi@2025):
 *   • AUTHOR  (tacgia@)        : xem cả pipeline; bài REVISION cần chỉnh sửa & nộp lại
 *   • REVIEWER(phanbien@)      : 4 trạng thái phản biện — Chờ nhận lời / Đang làm /
 *                                Đã nộp-còn sửa / Đã hoàn thành (khóa)
 *   • SECTION_EDITOR(bientap@) : NEW cần gán phản biện; UNDER_REVIEW cần ra quyết định
 *   • MANAGING_EDITOR(bientapchinh@): NEW chưa phân công biên tập viên
 *   • EIC/DEPUTY_EIC           : hàng chờ quyết định + bài ACCEPTED chờ sản xuất
 *   • LAYOUT_EDITOR            : dùng `seed:production` (IN_PRODUCTION)
 *   • COMMANDER/SYSADMIN       : số liệu tổng hợp trải đủ trạng thái
 *   • READER                   : bài đã công bố (seed:production)
 *
 * Nguyên tắc: tái sử dụng tài khoản & chuyên mục NTQS đã có; idempotent (chạy lại
 * không nhân đôi); toàn bộ định danh/nội dung đúng thương hiệu NTQS — HVQPh.
 *
 * Yêu cầu trước: `npm run seed:demo-accounts` (cần đủ 11 tài khoản vai trò).
 * Chạy: npm run seed:workflow
 */
import { PrismaClient, type SubmissionStatus, type Recommendation, type Decision } from '@prisma/client'

const prisma = new PrismaClient()
const DAY_MS = 24 * 60 * 60 * 1000
const PLACEHOLDER_MANUSCRIPT = (code: string) => `submissions/${code}/manuscript.pdf`

// ── Tài khoản demo theo vai trò (SSOT lib/demo-accounts.ts) ───────────────────
const ROLE_EMAILS = {
  author: 'tacgia@tapchintqsvn.edu.vn',
  reviewer: 'phanbien@tapchintqsvn.edu.vn',
  sectionEditor: 'bientap@tapchintqsvn.edu.vn',
  managingEditor: 'bientapchinh@tapchintqsvn.edu.vn',
  eic: 'tongbientap@tapchintqsvn.edu.vn',
} as const

// ── Chuyên mục NTQS (fallback nếu DB chưa có) ─────────────────────────────────
const categoryFallback: Record<string, { name: string; slug: string }> = {
  CLQS: { name: 'Chiến lược quân sự', slug: 'chien-luoc-quan-su' },
  NTTC: { name: 'Nghệ thuật tác chiến', slug: 'nghe-thuat-tac-chien' },
  CDH: { name: 'Chiến dịch học', slug: 'chien-dich-hoc' },
  CTH: { name: 'Chiến thuật học', slug: 'chien-thuat-hoc' },
  LSQS: { name: 'Lịch sử quân sự', slug: 'lich-su-quan-su' },
  HTQP: { name: 'Hợp tác quốc phòng', slug: 'hop-tac-quoc-phong' },
  GDQS: { name: 'Giáo dục quân sự', slug: 'giao-duc-quan-su' },
}

// Trạng thái nghiệp vụ của lượt phản biện cần dựng (xem lib/review-status.ts).
type ReviewState = 'INVITED' | 'IN_PROGRESS' | 'SUBMITTED' | null

interface FlowSeed {
  code: string
  status: SubmissionStatus
  title: string
  abstract: string
  categoryCode: string
  keywords: string[]
  /** Đã phân công biên tập viên chuyên mục chưa (assignedEditorId). */
  assignEditor: boolean
  /** Trạng thái lượt phản biện của phanbien@ (null = chưa có phản biện). */
  reviewState: ReviewState
  /** Khuyến nghị của phản biện khi reviewState='SUBMITTED'. */
  recommendation?: Recommendation
  /** Quyết định biên tập (tạo EditorDecision + khóa phản biện vòng đó). */
  decision?: Decision
  /** Người ra quyết định: section editor hay EIC. */
  decisionBy?: 'sectionEditor' | 'eic'
  daysAgo: number
  note: string
}

// Bài trải đủ 8 giá trị SubmissionStatus + 4 trạng thái phản biện.
const flows: FlowSeed[] = [
  {
    code: 'NTQS-FLOW-001', status: 'NEW', assignEditor: false, reviewState: null,
    title: 'Một số vấn đề về xây dựng thế trận phòng thủ quân khu trong tình hình mới',
    abstract: 'Bài viết bàn về yêu cầu, nội dung và giải pháp xây dựng thế trận phòng thủ quân khu vững chắc, đáp ứng nhiệm vụ bảo vệ Tổ quốc trong điều kiện mới.',
    categoryCode: 'CLQS', keywords: ['thế trận phòng thủ', 'quân khu', 'bảo vệ Tổ quốc'],
    daysAgo: 2, note: 'NEW chưa phân công — Thư ký tòa soạn cần phân công biên tập viên',
  },
  {
    code: 'NTQS-FLOW-002', status: 'NEW', assignEditor: true, reviewState: null,
    title: 'Vận dụng nghệ thuật "lấy nhỏ thắng lớn" trong tác chiến phòng thủ khu vực',
    abstract: 'Nghiên cứu cơ sở lý luận và thực tiễn của nghệ thuật lấy nhỏ thắng lớn, lấy ít địch nhiều, vận dụng vào tổ chức tác chiến phòng thủ khu vực hiện nay.',
    categoryCode: 'NTTC', keywords: ['lấy nhỏ thắng lớn', 'tác chiến phòng thủ', 'nghệ thuật quân sự'],
    daysAgo: 4, note: 'NEW đã phân công BTV — Biên tập viên chuyên mục cần gán phản biện',
  },
  {
    code: 'NTQS-FLOW-003', status: 'UNDER_REVIEW', assignEditor: true, reviewState: 'INVITED',
    title: 'Phát huy vai trò của lực lượng pháo binh trong chiến dịch tiến công hiệp đồng quân binh chủng',
    abstract: 'Bài viết phân tích vai trò, cách thức tổ chức và sử dụng pháo binh bảo đảm hỏa lực cho chiến dịch tiến công hiệp đồng quân binh chủng quy mô lớn.',
    categoryCode: 'CDH', keywords: ['pháo binh', 'hiệp đồng quân binh chủng', 'chiến dịch tiến công'],
    daysAgo: 6, note: 'UNDER_REVIEW — phản biện mới được mời, chờ nhận lời',
  },
  {
    code: 'NTQS-FLOW-004', status: 'UNDER_REVIEW', assignEditor: true, reviewState: 'IN_PROGRESS',
    title: 'Tổ chức trinh sát, nắm địch trong chiến thuật phòng ngự của tiểu đoàn bộ binh',
    abstract: 'Nghiên cứu nội dung, phương pháp tổ chức trinh sát và nắm địch phục vụ tác chiến phòng ngự cấp tiểu đoàn bộ binh trên các địa hình tác chiến điển hình.',
    categoryCode: 'CTH', keywords: ['trinh sát', 'phòng ngự', 'tiểu đoàn bộ binh'],
    daysAgo: 9, note: 'UNDER_REVIEW — phản biện đã nhận lời, đang thực hiện (có bản nháp)',
  },
  {
    code: 'NTQS-FLOW-005', status: 'UNDER_REVIEW', assignEditor: true, reviewState: 'SUBMITTED', recommendation: 'MINOR',
    title: 'Nghệ thuật chỉ đạo chiến tranh nhân dân địa phương trong kháng chiến chống Mỹ',
    abstract: 'Bài viết khái quát nghệ thuật chỉ đạo chiến tranh nhân dân địa phương, làm rõ bài học về kết hợp đấu tranh quân sự với chính trị, binh vận trong kháng chiến chống Mỹ, cứu nước.',
    categoryCode: 'LSQS', keywords: ['chiến tranh nhân dân', 'chiến tranh địa phương', 'kháng chiến chống Mỹ'],
    daysAgo: 13, note: 'UNDER_REVIEW — phản biện đã nộp, biên tập CHƯA quyết định → cần ra quyết định',
  },
  {
    code: 'NTQS-FLOW-006', status: 'REVISION', assignEditor: true, reviewState: 'SUBMITTED',
    recommendation: 'MAJOR', decision: 'MAJOR', decisionBy: 'sectionEditor',
    title: 'Đổi mới công tác bảo đảm hậu phương cho tác chiến của các binh đoàn chủ lực',
    abstract: 'Nghiên cứu yêu cầu đổi mới tổ chức và phương thức bảo đảm hậu phương, hậu cần — kỹ thuật cho tác chiến của các binh đoàn chủ lực trong chiến tranh bảo vệ Tổ quốc.',
    categoryCode: 'NTTC', keywords: ['bảo đảm tác chiến', 'binh đoàn chủ lực', 'hậu phương'],
    daysAgo: 18, note: 'REVISION — đã có quyết định "sửa đổi lớn", TÁC GIẢ cần chỉnh sửa & nộp lại',
  },
  {
    code: 'NTQS-FLOW-007', status: 'ACCEPTED', assignEditor: true, reviewState: 'SUBMITTED',
    recommendation: 'ACCEPT', decision: 'ACCEPT', decisionBy: 'eic',
    title: 'Tăng cường giáo dục, bồi dưỡng phẩm chất "Bộ đội Cụ Hồ" cho học viên đào tạo sĩ quan',
    abstract: 'Bài viết đề xuất nội dung, hình thức giáo dục, bồi dưỡng phẩm chất Bộ đội Cụ Hồ cho học viên đào tạo sĩ quan tại các học viện, nhà trường quân đội đáp ứng yêu cầu nhiệm vụ.',
    categoryCode: 'GDQS', keywords: ['Bộ đội Cụ Hồ', 'đào tạo sĩ quan', 'giáo dục quân sự'],
    daysAgo: 21, note: 'ACCEPTED — đã chấp nhận, chờ đưa vào sản xuất/dàn trang',
  },
  {
    code: 'NTQS-FLOW-008', status: 'DESK_REJECT', assignEditor: true, reviewState: null,
    decision: 'REJECT', decisionBy: 'sectionEditor',
    title: 'Bàn về một vài khía cạnh kỹ thuật của trang bị bộ binh (bản thảo sơ lược)',
    abstract: 'Bản thảo còn sơ lược, chưa rõ đóng góp khoa học và không thuộc đúng phạm vi nghệ thuật quân sự của Tạp chí.',
    categoryCode: 'CTH', keywords: ['trang bị bộ binh'],
    daysAgo: 25, note: 'DESK_REJECT — bị từ chối sơ bộ, không qua phản biện',
  },
  {
    code: 'NTQS-FLOW-009', status: 'REJECTED', assignEditor: true, reviewState: 'SUBMITTED',
    recommendation: 'REJECT', decision: 'REJECT', decisionBy: 'sectionEditor',
    title: 'Một cách tiếp cận về tác chiến điện tử (chưa đủ căn cứ khoa học)',
    abstract: 'Bài viết đặt vấn đề về tác chiến điện tử nhưng luận cứ và tài liệu tham khảo chưa bảo đảm độ tin cậy khoa học theo yêu cầu phản biện.',
    categoryCode: 'CLQS', keywords: ['tác chiến điện tử'],
    daysAgo: 28, note: 'REJECTED — bị từ chối sau phản biện',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUserByEmail(email: string) {
  const user = await prisma.user.findFirst({ where: { email } })
  if (!user) {
    throw new Error(
      `❌ Thiếu tài khoản demo "${email}". Hãy chạy "npm run seed:demo-accounts" trước khi seed luồng.`,
    )
  }
  return user
}

async function ensureCategory(code: string) {
  const existing = await prisma.category.findUnique({ where: { code } })
  if (existing) return existing
  const fb = categoryFallback[code]
  if (!fb) throw new Error(`Thiếu cấu hình fallback cho chuyên mục ${code}`)
  console.warn(`  ⚠️  Tạo chuyên mục NTQS còn thiếu: ${code} — ${fb.name}`)
  return prisma.category.create({ data: { code, name: fb.name, slug: fb.slug } })
}

/** formJson chuẩn theo /api/reviews/[id] (giữ đúng key để UI render được). */
function buildReviewForm(rec: Recommendation) {
  const byRec: Record<Recommendation, { strengths: string; weaknesses: string; comments: string }> = {
    ACCEPT: {
      strengths: 'Vấn đề nghiên cứu thiết thực, luận cứ chặt chẽ, đóng góp rõ về nghệ thuật quân sự.',
      weaknesses: 'Một vài thuật ngữ cần chuẩn hóa; bổ sung 1-2 tài liệu tham khảo gần đây.',
      comments: 'Đề nghị chấp nhận đăng sau khi hiệu đính nhẹ.',
    },
    MINOR: {
      strengths: 'Bố cục mạch lạc, bám sát thực tiễn huấn luyện và tác chiến.',
      weaknesses: 'Phần kết luận còn chung chung; cần làm rõ tính mới so với các nghiên cứu trước.',
      comments: 'Đề nghị sửa chữa nhỏ trước khi chấp nhận đăng.',
    },
    MAJOR: {
      strengths: 'Hướng nghiên cứu có giá trị, tư liệu phong phú.',
      weaknesses: 'Khung lý luận chưa vững, thiếu số liệu/dẫn chứng; cần tổ chức lại phần phân tích.',
      comments: 'Đề nghị sửa chữa lớn và nộp lại để phản biện vòng tiếp theo.',
    },
    REJECT: {
      strengths: 'Đặt vấn đề có ý nghĩa thời sự.',
      weaknesses: 'Luận cứ khoa học chưa bảo đảm, tài liệu tham khảo thiếu tin cậy, trùng lặp ý đã công bố.',
      comments: 'Chưa đạt yêu cầu đăng tải; đề nghị từ chối.',
    },
  }
  const scoreByRec: Record<Recommendation, number> = { ACCEPT: 88, MINOR: 76, MAJOR: 58, REJECT: 38 }
  const t = byRec[rec]
  return {
    score: scoreByRec[rec],
    form: {
      novelty: rec === 'REJECT' ? 'Tính mới hạn chế' : 'Có tính mới',
      methodology: 'Phương pháp nghiên cứu phù hợp ở mức cơ bản',
      results: 'Kết quả bám sát mục tiêu nghiên cứu',
      presentation: 'Trình bày rõ ràng, đúng thể thức tạp chí',
      references: 'Tài liệu tham khảo cần rà soát, cập nhật',
      strengths: t.strengths,
      weaknesses: t.weaknesses,
      comments: t.comments,
      confidentialComments: 'Ý kiến gửi riêng biên tập: không có xung đột lợi ích.',
    },
  }
}

interface Actors {
  author: { id: string }
  reviewer: { id: string }
  sectionEditor: { id: string }
  managingEditor: { id: string }
  eic: { id: string }
}

async function ensureManuscriptFile(submissionId: string, code: string, uploadedBy: string) {
  const existing = await prisma.uploadedFile.findFirst({ where: { submissionId } })
  if (existing) return
  await prisma.uploadedFile.create({
    data: {
      originalName: `${code}-ban-thao.pdf`,
      cloudStoragePath: PLACEHOLDER_MANUSCRIPT(code),
      fileType: 'MANUSCRIPT',
      mimeType: 'application/pdf',
      fileSize: 1024 * 480,
      submissionId,
      uploadedBy,
      description: 'Bản thảo gốc của tác giả (dữ liệu demo luồng biên tập)',
    },
  })
}

async function ensureReview(
  flow: FlowSeed,
  submissionId: string,
  actors: Actors,
  createdAt: Date,
) {
  if (!flow.reviewState) return
  const roundNo = 1
  const existing = await prisma.review.findFirst({
    where: { submissionId, reviewerId: actors.reviewer.id, roundNo },
  })
  if (existing) return

  const invitedAt = new Date(createdAt.getTime() + 1 * DAY_MS)
  const base = {
    submissionId,
    reviewerId: actors.reviewer.id,
    roundNo,
    invitedAt,
    remindersSent: 0,
  }

  if (flow.reviewState === 'INVITED') {
    await prisma.review.create({
      data: { ...base, deadline: new Date(Date.now() + 12 * DAY_MS) },
    })
    return
  }

  if (flow.reviewState === 'IN_PROGRESS') {
    const draft = buildReviewForm(flow.recommendation ?? 'MINOR')
    await prisma.review.create({
      data: {
        ...base,
        acceptedAt: new Date(invitedAt.getTime() + 1 * DAY_MS),
        deadline: new Date(Date.now() + 8 * DAY_MS),
        // Bản nháp: có formJson nhưng CHƯA submittedAt → trạng thái "Đang thực hiện".
        formJson: draft.form as any,
        score: draft.score,
        recommendation: flow.recommendation ?? 'MINOR',
      },
    })
    return
  }

  // SUBMITTED: đã nộp (submittedAt). Bị khóa hay không tùy có EditorDecision (xử lý ở ensureDecision).
  const rec = flow.recommendation ?? 'MINOR'
  const filled = buildReviewForm(rec)
  await prisma.review.create({
    data: {
      ...base,
      acceptedAt: new Date(invitedAt.getTime() + 1 * DAY_MS),
      submittedAt: new Date(Date.now() - 2 * DAY_MS),
      deadline: new Date(Date.now() - 1 * DAY_MS),
      formJson: filled.form as any,
      score: filled.score,
      recommendation: rec,
    },
  })
}

async function ensureDecision(flow: FlowSeed, submissionId: string, actors: Actors) {
  if (!flow.decision) return
  const roundNo = 1
  const existing = await prisma.editorDecision.findFirst({ where: { submissionId, roundNo } })
  if (existing) return
  const decidedBy = flow.decisionBy === 'eic' ? actors.eic.id : actors.sectionEditor.id
  const noteByDecision: Record<Decision, string> = {
    ACCEPT: 'Chấp nhận đăng. Chuyển khâu biên tập, dàn trang.',
    MINOR: 'Đề nghị tác giả chỉnh sửa nhỏ theo ý kiến phản biện và nộp lại.',
    MAJOR: 'Đề nghị tác giả chỉnh sửa lớn, bổ sung luận cứ và nộp lại để phản biện vòng sau.',
    REJECT: flow.status === 'DESK_REJECT'
      ? 'Từ chối sơ bộ: chưa đạt yêu cầu phạm vi và chất lượng để đưa ra phản biện.'
      : 'Từ chối sau phản biện: luận cứ khoa học chưa bảo đảm.',
  }
  await prisma.editorDecision.create({
    data: {
      submissionId,
      roundNo,
      decision: flow.decision,
      note: noteByDecision[flow.decision],
      decidedBy,
    },
  })
}

async function ensureNotifications(flow: FlowSeed, submissionId: string, actors: Actors) {
  // Chỉ tạo khi chưa có thông báo gắn với mã bài này (idempotent đơn giản theo link).
  const link = `/dashboard/author/submissions/${submissionId}`
  const exists = await prisma.notification.findFirst({
    where: { userId: actors.author.id, link },
  })
  if (exists) return

  // Thông báo cho TÁC GIẢ theo trạng thái.
  if (flow.status === 'REVISION') {
    await prisma.notification.create({
      data: {
        userId: actors.author.id, type: 'REVISION_REQUESTED',
        title: 'Yêu cầu chỉnh sửa bài viết',
        message: `Bài "${flow.title}" cần chỉnh sửa theo ý kiến phản biện và nộp lại.`,
        link,
      },
    })
  } else if (flow.status === 'ACCEPTED') {
    await prisma.notification.create({
      data: {
        userId: actors.author.id, type: 'DECISION_MADE',
        title: 'Bài viết được chấp nhận',
        message: `Chúc mừng! Bài "${flow.title}" đã được chấp nhận và sẽ vào khâu xuất bản.`,
        link,
      },
    })
  } else if (flow.status === 'REJECTED' || flow.status === 'DESK_REJECT') {
    await prisma.notification.create({
      data: {
        userId: actors.author.id, type: 'DECISION_MADE',
        title: 'Kết quả xét duyệt bài viết',
        message: `Bài "${flow.title}" không được chấp nhận đăng. Xem chi tiết ý kiến của tòa soạn.`,
        link,
      },
    })
  }

  // Thông báo cho PHẢN BIỆN khi mới được mời.
  if (flow.reviewState === 'INVITED') {
    await prisma.notification.create({
      data: {
        userId: actors.reviewer.id, type: 'REVIEW_INVITED',
        title: 'Lời mời phản biện mới',
        message: `Bạn được mời phản biện bài "${flow.title}". Vui lòng nhận lời hoặc từ chối.`,
        link: `/dashboard/reviewer/assignments`,
      },
    })
  }
}

async function recordStatusHistory(articleId: string, status: SubmissionStatus, changedBy: string, notes: string) {
  const existing = await prisma.articleStatusHistory.findFirst({ where: { articleId, status } })
  if (existing) return
  await prisma.articleStatusHistory.create({ data: { articleId, status, changedBy, notes } })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding VÒNG ĐỜI BIÊN TẬP (tất cả vai trò) — Tạp chí Nghệ thuật Quân sự Việt Nam\n')

  console.log('📋 Tìm tài khoản demo theo vai trò...')
  const actors: Actors = {
    author: await getUserByEmail(ROLE_EMAILS.author),
    reviewer: await getUserByEmail(ROLE_EMAILS.reviewer),
    sectionEditor: await getUserByEmail(ROLE_EMAILS.sectionEditor),
    managingEditor: await getUserByEmail(ROLE_EMAILS.managingEditor),
    eic: await getUserByEmail(ROLE_EMAILS.eic),
  }
  console.log(`  ✓ AUTHOR=${ROLE_EMAILS.author}`)
  console.log(`  ✓ REVIEWER=${ROLE_EMAILS.reviewer}`)
  console.log(`  ✓ SECTION_EDITOR=${ROLE_EMAILS.sectionEditor}`)
  console.log(`  ✓ MANAGING_EDITOR=${ROLE_EMAILS.managingEditor}`)
  console.log(`  ✓ EIC=${ROLE_EMAILS.eic}`)

  console.log('\n🧪 Tạo bài theo từng trạng thái luồng...')
  for (const flow of flows) {
    const category = await ensureCategory(flow.categoryCode)
    const createdAt = new Date(Date.now() - flow.daysAgo * DAY_MS)

    let submission = await prisma.submission.findFirst({ where: { code: flow.code } })
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          code: flow.code,
          title: flow.title,
          abstractVn: flow.abstract,
          keywords: flow.keywords,
          status: flow.status,
          securityLevel: 'PUBLIC',
          categoryId: category.id,
          createdBy: actors.author.id,
          assignedEditorId: flow.assignEditor ? actors.sectionEditor.id : null,
          createdAt,
          lastStatusChangeAt: new Date(Date.now() - Math.floor(flow.daysAgo / 2) * DAY_MS),
          revisionRound: 0,
        },
      })
    } else {
      // Giữ idempotent nhưng đồng bộ lại trạng thái/phân công nếu chạy lại.
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: flow.status,
          assignedEditorId: flow.assignEditor ? actors.sectionEditor.id : null,
        },
      })
    }

    await ensureManuscriptFile(submission.id, flow.code, actors.author.id)
    await ensureReview(flow, submission.id, actors, createdAt)
    await ensureDecision(flow, submission.id, actors)
    await ensureNotifications(flow, submission.id, actors)

    console.log(`  ✓ ${flow.code} [${flow.status}] — ${flow.note}`)
  }

  // ── Tổng kết theo trạng thái ──────────────────────────────────────────────
  const counts = await prisma.submission.groupBy({
    by: ['status'],
    where: { code: { startsWith: 'NTQS-FLOW-' } },
    _count: true,
  })
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Seed vòng đời biên tập (NTQS) hoàn thành!\n')
  console.log('📊 Bài NTQS-FLOW theo trạng thái:')
  for (const c of counts.sort((a, b) => a.status.localeCompare(b.status))) {
    console.log(`   • ${c.status.padEnd(14)}: ${c._count}`)
  }
  console.log('\n🔑 Mật khẩu mọi tài khoản demo: TapChi@2025')
  console.log('\n🔗 Kiểm thử theo vai trò (đăng nhập rồi mở dashboard tương ứng):')
  console.log(`   • AUTHOR    ${ROLE_EMAILS.author}        → /dashboard/author/submissions (bài REVISION cần sửa & nộp lại)`)
  console.log(`   • REVIEWER  ${ROLE_EMAILS.reviewer}      → /dashboard/reviewer/assignments (4 trạng thái phản biện)`)
  console.log(`   • SECTION   ${ROLE_EMAILS.sectionEditor}        → /dashboard/editor/submissions (gán phản biện / ra quyết định)`)
  console.log(`   • MANAGING  ${ROLE_EMAILS.managingEditor}  → /dashboard/managing/assignments (phân công BTV cho FLOW-001)`)
  console.log(`   • EIC       ${ROLE_EMAILS.eic}      → /dashboard/eic (hàng chờ quyết định + ACCEPTED)`)
  console.log('   • LAYOUT_EDITOR → chạy thêm "npm run seed:production" cho hàng đợi sản xuất')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
