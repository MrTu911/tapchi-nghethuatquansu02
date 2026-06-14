
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for Phase 5 - Publishing & Production...')

  // Create test users with strong passwords
  const users = [
    {
      fullName: 'Admin Hệ thống',
      email: 'admin@hcqs.edu.vn',
      password: 'Admin@123',
      role: 'SYSADMIN',
      org: 'Học viện Quốc phòng',
      bio: 'Quản trị viên hệ thống'
    },
    {
      fullName: 'Tổng Biên tập',
      email: 'eic@hcqs.edu.vn',
      password: 'Editor@123',
      role: 'EIC',
      org: 'Học viện Quốc phòng',
      bio: 'Tổng Biên tập tạp chí'
    },
    {
      fullName: 'Biên tập điều hành',
      email: 'managing@hcqs.edu.vn',
      password: 'Manager@123',
      role: 'MANAGING_EDITOR',
      org: 'Học viện Quốc phòng',
      bio: 'Biên tập điều hành'
    },
    {
      fullName: 'Biên tập chuyên mục',
      email: 'editor@hcqs.edu.vn',
      password: 'Section@123',
      role: 'SECTION_EDITOR',
      org: 'Học viện Quốc phòng',
      bio: 'Biên tập chuyên mục Công nghệ'
    },
    {
      fullName: 'Biên tập Layout',
      email: 'layout@hcqs.edu.vn',
      password: 'Layout@123',
      role: 'LAYOUT_EDITOR',
      org: 'Học viện Quốc phòng',
      bio: 'Biên tập dàn trang và sản xuất'
    },
    {
      fullName: 'Phản biện viên',
      email: 'reviewer@hcqs.edu.vn',
      password: 'Reviewer@123',
      role: 'REVIEWER',
      org: 'Đại học Quốc gia Hà Nội',
      bio: 'Phản biện chuyên ngành Hậu cần'
    },
    {
      fullName: 'Tác giả',
      email: 'author@hcqs.edu.vn',
      password: 'Author@123',
      role: 'AUTHOR',
      org: 'Học viện Quốc phòng',
      bio: 'Tác giả nghiên cứu'
    },
    {
      fullName: 'Kiểm tra viên Bảo mật',
      email: 'security@hcqs.edu.vn',
      password: 'Security@123',
      role: 'SECURITY_AUDITOR',
      org: 'Học viện Quốc phòng',
      bio: 'Kiểm tra viên bảo mật hệ thống'
    }
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`✓ User ${userData.email} already exists, updating password...`)
      const passwordHash = await bcrypt.hash(userData.password, 10)
      await prisma.user.update({
        where: { email: userData.email },
        data: { passwordHash }
      })
    } else {
      console.log(`✓ Creating user: ${userData.email}`)
      const passwordHash = await bcrypt.hash(userData.password, 10)
      await prisma.user.create({
        data: {
          fullName: userData.fullName,
          email: userData.email,
          passwordHash,
          role: userData.role as any,
          org: userData.org,
          bio: userData.bio,
          isActive: true
        }
      })
    }
  }

  // Create Volume and Issue if they don't exist
  let volume = await prisma.volume.findFirst({
    where: { volumeNo: 1 }
  })

  if (!volume) {
    console.log('✓ Creating Volume 1 - Year 2025')
    volume = await prisma.volume.create({
      data: {
        volumeNo: 1,
        year: 2025,
        title: 'Tập 1 - Năm 2025',
        description: 'Tập đầu tiên của tạp chí năm 2025'
      }
    })
  } else {
    console.log('✓ Volume 1 already exists')
  }

  let issue = await prisma.issue.findFirst({
    where: { volumeId: volume.id, number: 1 }
  })

  if (!issue) {
    console.log('✓ Creating Issue 1 of Volume 1')
    issue = await prisma.issue.create({
      data: {
        volumeId: volume.id,
        number: 1,
        year: 2025,
        title: 'Số 1 - Tháng 1/2025',
        description: 'Số đầu tiên của tạp chí năm 2025',
        publishDate: new Date('2025-01-15'),
        status: 'PUBLISHED'
      }
    })
  } else {
    console.log('✓ Issue 1 already exists')
  }

  console.log('\n✅ Phase 5 seeding completed!')
  console.log('\n📋 Test Accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  users.forEach(user => {
    console.log(`\n👤 ${user.fullName} (${user.role})`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${user.password}`)
  })
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 All passwords follow the strong password policy:')
  console.log('   - Minimum 8 characters')
  console.log('   - At least 1 uppercase letter')
  console.log('   - At least 1 lowercase letter')
  console.log('   - At least 1 number')
  console.log('   - At least 1 special character')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
