import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Đang xóa toàn bộ dữ liệu liên quan...');
  
  // Xóa các bảng theo thứ tự phụ thuộc (từ con đến cha)
  console.log('Đang xóa dữ liệu...');
  
  // Xóa các bảng liên quan đến Article trước
  await prisma.articleMetrics.deleteMany({});
  await prisma.articleVersion.deleteMany({});
  await prisma.featuredArticle.deleteMany({});
  console.log('✅ Đã xóa các dữ liệu liên quan đến bài viết');
  
  // Xóa Article
  await prisma.article.deleteMany({});
  console.log('✅ Đã xóa các bài viết (articles)');
  
  // Xóa Review, Deadline và Submission
  await prisma.review.deleteMany({});
  console.log('✅ Đã xóa các đánh giá (reviews)');
  
  await prisma.deadline.deleteMany({});
  console.log('✅ Đã xóa các deadline');
  
  await prisma.submission.deleteMany({});
  console.log('✅ Đã xóa các bài nộp (submissions)');
  
  // Xóa các dữ liệu liên quan khác
  await prisma.notification.deleteMany({});
  console.log('✅ Đã xóa các thông báo (notifications)');
  
  await prisma.message.deleteMany({});
  console.log('✅ Đã xóa các tin nhắn (messages)');
  
  await prisma.auditLog.deleteMany({});
  console.log('✅ Đã xóa các log (audit logs)');
  
  // Xóa các bảng liên quan đến User
  await prisma.reviewerProfile.deleteMany({});
  console.log('✅ Đã xóa các profile phản biện');
  
  await prisma.securityAlert.deleteMany({});
  console.log('✅ Đã xóa các security alerts');
  
  await prisma.userSession.deleteMany({});
  console.log('✅ Đã xóa các sessions');
  
  await prisma.twoFactorAuth.deleteMany({});
  console.log('✅ Đã xóa các two factor auth');
  
  await prisma.twoFactorToken.deleteMany({});
  console.log('✅ Đã xóa các two factor tokens');
  
  await prisma.passwordResetToken.deleteMany({});
  console.log('✅ Đã xóa các password reset tokens');
  
  await prisma.apiToken.deleteMany({});
  console.log('✅ Đã xóa các API tokens');
  
  await prisma.oRCIDProfile.deleteMany({});
  console.log('✅ Đã xóa các ORCID profiles');
  
  await prisma.pushSubscription.deleteMany({});
  console.log('✅ Đã xóa các push subscriptions');
  
  await prisma.uploadedFile.deleteMany({});
  console.log('✅ Đã xóa các uploaded files');
  
  await prisma.roleEscalationRequest.deleteMany({});
  console.log('✅ Đã xóa các role escalation requests');
  
  // Cuối cùng xóa users
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`✅ Đã xóa ${deletedUsers.count} tài khoản người dùng`);

  console.log('\n👤 Đang tạo lại các tài khoản test...\n');

  // Mật khẩu mạnh theo quy định bảo mật: có chữ hoa, chữ thường, số, ký tự đặc biệt, độ dài >=8
  const securePassword = 'TapChi@2025';
  const hashedPassword = await bcrypt.hash(securePassword, 12);

  const testUsers = [
    {
      email: 'admin@tapchintqsvn.edu.vn',
      fullName: 'Quản trị hệ thống',
      role: Role.SYSADMIN,
      description: 'Tài khoản quản trị hệ thống - có toàn quyền'
    },
    {
      email: 'tongbientap@tapchintqsvn.edu.vn',
      fullName: 'Tổng Biên Tập',
      role: Role.EIC,
      description: 'Tài khoản Tổng biên tập - quản lý toàn bộ quy trình biên tập'
    },
    {
      email: 'bientapchinh@tapchintqsvn.edu.vn',
      fullName: 'Biên Tập Chính',
      role: Role.MANAGING_EDITOR,
      description: 'Tài khoản biên tập chính - điều phối quy trình biên tập'
    },
    {
      email: 'photongbientap@tapchintqsvn.edu.vn',
      fullName: 'Phó Tổng Biên Tập',
      role: Role.DEPUTY_EIC,
      description: 'Tài khoản Phó Tổng biên tập - giám sát toàn tòa soạn, không ký xuất bản cuối'
    },
    {
      email: 'bientap@tapchintqsvn.edu.vn',
      fullName: 'Biên Tập Chuyên Mục',
      role: Role.SECTION_EDITOR,
      description: 'Tài khoản biên tập chuyên mục - quản lý chuyên mục cụ thể'
    },
    {
      email: 'tacgia@tapchintqsvn.edu.vn',
      fullName: 'Tác Giả Thường Trực',
      role: Role.AUTHOR,
      description: 'Tài khoản tác giả - gửi và quản lý bài viết của mình'
    },
    {
      email: 'phanbien@tapchintqsvn.edu.vn',
      fullName: 'Phản Biện Viên',
      role: Role.REVIEWER,
      description: 'Tài khoản phản biện - đánh giá và phản biện bài viết'
    },
    {
      email: 'kiemtoan@tapchintqsvn.edu.vn',
      fullName: 'Kiểm Toán Bảo Mật',
      role: Role.SECURITY_AUDITOR,
      description: 'Tài khoản kiểm toán bảo mật - giám sát hệ thống'
    },
    {
      email: 'chihuy@tapchintqsvn.edu.vn',
      fullName: 'Chỉ huy Học viện',
      role: Role.COMMANDER,
      description: 'Tài khoản Chỉ huy Học viện - giám sát toàn diện tạp chí'
    }
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        fullName: userData.fullName,
        role: userData.role,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        isActive: true,
        org: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
        phone: '0123456789',
        approvedAt: new Date(),
        approvedBy: 'system',
        createdAt: new Date()
      }
    });

    console.log(`✅ ${userData.description}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Vai trò: ${user.role}`);
    console.log(`   Trạng thái: ${user.status}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 HOÀN TẤT TẠO TÀI KHOẢN TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 THÔNG TIN ĐĂNG NHẬP:');
  console.log('');
  console.log('Tất cả tài khoản sử dụng mật khẩu: TapChi@2025');
  console.log('');
  console.log('Danh sách email:');
  testUsers.forEach(user => {
    console.log(`  • ${user.email} (${user.role})`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Tất cả tài khoản đã được KÍCH HOẠT và XÁC THỰC EMAIL');
  console.log('✅ Mật khẩu đáp ứng yêu cầu bảo mật:');
  console.log('   - Có chữ hoa (T, C)');
  console.log('   - Có chữ thường (aphi)');
  console.log('   - Có số (2025)');
  console.log('   - Có ký tự đặc biệt (@)');
  console.log('   - Độ dài >= 8 ký tự');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
