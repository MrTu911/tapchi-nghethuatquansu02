/**
 * seed-plagiarism-demo.ts
 *
 * Seed dữ liệu demo cho chức năng kiểm tra trùng lặp / đạo văn, PHÁI SINH TỪ KHO
 * THƯ VIỆN thật (JournalArticle đã import từ corpus). Tạo bài nộp demo phủ đủ 4 mức:
 *   - COPY     : sao chép gần nguyên văn 1 bài thư viện               → Rất cao (~100%)
 *   - HIGH     : ~45-55% nội dung bài thư viện + phụ lục số liệu riêng → Cao (~45-55%)
 *   - MEDIUM   : ~22-30% nội dung bài thư viện + phụ lục số liệu riêng → Trung bình
 *   - ORIGINAL : nội dung đời thường, khác hẳn miền quân sự           → Thấp
 * Kèm 1 cặp "tự đạo văn" (cùng tác giả, nội dung trùng) để minh hoạ cờ sameAuthor.
 *
 * CHỐNG NHIỄU: phần "độn" của tier HIGH/MEDIUM là PHỤ LỤC SỐ LIỆU DUY NHẤT theo mã bài
 * (toàn mã + số) → off-corpus, KHÔNG trùng bài khác, không kéo điểm bài khác lên.
 * Độ trùng cụm (phraseOverlap) ≈ tỉ lệ lấy từ bài thư viện → điều khiển được mức.
 *
 * Sau khi tạo bài, chạy engine thật và LƯU PlagiarismReport → dashboard có dữ liệu ngay.
 * Reset sạch: mỗi lần chạy XÓA bài + báo cáo demo cũ (NTQS-PLG-DEMO-*) rồi tạo lại.
 *
 * Run: npm run seed:plagiarism-demo
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { checkSubmissionPlagiarism, savePlagiarismReport } from '@/lib/plagiarism'
import type { SubmissionStatus } from '@prisma/client'

const DEMO_PREFIX = 'NTQS-PLG-DEMO-'
const TARGET_LEN = 2800

// 3 đoạn văn đời thường (khác hẳn miền quân sự) cho 3 bài ORIGINAL — chủ đề riêng biệt.
const EVERYDAY: { title: string; text: string }[] = [
  {
    title: 'Buổi sáng làm bánh mì cùng cả nhà cuối tuần',
    text: 'Sáng chủ nhật, cả nhà rủ nhau làm bánh mì tại bếp. Mẹ nhào bột với men và một chút đường, ủ trong âu sạch khoảng một giờ cho bột nở gấp đôi. Bố canh lửa lò vừa phải để vỏ bánh vàng giòn mà ruột vẫn mềm. Lũ trẻ thích nhất công đoạn rắc vừng lên mặt bánh rồi chờ mùi thơm lan khắp gian bếp nhỏ. Khi bánh ra lò, mọi người ngồi quây quần bên bàn, phết bơ và uống sữa nóng, tiếng cười nói rộn ràng làm căn nhà ấm áp hơn ngày thường.',
  },
  {
    title: 'Quán cà phê góc phố và nhịp sống thư thái',
    text: 'Quán cà phê góc phố mở cửa từ sớm, mùi cà phê rang quyện trong làn gió mát. Cô chủ quán tỉ mỉ lau từng chiếc bàn gỗ, xếp lại mấy chậu cây nhỏ bên cửa sổ. Khách quen thường gọi một ly nâu đá, ngồi đọc báo và ngắm dòng người qua lại. Buổi chiều quán đông hơn với những nhóm bạn trẻ trò chuyện rôm rả. Bản nhạc nhẹ phát ra từ chiếc loa cũ khiến không gian thêm thư thái, đến tối đèn vàng bật lên ấm cúng cả khu phố.',
  },
  {
    title: 'Khu vườn nhỏ trên ban công của hai bà cháu',
    text: 'Ban công trước nhà được tận dụng trồng vài chậu rau và hoa. Mỗi sáng bà tưới nước cho luống cải, hái ít lá già và bắt sâu cho cây. Chậu hoa mười giờ nở rực khi nắng lên, còn giàn mướp leo dần kín hàng rào. Cuối tuần cháu phụ bà thay đất, bón thêm phân và gieo hạt mới vào khay ươm. Nhìn mầm xanh nhú lên từng ngày là niềm vui giản dị của hai bà cháu giữa phố đông chật chội.',
  },
]

interface Recipe {
  tagPrefix: string
  ratio: number // tỉ lệ char nội dung lấy từ bài thư viện (1 = sao chép; 0 = đời thường)
  everydayIndex: number // chỉ dùng khi ratio = 0
  status: SubmissionStatus
}

// 10 recipe: 3 COPY · 2 HIGH · 2 MEDIUM · 3 ORIGINAL, + SELF.
const RECIPES: Recipe[] = [
  { tagPrefix: '', ratio: 1.0, everydayIndex: -1, status: 'UNDER_REVIEW' },
  { tagPrefix: '', ratio: 1.0, everydayIndex: -1, status: 'ACCEPTED' },
  { tagPrefix: '', ratio: 1.0, everydayIndex: -1, status: 'NEW' },
  { tagPrefix: '[Trích dẫn] ', ratio: 0.55, everydayIndex: -1, status: 'UNDER_REVIEW' },
  { tagPrefix: '[Trích dẫn] ', ratio: 0.45, everydayIndex: -1, status: 'NEW' },
  { tagPrefix: '[Tham khảo] ', ratio: 0.3, everydayIndex: -1, status: 'NEW' },
  { tagPrefix: '[Tham khảo] ', ratio: 0.22, everydayIndex: -1, status: 'ACCEPTED' },
  { tagPrefix: '', ratio: 0.0, everydayIndex: 0, status: 'UNDER_REVIEW' },
  { tagPrefix: '', ratio: 0.0, everydayIndex: 1, status: 'NEW' },
  { tagPrefix: '', ratio: 0.0, everydayIndex: 2, status: 'ACCEPTED' },
]

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Phụ lục số liệu DUY NHẤT theo mã bài: gần như toàn mã + số → off-corpus, không trùng
 * bài demo khác → chỉ "pha loãng" phần sao chép chứ không tự tạo match giả.
 */
function uniqueAppendix(code: string, minLen: number): string {
  let out = ''
  let n = 1
  while (out.length < minLen) {
    out += `Bảng ${code} ${n}: ${code}A${n} ${code}B${n} ${1000 + n} ${2000 + n} ${3000 + n} ${4000 + n}. `
    n++
  }
  return out
}

interface DemoSpec {
  code: string
  title: string
  abstractVn: string
  keywords: string[]
  status: SubmissionStatus
  authorId: string
}

async function main(): Promise<void> {
  console.log('🌱 Seed dữ liệu demo kiểm tra đạo văn (phái sinh từ kho thư viện)...')

  const removed = await prisma.submission.deleteMany({ where: { code: { startsWith: DEMO_PREFIX } } })
  if (removed.count > 0) console.log(`   🧹 Đã xóa ${removed.count} bài demo cũ (kèm báo cáo).`)

  const authors = await prisma.user.findMany({
    where: { role: { in: ['AUTHOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] } },
    select: { id: true },
    take: 6,
  })
  if (authors.length === 0) {
    console.error('❌ Không tìm thấy user nào. Hãy chạy seed chính trước.')
    process.exit(1)
  }
  const checker = await prisma.user.findFirst({
    where: { role: { in: ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'] } },
    select: { id: true },
  })
  console.log(`   Dùng ${authors.length} tác giả demo; người kiểm tra: ${checker?.id ?? '(hệ thống)'}`)

  const needSources = RECIPES.filter((r) => r.ratio > 0).length
  const sources = (
    await prisma.journalArticle.findMany({
      where: { status: 'PUBLISHED', contentText: { not: null } },
      select: { id: true, title: true, contentText: true },
      orderBy: { createdAt: 'asc' },
      take: 40,
    })
  ).filter((a) => normalizeSpace(a.contentText ?? '').length > 1800)

  if (sources.length < needSources) {
    console.error(`❌ Kho thư viện chỉ có ${sources.length} bài đủ dài (<${needSources}). Chạy journal:import-corpus trước.`)
    process.exit(1)
  }
  console.log(`   Có ${sources.length} bài thư viện làm nguồn phái sinh.`)

  const specs: DemoSpec[] = []
  let seq = 0
  let srcIdx = 0
  const nextCode = () => `${DEMO_PREFIX}${String(++seq).padStart(3, '0')}`

  RECIPES.forEach((recipe, i) => {
    const author = authors[i % authors.length]
    const code = nextCode()

    if (recipe.ratio === 0) {
      const e = EVERYDAY[recipe.everydayIndex]
      specs.push({ code, title: e.title, abstractVn: e.text, keywords: ['chủ đề đời thường', 'demo nguyên gốc'], status: recipe.status, authorId: author.id })
      return
    }

    const src = sources[srcIdx++]
    const body = normalizeSpace(src.contentText ?? '')
    const srcPart = body.slice(0, Math.round(recipe.ratio * TARGET_LEN))
    const abstractVn =
      recipe.ratio >= 0.99 ? srcPart : `${srcPart} ${uniqueAppendix(code, TARGET_LEN - srcPart.length)}`
    specs.push({
      code,
      title: `${recipe.tagPrefix}${src.title}`.slice(0, 240),
      abstractVn,
      keywords: ['nghệ thuật quân sự', 'demo trùng lặp'],
      status: recipe.status,
      authorId: author.id,
    })
  })

  // Cặp "tự đạo văn": cùng tác giả authors[0] (= tác giả COPY 1), trùng nội dung sources[0].
  specs.push({
    code: `${DEMO_PREFIX}SELF`,
    title: `[Tự đạo văn] ${sources[0].title}`.slice(0, 240),
    abstractVn: normalizeSpace(sources[0].contentText ?? '').slice(0, TARGET_LEN),
    keywords: ['demo tự đạo văn', 'cùng tác giả'],
    status: 'UNDER_REVIEW',
    authorId: authors[0].id,
  })

  for (const spec of specs) {
    await prisma.submission.create({
      data: {
        code: spec.code,
        title: spec.title,
        abstractVn: spec.abstractVn,
        keywords: spec.keywords,
        status: spec.status,
        securityLevel: 'PUBLIC',
        createdBy: spec.authorId,
      },
    })
    console.log(`   ✅ Tạo bài: ${spec.code} — ${spec.title.slice(0, 56)}…`)
  }
  console.log(`📊 Đã tạo ${specs.length} bài nộp demo.`)

  const demoSubs = await prisma.submission.findMany({
    where: { code: { startsWith: DEMO_PREFIX } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  })
  const buckets = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const sub of demoSubs) {
    try {
      const result = await checkSubmissionPlagiarism(sub.id, 'cosine')
      await savePlagiarismReport(sub.id, result, checker?.id)
      if (result.score >= 70) buckets.critical++
      else if (result.score >= 40) buckets.high++
      else if (result.score >= 20) buckets.medium++
      else buckets.low++
      console.log(`   🔎 ${sub.code}: ${result.score}% (độc đáo ${result.originalityScore}%) · ${result.matches.length} nguồn / ${result.totalCompared} bản ghi`)
    } catch (err) {
      console.error(`   ⚠ Lỗi kiểm tra ${sub.code}:`, err instanceof Error ? err.message : String(err))
    }
  }

  console.log(`\n📊 Phân bố mức: Rất cao=${buckets.critical} · Cao=${buckets.high} · Trung bình=${buckets.medium} · Thấp=${buckets.low}`)
  console.log('✨ Seed demo kiểm tra đạo văn hoàn tất!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
