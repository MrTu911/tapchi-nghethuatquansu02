/**
 * separate-special-issue-volumes.ts
 *
 * Chuyển các "Số đặc biệt" sang một Volume RIÊNG theo năm và đặt lại `number` = thứ tự
 * thật (1, 4...) thay cho cách đánh số tạm `90 + N` (gây hiển thị "Số 94/91" xấu).
 *
 * Vì sao tách volume: unique [volumeId, number] không cho Số đặc biệt dùng number 1/4
 * khi đang chung volume với số thường (Số 1, Số 4). Tách volume → number thật, sạch.
 *
 * Idempotent: upsert volume đặc biệt theo volumeNo (= 900000 + năm); nhận diện số đặc
 * biệt theo title chứa "đặc biệt". Run:
 *   npx tsx --require dotenv/config scripts/journal/separate-special-issue-volumes.ts
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'

const SPECIAL_VOLUME_BASE = 900000 // volumeNo số đặc biệt = SPECIAL_VOLUME_BASE + năm
const JOURNAL_ISSN = '1859-0454'

function specialVolumeNo(year: number): number {
  return SPECIAL_VOLUME_BASE + year
}

function parseSpecialOrdinal(title: string): number | null {
  const m = title.match(/đặc\s*biệt\s*0*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

async function main(): Promise<void> {
  const specials = await prisma.issue.findMany({
    where: { title: { contains: 'đặc biệt' } },
    select: { id: true, slug: true, title: true, year: true, number: true },
  })

  if (specials.length === 0) {
    console.log('Không có số đặc biệt nào để xử lý.')
    return
  }

  let moved = 0
  for (const issue of specials) {
    const ordinal = parseSpecialOrdinal(issue.title ?? '')
    if (ordinal == null) {
      console.log(`  ⚠ Không đọc được thứ tự đặc biệt từ "${issue.title}" — bỏ qua ${issue.slug}`)
      continue
    }

    // Upsert volume đặc biệt của năm tương ứng.
    const volNo = specialVolumeNo(issue.year)
    const volume = await prisma.volume.upsert({
      where: { volumeNo: volNo },
      create: {
        volumeNo: volNo,
        year: issue.year,
        title: `Số đặc biệt — Năm ${issue.year}`,
        issn: JOURNAL_ISSN,
      },
      update: { title: `Số đặc biệt — Năm ${issue.year}`, issn: JOURNAL_ISSN },
    })

    await prisma.issue.update({
      where: { id: issue.id },
      data: { volumeId: volume.id, number: ordinal },
    })
    moved++
    console.log(`  ✓ ${issue.slug}: number ${issue.number} → ${ordinal}, chuyển sang volume "${volume.title}" (volumeNo ${volNo})`)
  }

  console.log(`\n✅ Đã chuẩn hóa ${moved}/${specials.length} số đặc biệt.`)
}

main()
  .catch((error) => {
    console.error('❌ Lỗi chuẩn hóa số đặc biệt:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
