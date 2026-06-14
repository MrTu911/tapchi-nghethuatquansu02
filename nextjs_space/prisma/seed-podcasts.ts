/**
 * seed-podcasts.ts — Tapchi-HCQS
 *
 * Copy file âm thanh và ảnh bìa từ Downloads → public/uploads/podcasts/
 * Sau đó insert bản ghi Podcast vào DB.
 *
 * Idempotent — xóa Podcast cũ rồi tạo lại
 * Run: npx tsx --require dotenv/config prisma/seed-podcasts.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const db = new PrismaClient()

const DOWNLOADS = '/home/kelinton/Downloads'
const PROJECT_ROOT = path.join(__dirname, '..')
const AUDIO_DEST = path.join(PROJECT_ROOT, 'public', 'uploads', 'podcasts', 'audio')
const COVER_DEST = path.join(PROJECT_ROOT, 'public', 'uploads', 'podcasts', 'covers')

const AUTHOR_ADMIN = '7557426a-ff70-4f9f-9d09-d609fbd59df5'

// ── Danh sách ảnh bìa Gemini AI-generated ────────────────────────────────────
const COVER_FILES = [
  'Gemini_Generated_Image_3t7dkp3t7dkp3t7d.png',
  'Gemini_Generated_Image_79hte879hte879ht.png',
  'Gemini_Generated_Image_87pxy287pxy287px.png',
  'Gemini_Generated_Image_8vm7fh8vm7fh8vm7.png',
  'Gemini_Generated_Image_a2thzia2thzia2th.png',
  'Gemini_Generated_Image_ab7kqdab7kqdab7k.png',
  'Gemini_Generated_Image_ej0yhoej0yhoej0y.png',
  'Gemini_Generated_Image_fzjvqxfzjvqxfzjv.png',
  'Gemini_Generated_Image_mn92m6mn92m6mn92.png',
]

// ── Dữ liệu từng tập podcast ─────────────────────────────────────────────────
interface PodcastDef {
  audioFile: string
  title: string
  description: string
  host: string
  category: string
  tags: string[]
  episodeNumber: number
  seasonNumber: number
  coverIndex: number     // index vào COVER_FILES[]
  durationEstimate: number  // seconds (ước tính từ kích thước file)
  isFeatured: boolean
}

const PODCAST_DATA: PodcastDef[] = [
  // ── Season 1: Hậu cần & Chiến tranh hiện đại ───────────────────────────────
  {
    audioFile: 'Bộ_não_hậu_cần_quân_đội.m4a',
    title: 'Bộ não hậu cần quân đội',
    description: 'Khám phá hệ thống tư duy và ra quyết định trong công tác hậu cần quân sự hiện đại. Làm thế nào các sĩ quan hậu cần phân tích tình huống, dự báo nhu cầu và điều phối nguồn lực trong thời gian thực?',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['hậu cần', 'quân sự', 'tư duy chiến lược'],
    episodeNumber: 1,
    seasonNumber: 1,
    coverIndex: 0,
    durationEstimate: 1800,
    isFeatured: true,
  },
  {
    audioFile: 'Hậu_cần_và_mạch_máu_chiến_tranh.m4a',
    title: 'Hậu cần và mạch máu chiến tranh',
    description: 'Hậu cần là "mạch máu" của mọi chiến dịch quân sự. Tập podcast này phân tích vai trò sống còn của hệ thống hậu cần trong các cuộc xung đột lịch sử và hiện đại, từ Thế chiến II đến các chiến trường kỹ thuật số ngày nay.',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['hậu cần', 'chiến tranh', 'lịch sử quân sự'],
    episodeNumber: 2,
    seasonNumber: 1,
    coverIndex: 1,
    durationEstimate: 2100,
    isFeatured: true,
  },
  {
    audioFile: 'Hậu_cần_trong_môi_trường_tranh_chấp.m4a',
    title: 'Hậu cần trong môi trường tranh chấp',
    description: 'Duy trì chuỗi cung ứng và đảm bảo hậu cần trong môi trường chiến tranh hiện đại đặt ra những thách thức chưa từng có. Tập podcast phân tích các giải pháp đổi mới để bảo vệ tuyến hậu cần trước các mối đe dọa phi đối xứng.',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['hậu cần', 'tranh chấp', 'an ninh'],
    episodeNumber: 3,
    seasonNumber: 1,
    coverIndex: 2,
    durationEstimate: 2200,
    isFeatured: false,
  },
  {
    audioFile: 'Hậu_cần_cơ_giới_biết_tàng_hình.m4a',
    title: 'Hậu cần cơ giới biết tàng hình',
    description: 'Công nghệ tàng hình không chỉ dành cho máy bay chiến đấu. Tìm hiểu cách các phương tiện hậu cần cơ giới đang ứng dụng công nghệ giảm thiểu dấu vết nhiệt và radar để hoạt động an toàn trên chiến trường hiện đại.',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['cơ giới', 'tàng hình', 'công nghệ'],
    episodeNumber: 4,
    seasonNumber: 1,
    coverIndex: 3,
    durationEstimate: 1750,
    isFeatured: false,
  },
  {
    audioFile: 'Hậu_cần_kỹ_thuật_Việt_Nam_2040.m4a',
    title: 'Hậu cần kỹ thuật Việt Nam 2040',
    description: 'Tầm nhìn chiến lược về hệ thống hậu cần kỹ thuật quân sự Việt Nam đến năm 2040. Phân tích lộ trình hiện đại hóa, chuyển đổi số và xây dựng năng lực tự chủ trong sản xuất trang bị, khí tài.',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['hậu cần kỹ thuật', 'Việt Nam', '2040', 'hiện đại hóa'],
    episodeNumber: 5,
    seasonNumber: 1,
    coverIndex: 4,
    durationEstimate: 1800,
    isFeatured: true,
  },
  {
    audioFile: 'Mệnh_lệnh_sinh_tử_dưới_nửa_giây.m4a',
    title: 'Mệnh lệnh sinh tử dưới nửa giây',
    description: 'Trong chiến tranh hiện đại, khoảng cách giữa sống và chết đo bằng mili giây. Tập podcast phân tích hệ thống ra quyết định tốc độ cao, từ phản xạ của con người đến AI hỗ trợ ra lệnh trong tình huống khẩn cấp.',
    host: 'Học viện Quốc phòng',
    category: 'Hậu cần quân sự',
    tags: ['quyết định', 'tốc độ', 'chiến thuật'],
    episodeNumber: 6,
    seasonNumber: 1,
    coverIndex: 5,
    durationEstimate: 1750,
    isFeatured: false,
  },

  // ── Season 2: AI & Drone trong quân sự ────────────────────────────────────
  {
    audioFile: 'AI_hay_xe_đạp_thồ.m4a',
    title: 'AI hay xe đạp thồ: Cuộc tranh luận về hậu cần',
    description: 'Một cuộc tranh luận thú vị: liệu AI và robot hóa có thực sự vượt trội so với các phương pháp hậu cần truyền thống trong mọi điều kiện địa lý và tác chiến? Phân tích điểm mạnh, điểm yếu của mỗi phương pháp.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['AI', 'hậu cần', 'tranh luận', 'công nghệ'],
    episodeNumber: 1,
    seasonNumber: 2,
    coverIndex: 6,
    durationEstimate: 1900,
    isFeatured: true,
  },
  {
    audioFile: 'AI_dự_báo_và_diễn_tập_số.m4a',
    title: 'AI dự báo và diễn tập số',
    description: 'Trí tuệ nhân tạo đang cách mạng hóa cách quân đội lên kế hoạch và diễn tập. Khám phá ứng dụng AI trong mô phỏng chiến trường, dự báo nhu cầu hậu cần và tối ưu hóa các phương án tác chiến trước khi thực chiến.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['AI', 'dự báo', 'diễn tập số', 'mô phỏng'],
    episodeNumber: 2,
    seasonNumber: 2,
    coverIndex: 7,
    durationEstimate: 1800,
    isFeatured: false,
  },
  {
    audioFile: 'AI_chiếm_lĩnh_ghế_lái_tiêm_kích.m4a',
    title: 'AI chiếm lĩnh ghế lái tiêm kích',
    description: 'AI pilot không còn là khoa học viễn tưởng. Phân tích tiến bộ trong hệ thống điều khiển bay tự động, từ hỗ trợ phi công đến máy bay chiến đấu không người lái thế hệ mới và những tác động đến học thuyết tác chiến đường không.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['AI', 'tiêm kích', 'tự động hóa', 'không quân'],
    episodeNumber: 3,
    seasonNumber: 2,
    coverIndex: 8,
    durationEstimate: 1050,
    isFeatured: false,
  },
  {
    audioFile: 'AI_bóc_trần_bí_mật_quốc_gia.m4a',
    title: 'AI bóc trần bí mật quốc gia',
    description: 'AI phân tích dữ liệu nguồn mở — hình ảnh vệ tinh, mạng xã hội, bản tin tài chính — để suy luận thông tin tình báo nhạy cảm mà trước đây cần hàng chục điệp viên. Đây là thách thức an ninh quốc gia chưa có tiền lệ.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['AI', 'tình báo', 'an ninh quốc gia', 'OSINT'],
    episodeNumber: 4,
    seasonNumber: 2,
    coverIndex: 0,
    durationEstimate: 1900,
    isFeatured: true,
  },
  {
    audioFile: 'Khi_Gemini_3_Pro_thành_vũ_khí.m4a',
    title: 'Khi Gemini 3 Pro thành vũ khí',
    description: 'Các mô hình ngôn ngữ lớn đang được thử nghiệm trong ứng dụng quân sự: từ lập kế hoạch tác chiến, phân tích tình báo đến tác chiến tâm lý. Tập podcast đặt câu hỏi về ranh giới đạo đức và pháp lý khi AI trở thành công cụ tác chiến.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['Gemini', 'AI', 'vũ khí', 'đạo đức'],
    episodeNumber: 5,
    seasonNumber: 2,
    coverIndex: 1,
    durationEstimate: 1350,
    isFeatured: false,
  },
  {
    audioFile: 'Drone_và_AI_thay_đổi_chiến_trường.m4a',
    title: 'Drone và AI thay đổi chiến trường',
    description: 'Sự kết hợp giữa drone tự sát, bầy drone và AI điều phối đang tái định nghĩa chiến tranh hiện đại. Phân tích các bài học từ xung đột Ukraine, Nagorno-Karabakh và dự báo cách chiến trường sẽ thay đổi trong thập kỷ tới.',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['drone', 'AI', 'chiến trường', 'tự sát'],
    episodeNumber: 6,
    seasonNumber: 2,
    coverIndex: 2,
    durationEstimate: 2400,
    isFeatured: true,
  },
  {
    audioFile: 'Drone_biến_hậu_phương_thành_tử_địa.m4a',
    title: 'Drone biến hậu phương thành tử địa',
    description: 'Drone tầm xa đang xóa nhòa ranh giới giữa tiền tuyến và hậu phương. Kho tàng, cơ sở hạ tầng, chuỗi cung ứng hậu cần — tất cả đều trở thành mục tiêu. Làm thế nào để bảo vệ hậu cần trong kỷ nguyên drone phổ biến?',
    host: 'Học viện Quốc phòng',
    category: 'AI & Công nghệ',
    tags: ['drone', 'hậu phương', 'phòng thủ', 'hậu cần'],
    episodeNumber: 7,
    seasonNumber: 2,
    coverIndex: 3,
    durationEstimate: 2200,
    isFeatured: false,
  },

  // ── Season 3: Khoa học ứng dụng & Sáng tạo ────────────────────────────────
  {
    audioFile: 'Biến_cơm_thừa_thành_nước_lợi_khuẩn.m4a',
    title: 'Biến cơm thừa thành nước lợi khuẩn',
    description: 'Nghiên cứu sáng tạo từ Học viện Quốc phòng: quy trình tận dụng thực phẩm dư thừa trong bếp ăn tập thể để sản xuất nước uống lợi khuẩn có giá trị dinh dưỡng cao. Giải pháp vừa giảm lãng phí, vừa tăng cường sức khỏe quân nhân.',
    host: 'Học viện Quốc phòng',
    category: 'Khoa học ứng dụng',
    tags: ['lợi khuẩn', 'thực phẩm', 'sáng tạo', 'dinh dưỡng'],
    episodeNumber: 1,
    seasonNumber: 3,
    coverIndex: 4,
    durationEstimate: 2300,
    isFeatured: false,
  },
  {
    audioFile: 'Biến_mỡ_cống_thành_cồn_khô.m4a',
    title: 'Biến mỡ cống thành cồn khô',
    description: 'Đề tài nghiên cứu táo bạo: chuyển hóa chất thải dầu mỡ từ bếp ăn quân đội thành cồn khô dùng cho nấu ăn dã chiến và sưởi ấm. Giải pháp bền vững vừa giải quyết vấn đề xử lý chất thải, vừa tạo ra nguồn năng lượng độc lập.',
    host: 'Học viện Quốc phòng',
    category: 'Khoa học ứng dụng',
    tags: ['cồn khô', 'chất thải', 'năng lượng', 'dã chiến'],
    episodeNumber: 2,
    seasonNumber: 3,
    coverIndex: 5,
    durationEstimate: 1950,
    isFeatured: false,
  },
  {
    audioFile: 'Bí_mật_sau_tấm_trần_tòa_nhà.m4a',
    title: 'Bí mật sau tấm trần tòa nhà',
    description: 'Vật liệu xây dựng thông minh ẩn sau những tấm trần giả thông thường. Khám phá công nghệ tích hợp cảm biến, hệ thống điều hòa không khí chủ động và lớp cách âm đặc biệt trong các công trình quân sự hiện đại.',
    host: 'Học viện Quốc phòng',
    category: 'Khoa học ứng dụng',
    tags: ['vật liệu', 'xây dựng', 'công nghệ', 'quân sự'],
    episodeNumber: 3,
    seasonNumber: 3,
    coverIndex: 6,
    durationEstimate: 1650,
    isFeatured: false,
  },
  {
    audioFile: 'Kiến_trúc_xanh_là_thực_thể_sống.m4a',
    title: 'Kiến trúc xanh là thực thể sống',
    description: 'Triết học thiết kế kiến trúc xanh — không chỉ là tòa nhà tiết kiệm năng lượng mà là "thực thể sống" tự điều chỉnh, tương tác với môi trường. Ứng dụng trong thiết kế doanh trại, kho tàng và cơ sở hạ tầng hậu cần bền vững.',
    host: 'Học viện Quốc phòng',
    category: 'Khoa học ứng dụng',
    tags: ['kiến trúc xanh', 'bền vững', 'môi trường', 'doanh trại'],
    episodeNumber: 4,
    seasonNumber: 3,
    coverIndex: 7,
    durationEstimate: 1950,
    isFeatured: false,
  },
  {
    audioFile: 'Thịt_enzyme_và_số_hóa_hậu_cần.m4a',
    title: 'Thịt enzyme và số hóa hậu cần',
    description: 'Protein tổng hợp từ enzyme, thịt nuôi cấy tế bào và số hóa toàn bộ chuỗi cung ứng thực phẩm quân sự. Cuộc cách mạng trong đảm bảo ăn uống cho quân đội trong tương lai — không cần kho lạnh, không cần chuỗi vận chuyển phức tạp.',
    host: 'Học viện Quốc phòng',
    category: 'Khoa học ứng dụng',
    tags: ['thực phẩm', 'enzyme', 'số hóa', 'tương lai'],
    episodeNumber: 5,
    seasonNumber: 3,
    coverIndex: 8,
    durationEstimate: 110,
    isFeatured: false,
  },

  // ── Season 4: Góc nhìn quốc tế ────────────────────────────────────────────
  {
    audioFile: 'How_Logistics_Staff_Work_Engineers_Military_Survival.m4a',
    title: 'How Logistics Staff Work: Engineers & Military Survival',
    description: 'An international perspective on how logistics officers and military engineers collaborate under extreme pressure. From field repairs to supply chain management in hostile environments — real stories from logistics professionals worldwide.',
    host: 'Học viện Quốc phòng',
    category: 'Quốc tế',
    tags: ['international', 'logistics', 'engineers', 'survival'],
    episodeNumber: 1,
    seasonNumber: 4,
    coverIndex: 0,
    durationEstimate: 2300,
    isFeatured: false,
  },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function sanitizeName(name: string): string {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-._]/g, '')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

function copyFileSafe(src: string, destDir: string, destName: string): string | null {
  const dest = path.join(destDir, destName)
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠  File không tồn tại: ${src}`)
    return null
  }
  if (fs.existsSync(dest)) {
    console.log(`  ↩  Đã có sẵn: ${destName}`)
    return dest
  }
  fs.copyFileSync(src, dest)
  return dest
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎙️  seed-podcasts.ts — bắt đầu seed dữ liệu podcast...\n')

  // Đảm bảo thư mục upload tồn tại
  fs.mkdirSync(AUDIO_DEST, { recursive: true })
  fs.mkdirSync(COVER_DEST, { recursive: true })

  // ── Bước 1: Copy ảnh bìa ─────────────────────────────────────────────────
  console.log('📸 Copy ảnh bìa...')
  const coverUrlMap: Record<string, string> = {}
  for (const coverFile of COVER_FILES) {
    const src = path.join(DOWNLOADS, coverFile)
    const destName = `seed-cover-${sanitizeName(coverFile)}`
    const dest = copyFileSafe(src, COVER_DEST, destName)
    if (dest) {
      coverUrlMap[coverFile] = `/uploads/podcasts/covers/${destName}`
      console.log(`  ✅ ${coverFile} → ${destName}`)
    }
  }

  // ── Bước 2: Xóa podcast cũ ───────────────────────────────────────────────
  console.log('\n🗑  Xóa dữ liệu podcast cũ trong DB...')
  const deleted = await db.podcast.deleteMany({})
  console.log(`  Đã xóa ${deleted.count} bản ghi`)

  // ── Bước 3: Copy audio + insert DB ───────────────────────────────────────
  console.log('\n🎵 Copy audio và tạo bản ghi DB...')
  let successCount = 0
  let skipCount = 0

  const now = new Date()

  for (let i = 0; i < PODCAST_DATA.length; i++) {
    const pod = PODCAST_DATA[i]
    const srcAudio = path.join(DOWNLOADS, pod.audioFile)

    if (!fs.existsSync(srcAudio)) {
      console.warn(`  ⚠  Bỏ qua (không tìm thấy file): ${pod.audioFile}`)
      skipCount++
      continue
    }

    // Tạo tên file an toàn
    const ext = path.extname(pod.audioFile)
    const baseName = path.basename(pod.audioFile, ext)
    const safeAudioName = `seed-${Date.now() + i}-${sanitizeName(baseName)}${ext}`

    // Copy audio
    const audioDest = copyFileSafe(srcAudio, AUDIO_DEST, safeAudioName)
    if (!audioDest) { skipCount++; continue }

    const audioPath = `podcasts/audio/${safeAudioName}`
    const audioUrl = `/uploads/${audioPath}`
    const fileSize = fs.statSync(audioDest).size

    // Chọn ảnh bìa
    const coverFile = COVER_FILES[pod.coverIndex % COVER_FILES.length]
    const coverUrl = coverUrlMap[coverFile] || null
    const coverPath = coverUrl ? coverUrl.replace('/uploads/', '') : null

    // Ngày phát hành: rải đều trong 6 tháng qua
    const daysAgo = Math.floor((PODCAST_DATA.length - i) * 10)
    const publishedAt = new Date(now)
    publishedAt.setDate(publishedAt.getDate() - daysAgo)

    await db.podcast.create({
      data: {
        title: pod.title,
        description: pod.description,
        audioPath,
        audioUrl,
        duration: pod.durationEstimate,
        fileSize,
        mimeType: 'audio/mp4',
        coverImagePath: coverPath,
        coverImageUrl: coverUrl,
        host: pod.host,
        episodeNumber: pod.episodeNumber,
        seasonNumber: pod.seasonNumber,
        category: pod.category,
        tags: pod.tags,
        isFeatured: pod.isFeatured,
        isActive: true,
        displayOrder: i,
        plays: Math.floor(Math.random() * 800) + 50,
        publishedAt,
        createdBy: AUTHOR_ADMIN,
      },
    })

    console.log(`  ✅ S${pod.seasonNumber}E${pod.episodeNumber} — ${pod.title}`)
    successCount++
  }

  console.log(`\n🎉 Hoàn thành! Đã tạo ${successCount} tập podcast, bỏ qua ${skipCount}.`)
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1) })
  .finally(() => db.$disconnect())
