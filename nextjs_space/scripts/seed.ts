
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Chế độ NỀN (foundation-only): chỉ tạo chuyên mục + tài khoản chính thức +
// reviewer profile + khung Volume/Issue, BỎ QUA khối bài/submission/audit mẫu.
// Dùng cho cài đặt "tối thiểu/sạch" (seed-full.ts --mode=minimal).
// Mặc định KHÔNG bật → giữ nguyên hành vi cũ cho `prisma db seed`.
const MINIMAL = process.argv.includes('--minimal') || process.env.SEED_MINIMAL === '1'

// 9 chuyên mục chính thức của Tạp chí Nghệ thuật Quân sự Việt Nam
const CATEGORIES = [
  {
    code: "CLQS",
    name: "Chiến lược quân sự",
    description: "Nghiên cứu tầm chiến lược, quốc phòng quốc gia, bảo vệ Tổ quốc trong tình hình mới"
  },
  {
    code: "NTTC",
    name: "Nghệ thuật tác chiến",
    description: "Lý luận và thực tiễn về nghệ thuật tác chiến, phương thức, thủ đoạn tác chiến"
  },
  {
    code: "CDH",
    name: "Chiến dịch học",
    description: "Nghiên cứu lý luận và thực tiễn chiến dịch, nghệ thuật chiến dịch"
  },
  {
    code: "CTH",
    name: "Chiến thuật học",
    description: "Chiến thuật cấp chiến đấu, phương pháp tổ chức và chỉ huy tác chiến"
  },
  {
    code: "LSQS",
    name: "Lịch sử quân sự",
    description: "Lịch sử chiến tranh, truyền thống anh hùng của Quân đội nhân dân Việt Nam"
  },
  {
    code: "KHQS",
    name: "Khoa học quân sự",
    description: "Nghiên cứu lý luận quân sự tổng hợp, khoa học và công nghệ quân sự"
  },
  {
    code: "GDQS",
    name: "Giáo dục quân sự",
    description: "Đào tạo cán bộ quân sự, học thuật quốc phòng, giáo dục quốc phòng và an ninh"
  },
  {
    code: "HTQP",
    name: "Hợp tác quốc phòng",
    description: "Quan hệ đối ngoại quốc phòng, hợp tác an ninh khu vực và quốc tế"
  },
  {
    code: "TINTUC",
    name: "Tin tức Học viện",
    description: "Hoạt động nghiên cứu khoa học, đào tạo và các sự kiện của Học viện Quốc phòng"
  }
]

// Official user accounts - Tài khoản chính thức
const USERS = [
  // Main official accounts - Tài khoản chính
  {
    email: "admin@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Quản trị viên hệ thống",
    org: "Học viện Quốc phòng",
    role: "SYSADMIN"
  },
  {
    email: "tongbientap@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Tổng Biên Tập",
    org: "Học viện Quốc phòng",
    role: "EIC"
  },
  {
    email: "bientapchinh@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Biên Tập Chính",
    org: "Học viện Quốc phòng",
    role: "MANAGING_EDITOR"
  },
  {
    email: "bientap@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Biên Tập Chuyên Mục",
    org: "Học viện Quốc phòng",
    role: "SECTION_EDITOR"
  },
  {
    email: "tacgia@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Tác giả",
    org: "Học viện Quốc phòng",
    role: "AUTHOR"
  },
  {
    email: "phanbien@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Phản biện viên",
    org: "Đại học Quốc phòng",
    role: "REVIEWER"
  },
  // Additional test accounts for full workflow - Tài khoản phụ để test đầy đủ
  {
    email: "tacgia2@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Tác giả 2",
    org: "Quân khu 1",
    role: "AUTHOR"
  },
  {
    email: "phanbien2@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Phản biện viên 2",
    org: "Học viện Lục quân",
    role: "REVIEWER"
  },
  {
    email: "dangtrang@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Biên tập dàn trang",
    org: "Học viện Quốc phòng",
    role: "LAYOUT_EDITOR"
  },
  {
    email: "docgia@tapchintqsvn.edu.vn",
    password: "TapChi@2025",
    fullName: "Độc giả",
    org: "Quân khu 2",
    role: "READER"
  }
]

async function createSlug(name: string): Promise<string> {
  // Comprehensive Vietnamese to ASCII conversion
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  }

  let result = name.toLowerCase()
  
  // Replace Vietnamese characters
  for (const [viet, ascii] of Object.entries(vietnameseMap)) {
    result = result.replace(new RegExp(viet.toLowerCase(), 'g'), ascii.toLowerCase())
  }

  // Clean up
  result = result
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')      // Trim hyphens from start and end

  return result
}

async function main() {
  console.log('🌱 Bắt đầu seed database...')

  // 1. Seed 9 chuyên mục NTQS
  console.log('📚 Seed 9 chuyên mục NTQS...')
  for (const cat of CATEGORIES) {
    const slug = await createSlug(cat.name)
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        slug,
        description: cat.description
      },
      create: {
        code: cat.code,
        name: cat.name,
        slug,
        description: cat.description
      }
    })
  }

  // 2. Seed users
  console.log('👥 Seed users...')
  const createdUsers: any[] = []
  
  // Admin roles that should be auto-approved
  const ADMIN_ROLES = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR']
  
  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    const isAdminRole = ADMIN_ROLES.includes(user.role)
    
    // Admin accounts: Auto-approved, active, email verified
    // Other accounts: Pending approval (normal workflow)
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        org: user.org,
        role: user.role as any,
        passwordHash: hashedPassword,
        // Update approval status for admin accounts
        ...(isAdminRole && {
          status: 'APPROVED',
          isActive: true,
          emailVerified: true,
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_SEED'
        })
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role as any,
        passwordHash: hashedPassword,
        // Set approval status based on role
        status: isAdminRole ? 'APPROVED' : 'PENDING',
        isActive: isAdminRole,
        emailVerified: isAdminRole,
        ...(isAdminRole && {
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_SEED'
        })
      }
    })
    
    console.log(`  ✅ ${isAdminRole ? '[AUTO-APPROVED]' : '[PENDING]'} ${user.email} (${user.role})`)
    createdUsers.push(createdUser)
  }

  // 2.5. Create Reviewer Profiles with expertise and keywords
  console.log('👨‍🔬 Creating Reviewer Profiles...')
  const reviewers = createdUsers.filter(u => u.role === 'REVIEWER')
  
  const reviewerExpertise = [
    {
      expertise: ['Nghệ thuật quân sự', 'Chiến thuật học', 'Chiến dịch học'],
      keywords: ['nghệ thuật quân sự', 'chiến thuật', 'chiến dịch', 'tác chiến', 'chỉ huy']
    },
    {
      expertise: ['Chiến lược quốc phòng', 'Lịch sử quân sự'],
      keywords: ['chiến lược', 'quốc phòng', 'lịch sử quân sự', 'bảo vệ Tổ quốc', 'chiến tranh']
    },
    {
      expertise: ['Công nghệ thông tin', 'AI', 'Tự động hóa'],
      keywords: ['AI', 'machine learning', 'automation', 'công nghệ', 'thông tin']
    }
  ]
  
  for (let i = 0; i < reviewers.length && i < reviewerExpertise.length; i++) {
    const reviewer = reviewers[i]
    const expertise = reviewerExpertise[i]
    
    await prisma.reviewerProfile.upsert({
      where: { userId: reviewer.id },
      update: {
        expertise: expertise.expertise,
        keywords: expertise.keywords,
        maxConcurrentReviews: 5,
        isAvailable: true
      },
      create: {
        userId: reviewer.id,
        expertise: expertise.expertise,
        keywords: expertise.keywords,
        totalReviews: Math.floor(Math.random() * 10) + 5,
        completedReviews: Math.floor(Math.random() * 8) + 3,
        declinedReviews: Math.floor(Math.random() * 2),
        avgCompletionDays: Math.random() * 10 + 5,
        averageRating: Math.random() * 1.5 + 3.5,
        maxConcurrentReviews: 5,
        isAvailable: true,
        lastReviewAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    })
  }
  
  console.log(`✅ Created ${Math.min(reviewers.length, reviewerExpertise.length)} reviewer profiles`)

  // 3. Seed Volumes and Issues
  console.log('📖 Seed Volumes and Issues...')
  
  // Create Volume 1
  const volume1 = await prisma.volume.upsert({
    where: { volumeNo: 1 },
    update: {},
    create: {
      volumeNo: 1,
      year: 2024,
      title: 'Tập 1 - Năm 2024',
      description: 'Tập đầu tiên của Tạp chí Nghệ thuật Quân sự Việt Nam năm 2024'
    }
  })

  // Create Issues for Volume 1
  const issue1 = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume1.id, number: 1 } },
    update: {
      publishDate: new Date('2024-06-01'),
      status: 'PUBLISHED'
    },
    create: {
      volumeId: volume1.id,
      number: 1, 
      year: 2024,
      title: 'Số 1 - Tháng 6/2024',
      publishDate: new Date('2024-06-01'),
      status: 'PUBLISHED'
    }
  })

  const issue2 = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume1.id, number: 2 } },
    update: {
      publishDate: new Date('2024-12-01'),
      status: 'PUBLISHED'
    },
    create: {
      volumeId: volume1.id,
      number: 2,
      year: 2024,
      title: 'Số 2 - Tháng 12/2024',
      publishDate: new Date('2024-12-01'),
      status: 'PUBLISHED'
    }
  })

  // 4. Lấy categories và authors để seed submissions & articles
  const categories = await prisma.category.findMany()
  const author = createdUsers.find(u => u.email === 'tacgia@tapchintqsvn.edu.vn')!
  const author2 = createdUsers.find(u => u.email === 'tacgia2@tapchintqsvn.edu.vn')!
  
  // Validation: Đảm bảo authors tồn tại
  if (!author || !author2) {
    throw new Error('❌ Không tìm thấy authors cần thiết cho seed process')
  }

  // Chế độ NỀN: dừng tại đây, không tạo dữ liệu bài/submission/audit demo.
  if (MINIMAL) {
    console.log('✅ Seed NỀN hoàn tất (minimal): chuyên mục + tài khoản + reviewer profile + khung số tạp chí.')
    console.log(`📚 ${categories.length} chuyên mục, 👥 ${createdUsers.length} người dùng, 📖 2 số tạp chí.`)
    return
  }

  // 5. Seed sample articles (15 bài phân bố đều 11 chuyên mục)
  console.log('📰 Seed sample articles...')
  const sampleArticles = [
    {
      title: "Nghệ thuật quân sự Việt Nam trong chiến tranh nhân dân bảo vệ Tổ quốc",
      abstractVn: "Bài viết phân tích những nét đặc sắc của nghệ thuật quân sự Việt Nam trong chiến tranh nhân dân, đề xuất các giải pháp kế thừa và phát triển phù hợp với điều kiện tác chiến hiện đại.",
      abstractEn: "This article analyzes the distinctive features of Vietnamese military arts in people's war, proposing solutions to inherit and develop them in modern combat conditions.",
      keywords: ["nghệ thuật quân sự", "chiến tranh nhân dân", "bảo vệ Tổ quốc"],
      categoryCode: "CLQS",
      issueId: issue1.id
    },
    {
      title: "Phương thức tác chiến phi đối xứng trong điều kiện chiến tranh hiện đại",
      abstractVn: "Nghiên cứu lý luận và thực tiễn về tác chiến phi đối xứng trong bối cảnh chiến tranh hiện đại, đặc biệt là ứng dụng công nghệ cao trong tác chiến.",
      abstractEn: "Research on theory and practice of asymmetric warfare in modern war context, especially the application of high technology in combat.",
      keywords: ["tác chiến phi đối xứng", "chiến tranh hiện đại", "công nghệ cao"],
      categoryCode: "NTTC",
      issueId: issue1.id
    },
    {
      title: "Nghệ thuật chiến dịch trong các cuộc chiến tranh giải phóng dân tộc",
      abstractVn: "Bài báo phân tích nghệ thuật chiến dịch trong các cuộc chiến tranh giải phóng của Việt Nam, rút ra bài học kinh nghiệm quý báu về tổ chức và chỉ huy tác chiến chiến dịch.",
      abstractEn: "The article analyzes campaign arts in Vietnam's liberation wars, drawing valuable lessons on organizing and commanding operational campaigns.",
      keywords: ["nghệ thuật chiến dịch", "giải phóng dân tộc", "tổ chức chỉ huy"],
      categoryCode: "CDH",
      issueId: issue1.id
    },
    {
      title: "Chiến thuật phòng ngự trong điều kiện địch có ưu thế về hỏa lực",
      abstractVn: "Nghiên cứu chiến thuật phòng ngự hiệu quả khi đối mặt với địch có ưu thế về hỏa lực, tổng kết kinh nghiệm từ các cuộc chiến tranh Việt Nam và bài học quốc tế.",
      abstractEn: "Study of effective defensive tactics when facing enemy with firepower superiority, synthesizing lessons from Vietnam wars and international experience.",
      keywords: ["chiến thuật phòng ngự", "hỏa lực", "kinh nghiệm tác chiến"],
      categoryCode: "CTH",
      issueId: issue1.id
    },
    {
      title: "Chiến thắng Điện Biên Phủ – Đỉnh cao của nghệ thuật quân sự Việt Nam",
      abstractVn: "Phân tích chiến thắng Điện Biên Phủ 1954 từ góc độ nghệ thuật quân sự, làm rõ tính sáng tạo độc đáo trong chỉ đạo chiến lược và điều hành tác chiến chiến dịch.",
      abstractEn: "Analysis of the 1954 Dien Bien Phu victory from the military art perspective, clarifying the unique creativity in strategic direction and operational command.",
      keywords: ["Điện Biên Phủ", "nghệ thuật quân sự", "lịch sử quân sự"],
      categoryCode: "LSQS",
      issueId: issue1.id
    },
    {
      title: "Ứng dụng trí tuệ nhân tạo trong chỉ huy và điều hành tác chiến",
      abstractVn: "Nghiên cứu xu hướng ứng dụng AI trong hệ thống chỉ huy quân sự hiện đại, đánh giá tác động đối với nghệ thuật quân sự và đề xuất hướng tiếp cận cho Quân đội nhân dân Việt Nam.",
      abstractEn: "Research on trends in AI application in modern military command systems, assessing impact on military arts and proposing approaches for Vietnam People's Army.",
      keywords: ["trí tuệ nhân tạo", "chỉ huy tác chiến", "quân sự hiện đại"],
      categoryCode: "KHQS",
      issueId: issue2.id
    },
    {
      title: "Đổi mới phương pháp đào tạo sĩ quan chiến thuật tại Học viện Quốc phòng",
      abstractVn: "Phân tích thực trạng và đề xuất giải pháp đổi mới phương pháp đào tạo sĩ quan chiến thuật tại Học viện Quốc phòng, đáp ứng yêu cầu của tác chiến hiện đại.",
      abstractEn: "Analysis of the current situation and proposing solutions to innovate tactical officer training methods at the National Defense Academy to meet modern warfare requirements.",
      keywords: ["đào tạo sĩ quan", "Học viện Quốc phòng", "đổi mới phương pháp"],
      categoryCode: "GDQS",
      issueId: issue2.id
    },
    {
      title: "Hợp tác quốc phòng Việt Nam – ASEAN trong bối cảnh an ninh khu vực",
      abstractVn: "Đánh giá thực trạng hợp tác quốc phòng giữa Việt Nam và các quốc gia ASEAN, phân tích những thách thức và cơ hội trong bảo đảm an ninh khu vực.",
      abstractEn: "Assessment of defense cooperation between Vietnam and ASEAN countries, analyzing challenges and opportunities in ensuring regional security.",
      keywords: ["hợp tác quốc phòng", "ASEAN", "an ninh khu vực"],
      categoryCode: "HTQP",
      issueId: issue2.id
    },
    {
      title: "Học viện Quốc phòng với nhiệm vụ nghiên cứu khoa học quân sự",
      abstractVn: "Tổng kết hoạt động nghiên cứu khoa học quân sự của Học viện Quốc phòng năm 2025, định hướng phát triển trong giai đoạn mới.",
      abstractEn: "Summary of military scientific research activities of the National Defense Academy in 2025, orientating development in the new period.",
      keywords: ["Học viện Quốc phòng", "nghiên cứu khoa học", "quân sự"],
      categoryCode: "TINTUC",
      issueId: issue2.id
    }
  ]

  for (let i = 0; i < sampleArticles.length; i++) {
    const article = sampleArticles[i]
    const category = categories.find(c => c.code === article.categoryCode)!
    const useAuthor = i % 2 === 0 ? author : author2

    // Tạo submission
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-${Date.now()}-${i}`,
        title: article.title,
        abstractVn: article.abstractVn,
        abstractEn: article.abstractEn,
        keywords: article.keywords,
        status: 'PUBLISHED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: useAuthor.id
      }
    })

    // Tạo submission version
    await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNo: 1,
        filesetId: `fileset-${submission.id}-v1`,
        changelog: 'Phiên bản đầu tiên'
      }
    })

    // Tạo article
    await prisma.article.create({
      data: {
        submissionId: submission.id,
        issueId: article.issueId,
        pages: `${10 + i * 5}-${15 + i * 5}`,
        doiLocal: `10.59386/ntqs.2024.${i + 1}`,
        htmlBody: `<div class="article-content">
          <h2>${article.title}</h2>
          <div class="abstract">
            <h3>Tóm tắt</h3>
            <p>${article.abstractVn}</p>
          </div>
          <div class="abstract">
            <h3>Abstract</h3>
            <p>${article.abstractEn}</p>
          </div>
          <div class="keywords">
            <strong>Từ khóa:</strong> ${article.keywords.join(', ')}
          </div>
          <div class="content">
            <p>Đây là nội dung mẫu cho bài báo. Trong thực tế, nội dung sẽ được soạn thảo chi tiết hơn...</p>
          </div>
        </div>`,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 500),
        downloads: Math.floor(Math.random() * 100)
      }
    })
  }

  // 6. Seed submissions đang trong quy trình (để dashboard có dữ liệu)
  console.log('📝 Seed submissions đang xử lý...')
  const reviewer = createdUsers.find(u => u.role === 'REVIEWER')!
  const editor = createdUsers.find(u => u.role === 'SECTION_EDITOR')!
  
  // Tạo 5 bài NEW (mới nộp, chưa xử lý)
  for (let i = 0; i < 5; i++) {
    const category = categories[i % categories.length]
    await prisma.submission.create({
      data: {
        code: `SUB-NEW-${Date.now()}-${i}`,
        title: `Bài nộp mới ${i + 1}: Nghiên cứu về ${category.name}`,
        abstractVn: `Đây là tóm tắt tiếng Việt cho bài nghiên cứu mới về ${category.name}. Bài viết phân tích các vấn đề quan trọng và đề xuất giải pháp khả thi.`,
        abstractEn: `This is the English abstract for the new research on ${category.name}. The article analyzes important issues and proposes feasible solutions.`,
        keywords: ['nghiên cứu', category.name.toLowerCase(), 'giải pháp'],
        status: 'NEW',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })
  }

  // Tạo 5 bài UNDER_REVIEW (đang phản biện)
  for (let i = 0; i < 5; i++) {
    const category = categories[(i + 5) % categories.length]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REVIEW-${Date.now()}-${i}`,
        title: `Bài đang phản biện ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt tiếng Việt cho bài viết về ${category.name}. Bài viết này đang được gửi đi phản biện.`,
        abstractEn: `English abstract for the article on ${category.name}. This article is under review.`,
        keywords: ['phản biện', category.name.toLowerCase(), 'đánh giá'],
        status: 'UNDER_REVIEW',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author2.id
      }
    })

    // Tạo submission version
    await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNo: 1,
        filesetId: `fileset-${submission.id}-v1`,
        changelog: 'Phiên bản gửi phản biện'
      }
    })

    // Tạo 2 reviews cho mỗi submission (1 hoàn thành, 1 chưa)
    // Review 1 - Đã hoàn thành
    await prisma.review.create({
      data: {
        submissionId: submission.id,
        reviewerId: reviewer.id,
        roundNo: 1,
        recommendation: i % 2 === 0 ? 'MINOR' : 'ACCEPT',
        score: 8 + (i % 3),
        formJson: {
          comments: `Đây là nhận xét chi tiết của phản biện viên. Bài viết có chất lượng tốt, cần chỉnh sửa một số điểm nhỏ.`,
          strengths: 'Bài viết có cấu trúc rõ ràng, lập luận chặt chẽ.',
          weaknesses: 'Cần bổ sung thêm tài liệu tham khảo.',
          suggestions: 'Nên mở rộng phần thảo luận.'
        },
        submittedAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000) // 1-7 ngày trước
      }
    })

    // Review 2 - Chưa hoàn thành
    if (i < 3) {
      await prisma.review.create({
        data: {
          submissionId: submission.id,
          reviewerId: reviewer.id,
          roundNo: 1
          // Không có submittedAt, recommendation, score, comments - tức là chưa làm
        }
      })
    }
  }

  // Tạo 3 bài REVISION (cần sửa)
  for (let i = 0; i < 3; i++) {
    const category = categories[i]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REVISION-${Date.now()}-${i}`,
        title: `Bài cần chỉnh sửa ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết cần chỉnh sửa về ${category.name}.`,
        abstractEn: `Abstract for revision article on ${category.name}.`,
        keywords: ['chỉnh sửa', category.name.toLowerCase()],
        status: 'REVISION',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })

    // Tạo decision yêu cầu sửa
    await prisma.editorDecision.create({
      data: {
        submissionId: submission.id,
        decidedBy: editor.id,
        roundNo: 1,
        decision: 'MAJOR',
        note: 'Vui lòng chỉnh sửa theo các góp ý của phản biện viên.',
        decidedAt: new Date()
      }
    })
  }

  // Tạo 2 bài ACCEPTED (chấp nhận, chờ xuất bản)
  for (let i = 0; i < 2; i++) {
    const category = categories[i]
    await prisma.submission.create({
      data: {
        code: `SUB-ACCEPTED-${Date.now()}-${i}`,
        title: `Bài đã chấp nhận ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết đã được chấp nhận về ${category.name}.`,
        abstractEn: `Abstract for accepted article on ${category.name}.`,
        keywords: ['chấp nhận', category.name.toLowerCase()],
        status: 'ACCEPTED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author2.id
      }
    })
  }

  // Tạo 2 bài REJECTED (từ chối)
  for (let i = 0; i < 2; i++) {
    const category = categories[i]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REJECTED-${Date.now()}-${i}`,
        title: `Bài bị từ chối ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết bị từ chối về ${category.name}.`,
        abstractEn: `Abstract for rejected article on ${category.name}.`,
        keywords: ['từ chối', category.name.toLowerCase()],
        status: 'REJECTED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })

    await prisma.editorDecision.create({
      data: {
        submissionId: submission.id,
        decidedBy: editor.id,
        roundNo: 1,
        decision: 'REJECT',
        note: 'Bài viết không đáp ứng yêu cầu của tạp chí.',
        decidedAt: new Date()
      }
    })
  }

  // 7. Tạo audit logs
  console.log('📋 Seed audit logs...')
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: author.id,
        action: 'Nộp bài mới',
        object: 'Submission SUB-NEW-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: editor.id,
        action: 'Gán phản biện',
        object: 'Submission SUB-REVIEW-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: reviewer.id,
        action: 'Hoàn thành phản biện',
        object: 'Review #1',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        actorId: editor.id,
        action: 'Quyết định chấp nhận',
        object: 'Submission SUB-ACCEPTED-1',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]
  })

  console.log('✅ Seed thành công!')
  console.log(`📚 Đã tạo ${categories.length} chuyên mục`)
  console.log(`👥 Đã tạo ${createdUsers.length} người dùng`)
  console.log(`📖 Đã tạo 2 số tạp chí`)
  console.log(`📰 Đã tạo ${sampleArticles.length} bài báo đã xuất bản`)
  console.log(`📝 Đã tạo 19 submissions đang xử lý (5 NEW, 5 UNDER_REVIEW, 3 REVISION, 2 ACCEPTED, 2 REJECTED, 2 IN_PRODUCTION)`)
  console.log(`⭐ Đã tạo 8 reviews`)
  console.log(`📋 Đã tạo audit logs`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
