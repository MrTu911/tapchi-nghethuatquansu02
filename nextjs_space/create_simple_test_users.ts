import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Bắt đầu tạo tài khoản test cho tất cả các role...\n');
  
  // Tạo tài khoản test cho tất cả các role trong hệ thống
  const users = [
    { 
      email: 'admin@test.com', 
      password: 'Admin123!@#', 
      fullName: 'Quản trị viên hệ thống', 
      role: 'SYSADMIN', 
      org: 'Tạp chí HCQS',
      phone: '0901234567',
      bio: 'Quản trị hệ thống tạp chí điện tử HCQS'
    },
    { 
      email: 'eic@test.com', 
      password: 'Eic123!@#', 
      fullName: 'Nguyễn Văn Tổng', 
      role: 'EIC', 
      org: 'Tạp chí HCQS',
      phone: '0901234568',
      bio: 'Tổng biên tập tạp chí'
    },
    {
      email: 'managing@test.com',
      password: 'Managing123!@#',
      fullName: 'Trần Thị Điều Hành',
      role: 'MANAGING_EDITOR',
      org: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      phone: '0901234569',
      bio: 'Thư ký tòa soạn'
    },
    {
      email: 'deputy@test.com',
      password: 'Deputy123!@#',
      fullName: 'Phạm Văn Phó',
      role: 'DEPUTY_EIC',
      org: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      phone: '0901234570',
      bio: 'Phó Tổng biên tập'
    },
    { 
      email: 'editor@test.com', 
      password: 'Editor123!@#', 
      fullName: 'Lê Văn Biên', 
      role: 'SECTION_EDITOR', 
      org: 'Tạp chí HCQS',
      phone: '0901234570',
      bio: 'Biên tập chuyên mục Quản trị & Chiến lược'
    },
    { 
      email: 'layout@test.com', 
      password: 'Layout123!@#', 
      fullName: 'Phạm Thị Kỹ Thuật', 
      role: 'LAYOUT_EDITOR', 
      org: 'Tạp chí HCQS',
      phone: '0901234571',
      bio: 'Biên tập kỹ thuật và trình bày'
    },
    { 
      email: 'reviewer@test.com', 
      password: 'Reviewer123!@#', 
      fullName: 'PGS.TS Hoàng Văn Phản Biện', 
      role: 'REVIEWER', 
      org: 'Học viện Quốc phòng',
      phone: '0901234572',
      bio: 'Phó Giáo sư, Tiến sĩ chuyên ngành Quản trị chiến lược',
      expertise: ['Chiến lược quân sự', 'Nghệ thuật tác chiến', 'Chiến dịch học'],
      keywords: ['chiến lược', 'nghệ thuật quân sự', 'tác chiến', 'quân sự', 'chiến dịch']
    },
    { 
      email: 'reviewer2@test.com', 
      password: 'Reviewer123!@#', 
      fullName: 'TS. Võ Thị An Ninh', 
      role: 'REVIEWER', 
      org: 'Đại học Quốc gia',
      phone: '0901234573',
      bio: 'Tiến sĩ chuyên ngành Công nghệ thông tin',
      expertise: ['Công nghệ thông tin', 'An ninh mạng', 'Bảo mật thông tin'],
      keywords: ['CNTT', 'security', 'network', 'information security', 'cyber']
    },
    { 
      email: 'author@test.com', 
      password: 'Author123!@#', 
      fullName: 'ThS. Đặng Văn Tác Giả', 
      role: 'AUTHOR', 
      org: 'Học viện Kỹ thuật Quân sự',
      phone: '0901234574',
      bio: 'Thạc sĩ, Nghiên cứu sinh'
    },
    { 
      email: 'author2@test.com', 
      password: 'Author123!@#', 
      fullName: 'NCV. Bùi Thị Nghiên Cứu', 
      role: 'AUTHOR', 
      org: 'Trường Đại học Bách Khoa',
      phone: '0901234575',
      bio: 'Nghiên cứu viên chuyên ngành Kỹ thuật'
    },
    { 
      email: 'security@test.com', 
      password: 'Security123!@#', 
      fullName: 'Vũ Văn Bảo Mật', 
      role: 'SECURITY_AUDITOR', 
      org: 'Tạp chí HCQS',
      phone: '0901234576',
      bio: 'Kiểm toán an ninh hệ thống'
    },
    { 
      email: 'reader@test.com', 
      password: 'Reader123!@#', 
      fullName: 'Nguyễn Độc Giả', 
      role: 'READER', 
      org: 'Công chúng',
      phone: '0901234577',
      bio: 'Độc giả quan tâm đến nghiên cứu khoa học'
    }
  ];
  
  console.log('═'.repeat(80));
  console.log('  DANH SÁCH TÀI KHOẢN TEST');
  console.log('═'.repeat(80));
  
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash,
        fullName: userData.fullName,
        org: userData.org,
        role: userData.role as any,
        phone: userData.phone,
        bio: userData.bio,
        isActive: true
      },
      create: {
        email: userData.email,
        fullName: userData.fullName,
        org: userData.org,
        role: userData.role as any,
        phone: userData.phone,
        bio: userData.bio,
        passwordHash,
        isActive: true
      }
    });
    
    // Nếu là reviewer, tạo hoặc cập nhật ReviewerProfile
    if (userData.role === 'REVIEWER' && userData.expertise) {
      await prisma.reviewerProfile.upsert({
        where: { userId: user.id },
        update: {
          expertise: userData.expertise || [],
          keywords: userData.keywords || []
        },
        create: {
          userId: user.id,
          expertise: userData.expertise || [],
          keywords: userData.keywords || []
        }
      });
    }
    
    console.log(`\n✅ ${user.role}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mật khẩu: ${userData.password}`);
    console.log(`   Họ tên: ${user.fullName}`);
    console.log(`   Đơn vị: ${user.org}`);
    if (userData.role === 'REVIEWER' && userData.expertise) {
      console.log(`   Chuyên môn: ${userData.expertise.join(', ')}`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Hoàn thành! Tất cả tài khoản test đã được tạo/cập nhật');
  console.log('═'.repeat(80));
  console.log('\n💡 Lưu ý: Tất cả mật khẩu đều có định dạng: [Role]123!@#');
  console.log('   Ví dụ: Admin123!@#, Reviewer123!@#, Author123!@#\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
