import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdminAccounts() {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['SYSADMIN', 'EIC', 'MANAGING_EDITOR'] }
    },
    select: {
      email: true,
      role: true,
      status: true,
      isActive: true,
      emailVerified: true,
      approvedAt: true,
      approvedBy: true
    },
    orderBy: { role: 'asc' }
  })
  
  console.log('\n=== ADMIN ACCOUNTS STATUS ===' )
  console.log(`Tìm thấy ${admins.length} tài khoản quản trị\n`)
  
  admins.forEach(admin => {
    console.log(`📧 ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   Status: ${admin.status}`)
    console.log(`   Active: ${admin.isActive}`)
    console.log(`   Email Verified: ${admin.emailVerified}`)
    console.log(`   Approved By: ${admin.approvedBy || 'N/A'}`)
    console.log(`   Approved At: ${admin.approvedAt ? admin.approvedAt.toISOString() : 'N/A'}`)
    console.log('')
  })
  
  // Check if all admin accounts are properly configured
  const allApproved = admins.every(a => a.status === 'APPROVED' && a.isActive && a.emailVerified)
  
  if (allApproved) {
    console.log('✅ Tất cả tài khoản quản trị đã được kích hoạt đúng cách!')
  } else {
    console.log('⚠️  Cảnh báo: Một số tài khoản quản trị chưa được kích hoạt!')
  }
  
  await prisma.$disconnect()
}

checkAdminAccounts().catch(console.error)
